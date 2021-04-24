import datetime
import secrets
from datetime import timedelta
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, Field

middleware = [
    Middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
]

app = FastAPI()

SECRET_KEY = ""
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


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


class DiscordAccessCode(BaseModel):
    access_code: str = Field(example="NhhvTDYsFcdgNLnnLijcl7Ku7bEEeee&state=15773059ghq9183habn")
    redirect_uri: str = Field(example="api.mysite.com/auth/uri/discord")


@app.get('/auth/uri/discord', response_model=Auth_URI)
async def return_discord_uri():
    client_id = "494018524038037504"
    scopes = "identify connections guilds"
    state = secrets.token_urlsafe(16)
    url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&prompt=none " + "&redirect_uri="

    return Auth_URI(url=url, state=state)


def create_jwt(user_id: int):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id}
    expire = datetime.datetime.utcnow() + access_token_expires
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@app.get('/auth/login/discord', response_model=accessTokenResponse)
async def return_discord(code: DiscordAccessCode):
    data = {
        'client_id': "",
        'client_secret': "",
        'grant_type': 'authorization_code',
        'code': code.access_code,
        'redirect_uri': code.redirect_uri
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    r = requests.post('%s/oauth2/token' % "https://discord.com/api/v8", data=data, headers=headers)
    r.raise_for_status()
    return r.json()


@app.get('/auth/login/discord', response_model=Auth_URI)
async def verify_logged_in(token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_discord_id: str = payload.get("sub")
        if user_discord_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    # Get the user from the DB
    user = User(id=user_discord_id)
    if user is None:
        raise credentials_exception
    return user


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='127.0.0.1', port=8000)
