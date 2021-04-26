import json
from datetime import timedelta, datetime

import requests
from jose import jwt

from core.config import constants
from core.models.models import accessTokenResponse, UserJWT


def create_jwt(accessToken: UserJWT):
    access_token_expires = timedelta(minutes=constants.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = json.loads(accessToken.json())
    expire = datetime.utcnow() + access_token_expires
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, constants.SECRET_KEY, algorithm=constants.ALGORITHM)
    return encoded_jwt


def exchange_code(code, redirect_uri):
    data = {
        'client_id': constants.DISCORD_CLIENT_ID,
        'client_secret': constants.DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    r = requests.post('%s/oauth2/token' % constants.API_ENDPOINT, data=data, headers=headers)
    r.raise_for_status()
    jsondata = r.json()
    print(jsondata)
    return jsondata


def get_discord_user(access_token: str):
    response = requests.get('http://discordapp.com/api/users/@me',
                            headers={'Authorization': 'Bearer {}'.format(access_token)})
    print(response.json())
    print(response.raise_for_status())
    return response.json()
