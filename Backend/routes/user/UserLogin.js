const express = require('express');
const snoowrap = require('snoowrap')
const {StaticAuthProvider} = require("twitch-auth");
const {ApiClient} = require('twitch')
const Twitter = require('twitter');

let router = express.Router();

// This is just a synonym of auth/discord
router.get('/login',
    function (req, res) {
        res.redirect('http://localhost:8080/auth/discord')
    });

// Just destroys the session and goes back /
router.get('/logout',
    function (req, res) {
        req.session.destroy(function (err) {
            res.redirect('/');
        });
    });

async function getAccountAges(user) {
    // YouTube


    // Twitter

    const Key = encodeURI(process.env.TWITTER_CLIENT_ID);
    const Secret = encodeURI(process.env.TWITTER_CLIENT_SECRET);

    //make the bearer token credential string -
    //the rfc encoded key : the rfc encoded secret
    const bearerTokenCredentials = `${Key}:${Secret}`;

    //encode the credentials to base 64
    const base64BearerTokenCredentials = Buffer.from(
        bearerTokenCredentials
    ).toString('base64');

    if (true) {
        var client = new Twitter({
            consumer_key: '',
            consumer_secret: '',

        });
    }

    // Twitch
    let twitchUser
    if (true) {
        let clientId = process.env.TWITCH_CLIENT_ID;
        let accessToken = process.env.TWITCH_CLIENT_SECRET;
        let authProvider = new StaticAuthProvider(clientId, accessToken);
        let twitchClient = new ApiClient({ authProvider });

        twitchUser = twitchClient.getUserById('62730467')
    }

    // Reddit
    let redditUser
    if (true) {
        const redditWrapper = new snoowrap({
            userAgent: 'OpenAD (v1)',
            clientId: 'ANqQWysAuwku_Q',
            clientSecret: 'fHqm8-jWr1WrfgHztahWxGJbHClrsA',
            refreshToken: '23964635-XQSDIWQQxcPajV7wHCpnp-LfgYWtAw'
        });

        redditUser = redditWrapper.getUser('art_wins');
    }

    let replies = await Promise.all([twitchUser, redditUser])
    console.log(replies)
}

router.get('/verify-accounts',
    async (req, res) => {

    });