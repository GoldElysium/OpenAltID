const express = require('express');
const snoowrap = require('snoowrap')
const {ClientCredentialsAuthProvider} = require("twitch-auth");
const {ApiClient} = require('twitch')
const Twitter = require('twitter');
// Because the twitter timestamp is jank and so are the simpler ways of converting it
const moment = require('moment')
const axios = require("axios");

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


async function getAccountAges(accounts) {
    let accountPromises = []
    // YouTube


    // Twitter
    if (accounts.has('twitter')) {
        var client = new Twitter({
            consumer_key: process.env.TWITTER_CLIENT_ID,
            consumer_secret: process.env.TWITTER_CLIENT_SECRET,
            bearer_token: process.env.TWITTER_CLIENT_BEARER
        });
        accountPromises.push(client.get("users/show", {"user_id": "702234804"}))
    }

    // Twitch
    if (accounts.has('twitch')) {

        let twitchUser
        let authProvider = new ClientCredentialsAuthProvider(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET);
        let twitchClient = new ApiClient({authProvider});
        accountPromises.push(twitchClient.helix.users.getUserById('62730467'))
    }

    // Reddit
    if (accounts.has('reddit')) {
        const redditWrapper = new snoowrap({
            userAgent: 'OpenAD (v1)',
            clientId: 'ANqQWysAuwku_Q',
            clientSecret: 'fHqm8-jWr1WrfgHztahWxGJbHClrsA',
            refreshToken: '23964635-WYpmYgqT-pSXz4ciA8yuDT7vaLnEug'
        });

        accountPromises.push(redditWrapper.getUser('art_wins').fetch());
    }

    // Wait for them all to finish!
    [twitterUser, twitchUser, redditUser] = await Promise.all(accountPromises)
    console.log({
        "Twitter Username": twitterUser.screen_name,
        "Twitter ID": twitterUser.id,
        "Created at": moment(twitterUser.created_at, 'ddd MMM DD HH:mm:ss Z YYYY').toDate()
    })
    console.log({
        "Twitch Username": twitchUser.displayName,
        "Twitch ID": twitchUser.id,
        "Created at": twitchUser.creationDate
    })
    console.log({
        "Reddit Username": redditUser.name,
        "Reddit Karma": redditUser.total_karma,
        "Created at": new Date(redditUser.created * 1000)
    })
}

router.get('/verify-accounts',
    async (req, res) => {
        if (!req.user) {
            return res.status(401).send({
                message: 'No user in session, you must login first.'
            })
        } else {
            try {
                let resp = await axios.get("https://discord.com/api/users/@me/connections", {
                    headers: {
                        "Authorization": "Bearer " + req.user.accessToken
                    }
                })

                let accounts = new Map();
                const supportedAccountTypes = ['youtube', 'twitter', 'twitch', 'reddit']
                resp.data.forEach(el => {
                    if (supportedAccountTypes.indexOf(el.type) === -1 && el.verified === true) {
                        accounts.set(el.type, el.id)
                    }
                })

                await getAccountAges(accounts)
            } catch (e) {
                console.log(e.statusText)
            }
            res.send("Done.")
        }

    });

module.exports = router