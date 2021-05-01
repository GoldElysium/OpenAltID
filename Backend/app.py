import json
import secrets
from datetime import timedelta

import redis
import requests
from authlib.integrations.requests_client import OAuth1Session, OAuth2Session
from authlib.integrations.flask_client import OAuth, FlaskRemoteApp
from loginpass import Twitch, Twitter, Reddit, GitHub
from celery import Celery
from flask import Flask, jsonify, request, session, Response, redirect
from flask_cors import CORS
from flask_session import Session
from loguru import logger
from pydantic.main import BaseModel
from pymongo import MongoClient

from flask_sslify import SSLify


SESSION_TYPE = 'redis'



debug = True
app = Flask(__name__)
app.config.from_pyfile('config.py')
app.secret_key = secrets.token_urlsafe(32)
app.config["SESSION_TYPE"] = 'redis'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=20)
CORS(app)
Session(app)
sslify = SSLify(app)

celery_client = Celery('hello', broker='amqp://guest@localhost//')
mongo_client = MongoClient()

r = redis.Redis(host="127.0.0.1", port=6379)

oauth = OAuth(app, cache=r)

for backend in [Twitch, Twitter, Reddit, GitHub]:
    class RemoteApp(backend, FlaskRemoteApp):
        OAUTH_APP_CONFIG = backend.OAUTH_CONFIG
    oauth.register(backend.NAME, client_cls=RemoteApp)

r.set("hello", "there")
r.expire("hello", 1800)
print(r.get("hello"))


def handle_authorize(remote, token, user_info):
    if token:
        pass
    if user_info:
        pass
        return ""


@celery_client.task
def perform_verification(discord_id: int, new_account_id: int, new_account_type: str):
    # TODO Get all the accounts from mongodb and then process them and make a decision, then put it on the queue
    pass


@app.route('/api/auth/is-logged-in', methods=['GET'])
def return_logged_status():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    if session.get('user') is not None:
        logger.debug("User is logged in: {}".format(session.get('user')))
        return {"success": True}
    else:
        logger.warning("User is not logged in!")
        return {"success": False}


@app.route('/redirect', methods=['GET'])
def redirect_vue():
    return redirect("http://www.google.com", )


class user_model(BaseModel):
    user_id: int
    username: str
    access_token: str
    refresh_token: str


@app.route('/api/auth/login/discord', methods=['POST'])
def return_discord():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    discord_oauth_client = OAuth2Session(
        app.config.get("DISCORD_CLIENT_ID"),
        app.config.get("DISCORD_CLIENT_SECRET"),
        scope="identify connections guilds",
        redirect_uri="http://127.0.0.1:8000/discordredirect"
    )

    try:
        # Get the access token
        authorization_response = request.json['uri']
        token_endpoint = "https://discord.com/api/oauth2/token"
        token = discord_oauth_client.fetch_token(token_endpoint, authorization_response=authorization_response)

        # Get user data
        headers = {"Authorization": "Bearer " + token.get('access_token')}
        logger.debug("Getting user data from /api/users/@me with headers: {}".format(headers))
        user_data = requests.post('http://discordapp.com/api/users/@me', headers=headers).json()
        logger.debug("User data received from Discord: {}".format(user_data))
        user = user_model(user_id=int(user_data['id']), username=user_data['username'],
                          access_token=token.get('access_token'))
        logger.debug("Saving the user to session['user'] with data: {}".format(user))

        # Put the Discord user info into session
        session['user'] = user.json()
        logger.debug("User now in session: {}".format(session['user']))

        # Respond with success
        response: Response = jsonify(success=True)
        logger.info("Returning the response: {}".format(response.response))
        return response

    # TODO better exception handling!
    except Exception as e:
        logger.warning("Error occurred while logging in user: {}".format(e))
        response = jsonify(successful=False)
        return response


@app.route('/api/auth/logout/discord', methods=['GET'])
def logout_discord():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    try:
        logger.debug("Popping the session for: {}".format(session['user']))
        session.pop('user')
        response: Response = jsonify(success=True)
        return response
    except Exception as e:
        logger.warning("Error occurred while logging out user: {}".format(e))
        response = jsonify(successful=False)
        return response


