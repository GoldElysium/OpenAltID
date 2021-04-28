import json
import logging
import logging
import secrets
from datetime import timedelta

import redis
import requests
from flask import Flask, jsonify, request, session, Response
from flask_cors import CORS
from flask_session import Session
from loguru import logger
from pydantic.main import BaseModel

SESSION_TYPE = 'redis'

debug = True
app = Flask(__name__)
app.config.from_pyfile('config.py')
app.secret_key = secrets.token_urlsafe(32)
app.config["SESSION_TYPE"] = 'redis'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=20)
CORS(app)
Session(app)

print(app.secret_key)
r = redis.Redis(host="127.0.0.1", port=6379)

r.set("hello", "there")
r.expire("hello", 1800)
print(r.get("hello"))


def exchange_code(code, redirect_uri):
    data = {
        'client_id': app.config.get("DISCORD_CLIENT_ID"),
        'client_secret': app.config.get("DISCORD_CLIENT_SECRET"),
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    logger.debug("Exchanging code: {}, with redirect uri {}".format(code, redirect_uri))
    r = requests.post("https://discord.com/api/oauth2/token", data=data, headers=headers)
    logger.debug("Exchange request returned with: {}".format(r.raise_for_status()))
    jsondata = r.json()
    logger.debug("Request returned json: {}".format(jsondata))
    return jsondata


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


class user_model(BaseModel):
    user_id: int
    username: str
    access_token: str
    refresh_token: str


@app.route('/api/auth/login/discord', methods=['POST'])
def return_discord():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    try:
        response_json = exchange_code(request.json['access_code'], request.json['redirect_uri'])

        headers = {"Authorization": "Bearer " + response_json['access_token']}

        logger.debug("Getting user data from /api/users/@me with headers: {}".format(headers))

        user_data = requests.post('http://discordapp.com/api/users/@me', headers=headers).json()

        logger.debug("User data received from Discord: {}".format(user_data))

        user = user_model(user_id=int(user_data['id']), username=user_data['username'],
                          access_token=response_json['access_token'],
                          refresh_token=response_json['refresh_token'])
        logger.debug("Saving the user to session['user'] with data: {}".format(user))

        session['user'] = user.json()

        logger.debug("User now in session: {}".format(session['user']))

        response: Response = jsonify(success=True)
        logger.info("Returning the response: {}".format(response.response))
        return response
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

                return jsonify(username=user_data["id"],
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

    client_id = app.config.get("DISCORD_CLIENT_ID")
    scopes = "identify connections guilds"
    state = str(secrets.token_urlsafe(16))
    print(type(client_id), type(scopes), type(state))
    url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&prompt=none " + "&redirect_uri="
    return {'url': url, 'state': state}


@app.route('/api/auth/uri/twitter', methods=['GET'])
def return_twitter_callback():
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    client_id = app.config.get("TWITTER_CLIENT_ID")
    state = secrets.token_urlsafe(16)
    # Post to oauth/request_token
    token_url = "https://api.twitter.com/oauth/request_token?oauth_consumer_key=" \
                + client_id + "&redirect_uri="

    r = requests.post(token_url)
    temp_token = r.json().oauth_token
    temp_secret = r.json().oauth_token_secret
    r.raise_for_status()

    if r.raise_for_status() != "Success":
        return {'url': None, 'state': None}

    url = "https://api.twitter.com/oauth/authorize?oauth_token=" + temp_token
    return {'url': url, 'state': state}


@app.route('/api/auth/uri/reddit', methods=['GET'])
def return_reddit_callback(redirect_uri: str):
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    client_id = app.config.get("REDDIT_CLIENT_ID")
    scopes = "identity"
    state = secrets.token_urlsafe(16)
    url = "https://www.reddit.com/api/v1/authorize?response_type=code&duration=temporary&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&redirect_uri=" + redirect_uri
    return {'url': url, 'state': state}


@app.route('/api/auth/uri/battlenet', methods=['GET'])
def return_battlenet_callback(redirect_uri: str):
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    client_id = app.config.get("BATTLENET_CLIENT_ID")
    scopes = "identify connections guilds"
    state = secrets.token_urlsafe(16)
    url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&prompt=none " + "&redirect_uri="
    return {'url': url, 'state': state}


@app.route('/api/auth/uri/twitch', methods=['GET'])
def return_twitch_callback(redirect_uri: str):
    logger.debug("Request: {}".format(request))
    logger.debug("Session: {}".format(session.items()))

    client_id = app.config.get("TWITCH_CLIENT_ID")
    scopes = "identify connections guilds"
    state = secrets.token_urlsafe(16)
    url = "https://discord.com/api/oauth2/authorize?response_type=code&client_id=" + client_id + "&scope=" + scopes + \
          "&state=" + state + "&prompt=none " + "&redirect_uri="
    return {'url': url, 'state': state}
