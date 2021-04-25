import datetime
import json
import secrets
import os
from datetime import timedelta
from typing import Optional

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, Field

# Load .env file if using a file, otherwise, the actual env is used
load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'],
                   allow_headers=['*'])
load_dotenv()
SECRET_KEY = os.getenv("secret")
ALGORITHM = os.getenv("algorithm")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("access_token_expire"))
DISCORD_CLIENT_ID = os.getenv("discord_client_id")
DISCORD_CLIENT_SECRET = os.getenv("discord_client_secret")
API_ENDPOINT = 'https://discord.com/api/v8'


class tokenResponse(BaseModel):
    token: str


class verificationResponse(BaseModel):
    valid: bool


class verificationBody(BaseModel):
    token: str


class TokenData(BaseModel):
    id: Optional[str] = None


class accessTokenResponse(BaseModel):
    access_token: str = Field(example="6qrZcUqja7812RVdnEKjpzOL4CvHBFG")
    token_type: str = Field(example="Bearer")
    expires_in: int = Field(example="604800")
    refresh_token: str = Field(example="D43f5y0ahjqew82jZ4NViEr2YafMKhue")
    scope: str = Field(example="identify")


class Auth_URI(BaseModel):
    url: str = Field(example="api.mysite.com/auth/uri/discord")
    state: str = Field(example="randomly_generated")


class User(BaseModel):
    id: str = Field(example="1234567890")


class DiscordAccessInfo(BaseModel):
    access_code: str = Field(example="NhhvTDYsFcdgNLnnLijcl7Ku7bEEeee&state=15773059ghq9183habn")
    redirect_uri: str = Field(example="api.mysite.com/auth/uri/discord")
    state: str = Field(example="2RVdnEKjpz")


@app.get('/auth/uri/discord', response_model=Auth_URI)
async def return_discord_uri():
    client_id = DISCORD_CLIENT_ID
    scopes = "identify connections guilds"
    state = secrets.token_urlsafe(16)
    url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&prompt=none " + "&redirect_uri="
    response = Auth_URI(url=url, state=state)
    print(response)
    return response


def create_jwt(accessToken: accessTokenResponse):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = json.loads(json.dumps(accessToken, indent=4))
    expire = datetime.datetime.utcnow() + access_token_expires
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def exchange_code(code, redirect_uri):
    data = {
        'client_id': DISCORD_CLIENT_ID,
        'client_secret': DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    r = requests.post('%s/oauth2/token' % API_ENDPOINT, data=data, headers=headers)
    r.raise_for_status()
    return r.json()


@app.post('/auth/login/discord')
async def return_discord(access_info: DiscordAccessInfo):
    print(access_info.access_code)
    response = exchange_code(access_info.access_code, access_info.redirect_uri)
    token = create_jwt(response)
    print(token)
    print(jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]))
    return tokenResponse(token=token)


@app.post('/auth/verify/', response_model=verificationResponse)
async def verify_jwt(token_json: tokenResponse):
    print(token_json)
    try:
        decoded_json = jwt.decode(token_json.token, SECRET_KEY, algorithms=[ALGORITHM])
        # do stuff with it
        return verificationResponse(valid=True)
    except JWTError:
        return verificationResponse(valid=False)


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='127.0.0.1', port=8000)