@app.route('/api/user/dash', methods=['GET'])
def get_user_dash_info():
    user = json.loads(str(session.get('user')))
    if user is not None:
        try:
            headers = {"Authorization": "Bearer " + user['access_token']}
            logger.debug("Getting user data from /api/users/@me with headers: {}".format(headers))
            user_data = requests.post('http://discordapp.com/api/users/@me', headers=headers)
            if user_data.raise_for_status() is None:
                user_data = user_data.json()

                return jsonify(username=user_data["username"],
                               avatar="http://cdn.discordapp.com/avatars/{}/{}.jpg".format(user_data["id"],
                                                                                           user_data["avatar"]),
                               verified=False)

        except Exception as e:
            logger.critical("User info could not be fetched! " + str(e))
            return {"error": "Internal error receiving info."}

    else:
        logger.warning("User is not logged in!")
        return {"error": "Not logged in!"}


@app.route('/api/auth/uri/discord', methods=['GET'])
def return_discord_callback():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    discord_oauth_client = OAuth2Session(
        app.config.get("DISCORD_CLIENT_ID"),
        app.config.get("DISCORD_CLIENT_SECRET"),
        scope="identify connections guilds",
        redirect_uri="http://127.0.0.1:8000/discordredirect"
    )

    uri_state = discord_oauth_client.create_authorization_url("https://discord.com/api/oauth2/authorize")
    print(uri_state)

    return {'url': uri_state[0], 'state': uri_state[1]}


@app.route('/api/auth/uri/twitter', methods=['GET'])
def return_twitter_callback():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    twitter_oauth_client = OAuth1Session(
        app.config.get("TWITTER_CLIENT_ID"),
        app.config.get("TWITTER_CLIENT_SECRET"),
        redirect_uri="http://127.0.0.1:8000/twitterredirect"
    )

    request_token = twitter_oauth_client.fetch_request_token('https://api.twitter.com/oauth/request_token')
    session['twitter_request_token'] = request_token

    print(request_token)
    uri_request_token_twitter = twitter_oauth_client.create_authorization_url(
        'https://api.twitter.com/oauth/authenticate')

    return {'url': uri_request_token_twitter}


@app.route('/api/auth/login/twitter', methods=['POST'])
def login_twitter():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    url = request.json['url']

    try:
        twitter_oauth_client = OAuth1Session(
            app.config.get("TWITTER_CLIENT_ID"),
            app.config.get("TWITTER_CLIENT_SECRET"),
            redirect_uri="http://127.0.0.1:8000/twitterredirect"
        )

        twitter_oauth_client.parse_authorization_response(url)

        token = twitter_oauth_client.fetch_access_token('https://api.twitter.com/oauth/request_token')
        session['twitter_access_token'] = token  # No clue if this is needed but it gets popped during auth
        resp = twitter_oauth_client.get('https://api.twitter.com/1.1/account/verify_credentials.json').json()

        print(resp)
        return {'success': True}

    except Exception as e:
        print(e)
        return {'success': False}


@app.route('/api/auth/uri/reddit', methods=['GET'])
def return_reddit_callback():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    api_base_url = 'https://oauth.reddit.com/api/v1/',
    access_token_url = 'https://www.reddit.com/api/v1/access_token',
    authorize_url = 'https://www.reddit.com/api/v1/authorize',

    reddit_oauth_client = OAuth2Session(
        app.config.get("REDDIT_CLIENT_ID"),
        app.config.get("REDDIT_CLIENT_SECRET"),
        scope="identity",
        redirect_uri="http://127.0.0.1:8000/redditredirect"
    )
    uri_state = reddit_oauth_client.create_authorization_url('https://www.reddit.com/api/v1/access_token')

    session['reddit_state'] = uri_state[1]

    return {'url': uri_state[0]}


@app.route('/api/auth/login/twitch', methods=['GET'])
def login_twitch():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    token = oauth.twitch.authorize_access_token()

    response = {"success": True}
    logger.debug("Token: {}".format(token))
    return response


@app.route('/api/auth/uri/twitch', methods=['GET'])
def return_twitch_callback():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    twitch = oauth.twitch
    redirect_uri = 'https://127.0.0.1:5000/api/auth/login/twitch'
    return twitch.authorize_redirect(redirect_uri)


