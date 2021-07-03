import os

import discord
import mongoengine
from discord.ext import commands
from dotenv import load_dotenv
from loguru import logger as log
from cogs.management_cog import Management
from cogs.verification_cog import Verification, initiate_verification
from database.mongomanager import insert_guild, get_guild_info
from database.redismanager import get_redis

load_dotenv()
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


bot = commands.Bot(description="Open/Alt.ID", command_prefix=get_prefix, pm_help=False,
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
    guild_id = member_after.guild.id
    guild_settings = await get_guild_info(guild_id)
    if guild_settings.verify_on_screening:
        if member_before.pending is True and member_after.pending is False:
            await initiate_verification(redisClient, member_after, guild_settings)


@bot.event
async def on_guild_join(guild):
    log.debug(f"Loading guild '{guild.name}' with ID '{guild.id}'")
    success = await insert_guild(guild.id)
    if not success:
        log.critical(f"Failed to insert {guild.name}")


@bot.event
async def on_member_join(member):
    guild_id = member.guild.id
    guild_settings = await get_guild_info(guild_id)
    if not guild_settings.verify_on_screening:
        await initiate_verification(redisClient, member, guild_settings)


def run_client():
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
