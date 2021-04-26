import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY=os.getenv("SECRET")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("access_token_expire"))
SECRET=os.getenv('SECRET')
MONGO_CONN_STRING=os.getenv('MONGO_CONN_STRING')
ALGORITHM=os.getenv('ALGORITHM')
API_ENDPOINT=os.getenv('API_ENDPOINT')

DISCORD_CLIENT_ID = os.getenv("discord_client_id")
DISCORD_CLIENT_SECRET = os.getenv("discord_client_secret")

TWITTER_CLIENT_ID=os.getenv('TWITTER_CLIENT_ID')
TWITTER_CLIENT_SECRET=os.getenv('TWITTER_CLIENT_SECRET')


GITHUB_CLIENT_ID=os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET=os.getenv('GITHUB_CLIENT_SECRET')


