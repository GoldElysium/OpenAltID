import datetime
import math
import secrets
from random import randint
from loguru import logger as log

from mongoengine import *


class User(Document):
    user_ID = IntField(unique=True)
    exp = IntField()


class Users(Document):
    user_ID = IntField(unique=True)
    exp = LongField()
    multiplier = IntField(min_value=1, max_value=3, default=1)
    time_stamp = DateTimeField(default=datetime.datetime.utcnow)
    level = IntField(default=1, min_value=1)


class Custom_Command(EmbeddedDocument):
    command_name = StringField(max_length=20, unique=True)
    response = StringField(max_length=140)


class Guilds(Document):
    guild_ID = IntField(unique=True)
    mod_channel_ID = IntField()
    verification_channel_ID = IntField()
    verification_role_ID = IntField()
    mod_role_ID = IntField()
    prefix_string = StringField(default="$")
    verification_age = IntField(default=90)
    enabled = BooleanField(default=False)
    verify_on_screening = BooleanField(default=True)
    verification_logs_channel_ID = StringField()


class VerificationData(Document):
    verification_ID = StringField(unique=True)
    guild_ID = IntField()
    user_ID = IntField()
    # Expire the documents after 1 hr


async def set_guild_verification_role(guild_ID, role_ID):
    try:
        guild = Guilds.objects.get(guild_ID=guild_ID)
        guild.verification_role_ID = role_ID
        guild.save()
        return None
    except Exception as e:
        log.error(f"Could not add role [{role_ID}] to guild [{guild_ID}] {e}")
        return e


async def set_verify_on_screening(guild_ID, enabled: bool):
    try:
        guild = Guilds.objects.get(guild_ID=guild_ID)
        guild.verify_on_screening = enabled
        guild.save()
        return None
    except Exception as e:
        log.error(f"Could not set verify_on_screening in guild [{guild_ID}] {e}")
        return e


async def set_guild_mod_role(guild_ID, role_ID):
    try:
        guild = Guilds.objects.get(guild_ID=guild_ID)
        guild.mod_role_ID = role_ID
        guild.save()
        return None
    except Exception as e:
        log.error(f"Could not add role [{role_ID}] to guild [{guild_ID}] {e}")
        return e


async def set_guild_log_channel(guild_ID, channel_id):
    try:
        guild = Guilds.objects.get(guild_ID=guild_ID)
        guild.verification_logs_channel_ID = channel_id
        guild.save()
        return None
    except Exception as e:
        log.error(f"Could not add log channel [{channel_id}] to guild [{guild_ID}] {e}")
        return e


async def set_guild_enabled(guild_ID, enabled):
    try:
        guild = Guilds.objects.get(guild_ID=guild_ID)
        guild.enabled = enabled
        guild.save()
        return None
    except Exception as e:
        log.error(f"Could not set enabled [{enabled}] to guild [{guild_ID}] {e}")
        return e


async def set_guild_verification_age(guild_ID, age):
    try:
        guild = Guilds.objects.get(guild_ID=guild_ID)
        guild.verification_age = int(age)
        guild.save()
        return None
    except Exception as e:
        log.error(f"Could not set age to [{age}] to guild [{guild_ID}]")
        return e


async def get_guild_info(guild_ID):
    try:
        guild = Guilds.objects.get(guild_ID=guild_ID)
        return guild
    except Exception as e:
        log.error(f"Error while retrieving guild: {e}\n")
        return None


async def insert_verification_data(member):
    not_inserted = True
    unique_ID = secrets.token_urlsafe(8)
    # Get a unique urlsafe identifier and insert the information into
    # the database so it get be queried from frontend
    while not_inserted:
        if not VerificationData.objects(verification_ID=unique_ID):
            new_entry = VerificationData(verification_ID=unique_ID, guild_ID=member.guild.id,
                                         user_ID=member.id)
            new_entry.save()
            not_inserted = False
        else:
            unique_ID = secrets.token_urlsafe(8)
    verify_link = f"https://verify.holoen.fans/verify/{unique_ID}"
    return verify_link


async def insert_guild(guild_ID):
    try:
        new_guild = Guilds(guild_ID=guild_ID)
        new_guild.save()
        return True
    except NotUniqueError:
        log.debug("Guild already exists!")
        return True
    except Exception as e:
        log.error(f"Error occured while inserting guild: {e}")
        return False
