from loguru import logger as log
import os

import discord
import mongoengine
from discord.ext import commands, tasks
import secrets
from database.dbmanager import VerificationData

intents = discord.Intents.default()
intents.members = True

bot_token = os.environ.get('BOT_TOKEN')


def connect():
    log.info('Connecting to MongoDB...')
    try:
        db_username = os.environ.get('DB_USER')
        db_password = os.environ.get('DB_PASS')
        db_name = os.environ.get('DB_NAME')
        db_host = f"mongodb+srv://{db_username}:{db_password}@hefsverificationbot.lgjlc.mongodb.net/{db_name}?retryWrites=true&w=majority"
        mongoengine.connect(db_name, host=db_host)
        log.success("Connected to database.")
    except Exception as e:
        log.critical("Unable to connect to database!")
        log.critical(e)


bot = commands.Bot(description="Ironic Bot by Perfect_Irony#5196", command_prefix="$", pm_help=False, intents=intents)


@bot.event
async def on_ready():
    log.info('Logged in as ' + str(bot.user.name) + ' (ID:' + str(bot.user.id) + ') | Connected to '
             + str(len(bot.guilds)) + ' servers | Connected to ' + str(len(set(bot.get_all_members())))
             + ' users')

    log.success("Bot is now ready.")
    return await bot.change_presence(activity=discord.Game('with bits'))


@bot.event
async def on_member_update(member_before, member_after):
    log.debug(f"Member update in \"{member_after.guild.name}\" "
              f"for user \"{member_after.name}#{member_after.discriminator}\"")

    if member_before.status != member_after.status:
        log.debug(f"Status: {member_before.status} >>> {member_after.status}")

    if member_before.activity != member_after.activity:
        log.debug(f"Activity: {member_before.activity} >>> {member_after.activity}")

    if member_before.roles != member_after.roles:
        log.debug(f"Roles: {member_before.roles} >>> {member_after.roles}")

    if member_before.pending != member_after.pending:
        log.debug(f"Pending: {member_before.pending} >>> {member_after.pending}")

    if member_before.nick != member_after.nick:
        log.debug(f"Nickname: {member_before.nick} >>> {member_after.nick}")

    #   Member passed screening
    #   Check the database for server settings and if the user is lower
    #   age than the min age for verification, send them a link to verify
    #   otherwise, give them the role set up in the server for verification
    if member_before.pending is True and member_after.pending is False:
        log.debug(f"User {member_after.name}#{member_after.discriminator} passed screening.")
        not_inserted = True
        unique_id = secrets.token_urlsafe(8)
        # Get a unique urlsafe identifier and insert the information into
        # the database so it get be queried from frontend
        while not_inserted:
            if not VerificationData.objects(verification_ID=unique_id):
                new_entry = VerificationData(verification_ID=unique_id, guild_ID=member_after.guild.id,
                                             user_ID=member_after.id)
                new_entry.save()
                not_inserted = False
            else:
                unique_id = secrets.token_urlsafe(8)

        verify_link = f"https://verify.holoen.fans/verify/{unique_id}"
        await member_after.send(f"Thank you for joining! Please go to this link to verify: {verify_link}. The link will be valid for 1hr, after which you will need to request a new one.")


@bot.event
async def on_member_join(member):
    log.debug(f"{member.name}#{member.discriminator} joined the guild \"{member.guild.name}\"")


def run_client(*args, **kwargs):
    while True:
        connect()
        initial_extensions = []

        for extension in initial_extensions:
            try:
                bot.load_extension(extension)
            except Exception as e:
                log.critical(f'Failed to load extension {extension}. error: ' + str(e))

                bot.load_extension('Bot_Events.Misc_Events')

        try:
            bot.run(bot_token)
        finally:
            bot.clear()
            log.warning('restarting')


run_client()
