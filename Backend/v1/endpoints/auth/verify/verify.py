from fastapi import APIRouter
from jose import jwt, JWTError

from core.config import constants
from core.models.models import verificationResponse, tokenResponse
from v1.endpoints.auth.auth_router import auth_router

verify_router = APIRouter(
    prefix="/verify",
    tags=["auth", "verify"]
)


@auth_router.post('/verify/', response_model=verificationResponse)
async def verify_jwt(token_json: tokenResponse):
    print(token_json)
    try:
        decoded_json = jwt.decode(token_json.token, constants.SECRET_KEY, algorithms=[constants.ALGORITHM])
        # do stuff with it
        return verificationResponse(valid=True)
    except JWTError:
        return verificationResponse(valid=False)

