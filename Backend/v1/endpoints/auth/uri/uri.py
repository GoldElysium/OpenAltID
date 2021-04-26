import secrets

import requests
from fastapi import APIRouter

from core.config import constants
from core.models.models import Auth_URI
from v1.endpoints.auth.auth_router import auth_router

uri_router = APIRouter(
    prefix="/uri",
    tags=["auth", "uri"]
)


@auth_router.get('/uri/discord', response_model=Auth_URI)
async def return_discord_callback():
    client_id = constants.DISCORD_CLIENT_ID
    scopes = "identify connections guilds"
    state = secrets.token_urlsafe(16)
    url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&prompt=none " + "&redirect_uri="
    response = Auth_URI(url=url, state=state)
    return response


@auth_router.get('/uri/twitter', response_model=Auth_URI)
async def return_twitter_callback(redirect_uri: str):
    client_id = constants.TWITTER_CLIENT_ID
    state = secrets.token_urlsafe(16)
    # Post to oauth/request_token
    token_url = "https://api.twitter.com/oauth/request_token?oauth_consumer_key=" \
                + client_id + "&redirect_uri=" + redirect_uri

    r = requests.post(token_url)
    temp_token = r.json().oauth_token
    temp_secret = r.json().oauth_token_secret
    r.raise_for_status()

    if r.raise_for_status() != "Success":
        print(r.raise_for_status())
        return Auth_URI(url="")

    url = "https://api.twitter.com/oauth/authorize?oauth_token=" + temp_token
    response = Auth_URI(url=url, state=state)
    return response


@auth_router.get('/uri/reddit', response_model=Auth_URI)
async def return_reddit_callback(redirect_uri: str):
    client_id = constants.REDDIT_CLIENT_ID
    scopes = "identity"
    state = secrets.token_urlsafe(16)
    url = "https://www.reddit.com/api/v1/authorize?response_type=code&duration=temporary&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&redirect_uri=" + redirect_uri
    response = Auth_URI(url=url, state=state)
    return response


@auth_router.get('/uri/battlenet', response_model=Auth_URI)
async def return_battlenet_callback(redirect_uri: str):
    client_id = constants.BATTLENET_CLIENT_ID
    scopes = "identify connections guilds"
    state = secrets.token_urlsafe(16)
    url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&prompt=none " + "&redirect_uri="
    response = Auth_URI(url=url, state=state)
    print(response)
    return response


@auth_router.get('/uri/twitch', response_model=Auth_URI)
async def return_twitch_callback(redirect_uri: str):
    client_id = constants.TWITCH_CLIENT_ID
    scopes = "identify connections guilds"
    state = secrets.token_urlsafe(16)
    url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&prompt=none " + "&redirect_uri="
    response = Auth_URI(url=url, state=state)
    print(response)
    return response
