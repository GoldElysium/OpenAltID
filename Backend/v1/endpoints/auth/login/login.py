import json

from fastapi import APIRouter
from jose import jwt
from starlette.responses import JSONResponse

from core.config import constants
from core.models.models import DiscordAccessInfo, tokenResponse, UserJWT
from v1.endpoints.auth.auth_router import auth_router
from v1.endpoints.auth.helpers import create_jwt, exchange_code, get_discord_user

login_router = APIRouter(
    prefix="/login",
    tags=["auth", "login"]
)


@auth_router.post('/login/discord')
async def return_discord(access_info: DiscordAccessInfo):
    print(access_info)
    response_json = exchange_code(access_info.access_code, access_info.redirect_uri)
    user_data = get_discord_user(response_json['access_token'])
    print(user_data)
    token = create_jwt(UserJWT(id=user_data["id"], expires_in="1800"))

    response = JSONResponse({'TOKEN': token})

    return response
