import os
import secrets
import time
from datetime import datetime, timedelta

from discord import Forbidden
from discord.ext import tasks, commands
import redis
from loguru import logger as log
from redis.exceptions import LockError
from database.mongomanager import get_guild_info
from database.redismanager import get_redis


async def initiate_verification(redisClient, member, guild_settings, enabled):
    if not enabled:
        return 'Not Enabled.'
    if guild_settings.verification_role_ID is None:
        await member.send(f"The verification role has not been set up in {member.guild.name}.")
        log.error("The guild does not have a verification role set!")
        return 'No verification role.'

    mintime = datetime.utcnow() - timedelta(days=guild_settings.verification_age)
    if member.created_at <= mintime:
        # Dont need to verify
        role = member.guild.get_role(int(guild_settings.verification_role_ID))
        try:
            await member.add_roles(role)
            await member.send()
        except Exception as err:
            log.error(err)
            await member.send(
                f"An error occured while giving you the verification role, please contact server admins for {member.guild.name}")
        return False

    retry = True
    unique_ID = secrets.token_urlsafe(8)
    """
    Keys: uuid:[unique_string]
    Values: [member_id]:[guild_id]
    """
    try:
        while retry:
            if redisClient.get(f"uuid:{unique_ID}") is None:
                redisClient.set(f"uuid:{unique_ID}", f"{member.id}:{member.guild.id}", ex=3600)
                retry = False
            else:
                unique_ID = secrets.token_urlsafe(8)
    except Exception as err:
        log.error(err)
        await member.send("Internal server error while adding verification to redis queue.")
        return "Internal Redis error"

    verify_link = f"{os.environ.get('FRONTEND_HOST')}/verify/{unique_ID}"
    if redisClient.get(f"uuid:{unique_ID}") == f"{member.id}:{member.guild.id}":
        try:
            await member.send(
                f"Thank you for joining! __You must connect social media accounts to your Discord first__, then go to "
                f"this link to verify: {verify_link}. The link will be valid for 1hr, "
                f"after which you will need to request a new one.\nSupported account types: "
                f"\nYouTube\nTwitter\nTwitch\nReddit "
            )
            return True
        except Forbidden as e:
            return "DMs are not open, please allow DMs and try again."
    else:
        await member.send("Internal server error while adding verification to redis queue.")
        return "Internal Redis error"


class Verification(commands.Cog):
    def __init__(self, bot):
        self.index = 0
        self.bot = bot
        self.check_completed.start()
        self.redisClient = get_redis()
        log.success("Connected to Redis.")

    def cog_unload(self):
        self.check_completed.cancel()

    @commands.command(name="verify")
    async def manual_verify(self, ctx):
        await ctx.message.add_reaction("✅")
        guild_id = ctx.guild.id
        log.debug(guild_id)
        try:
            guild_settings = await get_guild_info(guild_id)
            # Always enable it here
            queued = await initiate_verification(self.redisClient, ctx.author, guild_settings, True)
            if queued is True:
                bot_msg = await ctx.channel.send("A verification link has been sent!")
            else:
                bot_msg = await ctx.channel.send(f"Something went wrong: {queued}")
        except Exception as e:
            bot_msg = await ctx.channel.send(f"An error occured while queuing verification: {e}")
            log.error(e)

    @tasks.loop(seconds=5.0)
    async def check_completed(self):
        key_prefix = "complete"
        '''
            Format for completed verification keys is: complete:{userid}:{guildid}
            Value must be either 'true' or 'false'
            '''
        try:
            for key in self.redisClient.scan_iter(f"{key_prefix}:*"):
                with self.redisClient.lock("lock:" + key, blocking_timeout=5):
                    log.debug(f"Acquired lock for {key}.")
                    if self.redisClient.get(key) == "true":
                        key_split = key.split(':')
                        user_id = key_split[1]
                        guild_id = key_split[2]
                        guild = self.bot.get_guild(int(guild_id))
                        member = guild.get_member(int(user_id))
                        guild_settings = await get_guild_info(guild_id)
                        if guild_settings.verification_role_ID is None:
                            await member.send(f"The verification role has not been set up in {guild.name}.")
                            log.error("The guild does not have a verification role set!")
                            return
                        role = guild.get_role(int(guild_settings.verification_role_ID))
                        await member.add_roles(role)
                        self.redisClient.delete(key)
                        await member.send(f"You have been verified in {guild.name}")
                        log.info(f"User: {user_id} was verified in {guild_id}")
                        if guild_settings.verification_logs_channel_ID != 0:
                            channel = self.bot.get_channel(int(guild_settings.verification_logs_channel_ID))
                            channel.send(f"<@{user_id}> was verified.")
                    else:
                        key_split = key.split(':')
                        user_id = key_split[1]
                        guild_id = key_split[2]
                        guild = self.bot.get_guild(int(guild_id))
                        member = guild.get_member(int(user_id))
                        self.redisClient.delete(key)
                        await member.send(f"You did not pass verification for {guild.name}")
                        log.info(f"User: {user_id} was NOT verified in {guild_id}")
                        if guild_settings.verification_logs_channel_ID != 0:
                            channel = self.bot.get_channel(int(guild_settings.verification_logs_channel_ID))
                            channel.send(f"<@{user_id}> failed to pass verification.")
        except LockError as e:
            log.exception(f"Did not acquire lock for {key}. {e}")
        except Exception as e:
            log.error(f"Failed to get keys! {e}")

    @check_completed.before_loop
    async def before_printer(self):
        log.info("Verification loop waiting for bot to be ready...")
        await self.bot.wait_until_ready()
