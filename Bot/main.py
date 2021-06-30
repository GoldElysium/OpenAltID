import datetime
import secrets
import os

import discord
import mongoengine
from discord.ext import commands
from dotenv import load_dotenv
from loguru import logger as log

load_dotenv()

from cogs.management_cog import Management
from cogs.verification_cog import Verification
from database.mongomanager import insert_verification_data, insert_guild, get_guild_info
from database.redismanager import get_redis

redisClient = get_redis()

intents = discord.Intents.default()
intents.members = True
bot_token = os.environ.get('BOT_TOKEN')
if bot_token is None:
    log.critical("NO BOT TOKEN SUPPLIED")
    exit(0)


def connect():
    log.info('Connecting to MongoDB...')
    try:
        db_name = os.environ.get('DB_NAME')
        db_host = os.environ.get('DB_HOST')
        mongoengine.connect(db_name, host=db_host)
        log.success("Connected to database.")
    except Exception as e:
        log.critical(f"Unable to connect to database! {e}")


def get_prefix(bot, message):
    return "$"


bot = commands.Bot(description="Ironic Bot by Perfect_Irony#5196", command_prefix=get_prefix, pm_help=False,
                   intents=intents)


@bot.event
async def on_ready():
    log.info('Logged in as ' + str(bot.user.name) + ' (ID:' + str(bot.user.id) + ') | Connected to '
             + str(len(bot.guilds)) + ' servers | Connected to ' + str(len(set(bot.get_all_members())))
             + ' users')

    log.info("Loading guilds!")

    for guild in bot.guilds:
        log.debug(f"Loading guild '{guild.name}' with ID '{guild.id}'")
        success = await insert_guild(guild.id)
        if not success:
            log.critical(f"Failed to insert {guild.name}")

    log.success("Bot is now ready.")
    return await bot.change_presence(activity=discord.Game('with bits'))


@bot.event
async def on_member_update(member_before, member_after):
    #   Member passed screening
    #   Check the database for server settings and if the user is lower
    #   age than the min age for verification, send them a link to verify
    #   otherwise, give them the role set up in the server for verification

    if member_before.pending is True and member_after.pending is False:
        guild_id = member_after.guild.id
        guild_settings = await get_guild_info(guild_id)

        log.debug(guild_settings)

        if not guild_settings.enabled:
            log.debug("Bot is not enabled.")
            return

        # check account age
        mintime = datetime.datetime.utcnow() - datetime.timedelta(days=guild_settings.verification_age)
        if member_after.created_at <= mintime:
            # Dont need to verify
            if guild_settings.verification_role_ID is None:
                await member_after.send(f"The verification role has not been set up in {member_after.guild.name}.")
                log.error("The guild does not have a verification role set!")
                return
            role = member_after.guild.get_role(int(guild_settings.verification_role_ID))
            await member_after.add_roles(role)
            return

        if guild_settings.verification_role_ID is None:
            await member_after.send(f"The verification role has not been set up in {member_after.guild.name}.")
            log.error("The guild does not have a verification role set!")
            return
        role = member_after.guild.get_role(int(guild_settings.verification_role_ID))
        await member_after.add_roles(role)

        log.debug(f"User {member_after.name}#{member_after.discriminator} passed screening.")

        retry = True
        unique_ID = secrets.token_urlsafe(8)
        """
        Keys: uuid:[unique_string]
        Values: [member_id]:[guild_id]
        """
        while retry:
            if redisClient.get(f"uuid:{unique_ID}") is None:
                redisClient.set(f"uuid:{unique_ID}", f"{member_after.id}:{member_after.guild.id}", ex=3600)
                log.debug(f"Verification queued with key 'uuid:{unique_ID}' and value '{redisClient.get(f'uuid:{unique_ID}')}'")
                retry = False
            else:
                # reset the uuid if it already exists
                unique_ID = secrets.token_urlsafe(8)

        log.debug(f"UUID: {unique_ID}")
        verify_link = f"{os.environ.get('FRONTEND_HOST')}/verify/{unique_ID}"
        if redisClient.get(f"uuid:{unique_ID}") == f"{member_after.id}:{member_after.guild.id}":
            await member_after.send(
                f"Thank you for joining! __You must connect social media accounts to your Discord first__, then go to "
                f"this link to verify: {verify_link}. The link will be valid for 1hr, "
                f"after which you will need to request a new one.\nSupported account types: "
                f"\nYouTube\nTwitter\nTwitch\nReddit "
            )
        else:
            await member_after.send("An error occured while queuing your verification. Please try again later. If the problem persists contact server admins.")


@bot.event
async def on_member_join(member):
    log.debug(f"{member.name}#{member.discriminator} joined the guild \"{member.guild.name}\"")


def run_client(*args, **kwargs):
    while True:
        connect()
        try:
            bot.add_cog(Verification(bot))
            bot.add_cog(Management(bot))
            # bot.add_cog(Music(bot))
        except Exception as e:
            log.critical(f'Error while adding initializing cogs! {e}')

        try:
            bot.run(bot_token)
        finally:
            bot.clear()
            log.warning('The bot is restarting!')


run_client()
