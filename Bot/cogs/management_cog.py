from datetime import datetime

from discord.ext import tasks, commands

from cogs.checks import is_mod, is_admin
from database.mongomanager import set_guild_verification_role, get_guild_info, set_guild_mod_role
from loguru import logger as log


class Management(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(pass_context=True)
    @commands.check(is_mod)
    async def set_verification_role(self, ctx, role: int):
        """Set the verification role that will be given upon successful verification."""
        role = ctx.guild.get_role(role)
        if role is None:
            await ctx.send("That role does not exist.")
            return

        error = await set_guild_verification_role(ctx.guild.id, str(role.id))

        if error is None:
            await ctx.send(f"Verification role set to `{role.name}`")
        else:
            log.error(f"Error while adding the role [{role.id}] in guild [{ctx.guild}]. {error}")
            await ctx.send(f"Internal error while setting the role.")

    @commands.command(pass_context=True)
    @commands.check(is_admin)
    async def set_mod_role(self, ctx, role: int):
        """Set the mod role that will give access to admin commands."""
        role = ctx.guild.get_role(role)
        if role is None:
            await ctx.send("That role does not exist.")
            return

        error = await set_guild_mod_role(ctx.guild.id, str(role.id))

        if error is None:
            await ctx.send(f"Verification role set to `{role.name}`")
        else:
            log.error(f"Error while adding the role [{role.id}] in guild [{ctx.guild}]. {error}")
            await ctx.send(f"Internal error while setting the role.")
