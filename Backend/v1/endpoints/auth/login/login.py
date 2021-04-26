from fastapi import APIRouter
from jose import jwt

from core.config import constants
from core.models.models import DiscordAccessInfo, tokenResponse
from v1.endpoints.auth.auth_router import auth_router
from v1.endpoints.auth.helpers import create_jwt, exchange_code

login_router = APIRouter(
    prefix="/login",
    tags=["auth", "login"]
)


@auth_router.post('/login/discord')
async def return_discord(access_info: DiscordAccessInfo):
    print(access_info.access_code)
    response = exchange_code(access_info.access_code, access_info.redirect_uri)
    token = create_jwt(response)
    print(token)
    print(jwt.decode(token, constants.SECRET_KEY, algorithms=[constants.ALGORITHM]))
    return tokenResponse(token=token)
