from datetime import datetime

from discord.ext import tasks, commands
import redis
from loguru import logger as log

from database.dbmanager import get_guild_info


class Verification(commands.Cog):
    def __init__(self, bot):
        self.index = 0
        self.bot = bot
        self.check_completed.start()
        self.redisClient = redis.Redis(host='127.0.0.1', port=6379, password="pass123a", decode_responses=True)
        log.success("Connected to Redis.")

    def cog_unload(self):
        self.check_completed.cancel()

    @tasks.loop(seconds=5.0)
    async def check_completed(self):
        try:
            key_prefix = "complete"
            '''
            Format for completed verification keys is: complete:{userid}:{guildid}
            Value must be either 'true' or 'false'
            '''
            for key in self.redisClient.scan_iter(f"{key_prefix}:*"):
                if self.redisClient.get(key) == "true":
                    value = True
                else:
                    value = False
                key = key.split(':')
                user_id = key[1]
                guild_id = key[2]
                guild = self.bot.get_guild(guild_id)
                member = guild.get_member(user_id)
                log.debug(f"Entry found for {value}")
                guild_settings = await get_guild_info(guild_id)
                member.add_roles(guild.get_role(guild_settings.verification_role_id))
                self.redisClient.delete(key)
        except Exception as e:
            log.error(f"Failed to get keys! {e}")

    @check_completed.before_loop
    async def before_printer(self):
        log.info("Verification loop waiting for bot to be ready...")
        await self.bot.wait_until_ready()
