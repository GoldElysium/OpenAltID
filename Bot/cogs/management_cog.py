from datetime import datetime

from discord.ext import tasks, commands
import redis
from loguru import logger as log
from redis.exceptions import LockError

from database.dbmanager import get_guild_info


class Verification(commands.Cog):

    @commands.command(pass_context=True)
    async def set_verification_role(self):

