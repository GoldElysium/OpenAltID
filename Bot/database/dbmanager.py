import datetime
import math
from random import randint

from mongoengine import *


class User(Document):
    user_id = IntField(unique=True)
    exp = IntField()


class Users(Document):
    user_id = IntField(unique=True)
    exp = LongField()
    multiplier = IntField(min_value=1, max_value=3, default=1)
    time_stamp = DateTimeField(default=datetime.datetime.utcnow)
    level = IntField(default=1, min_value=1)


class Custom_Command(EmbeddedDocument):
    command_name = StringField(max_length=20, unique=True)
    response = StringField(max_length=140)


class Guilds(Document):
    guild_id = IntField(unique=True)
    custom_commands = EmbeddedDocumentListField(Custom_Command)
    mod_channel = IntField()
    disabled_channels = ListField(field=IntField())


class VerificationData(Document):
    verification_ID = StringField(unique=True)
    guild_ID = IntField()
    user_ID = IntField()
    # Expire the documents after 1 hr

