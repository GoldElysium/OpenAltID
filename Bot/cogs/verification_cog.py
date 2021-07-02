import os
import secrets
import time
from datetime import datetime, timedelta

from discord.ext import tasks, commands
import redis
from loguru import logger as log
from redis.exceptions import LockError

from database.mongomanager import get_guild_info
from database.redismanager import get_redis


async def initiate_verification(redisClient, member, guild_settings):
    if not guild_settings.enabled:
        return False
    if guild_settings.verification_role_ID is None:
        await member.send(f"The verification role has not been set up in {member.guild.name}.")
        log.error("The guild does not have a verification role set!")
        return False
    # check account age
    mintime = datetime.utcnow() - timedelta(days=guild_settings.verification_age)
    if member.created_at <= mintime:
        # Dont need to verify
        role = member.guild.get_role(int(guild_settings.verification_role_ID))
        try:
            await member.add_roles(role)
        except Exception as err:
            log.error(err)
            await member.send(
                f"An error occured while giving you a role, please contact server admins for {member.guild.name}")
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
        await member.send(
            "An error occured while queuing your verification. Please try again later. If the problem persists "
            "contact server admins.")
    verify_link = f"{os.environ.get('FRONTEND_HOST')}/verify/{unique_ID}"
    if redisClient.get(f"uuid:{unique_ID}") == f"{member.id}:{member.guild.id}":

        await member.send(
            f"Thank you for joining! __You must connect social media accounts to your Discord first__, then go to "
            f"this link to verify: {verify_link}. The link will be valid for 1hr, "
            f"after which you will need to request a new one.\nSupported account types: "
            f"\nYouTube\nTwitter\nTwitch\nReddit "
        )
    else:
        await member.send("An error occured while queuing your verification. Please try again later. If the "
                          "problem persists contact server admins.")
    return True


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
        guild_id = ctx.member.guild.id
        guild_settings = await get_guild_info(guild_id)
        await initiate_verification(self.redisClient, ctx.member, guild_settings)
        await ctx.message.add_reaction("✔")
        await ctx.message.delete(delay=5)

    @tasks.loop(seconds=5.0)
    async def check_completed(self):
        key_prefix = "complete"
        '''
            Format for completed verification keys is: complete:{userid}:{guildid}
            Value must be either 'true' or 'false'
            '''
        for key in self.redisClient.scan_iter(f"{key_prefix}:*"):
            try:
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
                    else:
                        key_split = key.split(':')
                        user_id = key_split[1]
                        guild_id = key_split[2]
                        guild = self.bot.get_guild(int(guild_id))
                        member = guild.get_member(int(user_id))
                        self.redisClient.delete(key)
                        await member.send(f"You did not pass verification for {guild.name}")

            except LockError as e:
                log.exception(f"Did not acquire lock for {key}. {e}")
            except Exception as e:
                log.error(f"Failed to get keys! {e}")

    @check_completed.before_loop
    async def before_printer(self):
        log.info("Verification loop waiting for bot to be ready...")
        await self.bot.wait_until_ready()
