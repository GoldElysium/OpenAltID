from fastapi import APIRouter

from v1.endpoints.auth.auth_router import auth_router
from v1.endpoints.auth.login.login import login_router
from v1.endpoints.auth.uri.uri import uri_router
from v1.endpoints.auth.verify.verify import verify_router

v1_router = APIRouter(
    prefix="/v1"
)
auth_router.include_router(login_router)
auth_router.include_router(uri_router)
auth_router.include_router(verify_router)

v1_router.include_router(auth_router)
