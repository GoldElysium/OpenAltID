from typing import Optional

from pydantic import BaseModel, Field


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
