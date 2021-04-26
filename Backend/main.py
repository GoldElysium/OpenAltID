from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from v1.routers import v1_router

app = FastAPI()
app.include_router(v1_router)
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'],
                   allow_headers=['*'])

if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='127.0.0.1', port=8000)
