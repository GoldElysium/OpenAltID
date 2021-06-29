from datetime import datetime

from discord.ext import tasks, commands
import redis
from loguru import logger as log
from redis.exceptions import LockError

from database.mongomanager import get_guild_info
from database.redismanager import get_redis


class Verification(commands.Cog):
    def __init__(self, bot):
        self.index = 0
        self.bot = bot
        self.check_completed.start()
        self.redisClient = get_redis()
        log.success("Connected to Redis.")

    def cog_unload(self):
        self.check_completed.cancel()

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
                        member.add_roles(role)
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
