const express = require('express')
const snoowrap = require('snoowrap')
const { ClientCredentialsAuthProvider } = require('twitch-auth')
const { ApiClient } = require('twitch')
const Twitter = require('twitter')
const { google } = require('googleapis')
const { authenticate } = require('@google-cloud/local-auth')
// Because the twitter timestamp is jank and so are the simpler ways of converting it
const moment = require('moment')
const axios = require('axios')
const Path = require('path')

let router = express.Router()

// This is just a synonym of auth/discord
router.get('/login', function (req, res) {
    res.redirect('http://localhost:8080/auth/discord')
})

// Just destroys the session and goes back /
router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/')
    })
})

/**
 * Makes API calls to the various different supported services and grabs the account creation date
 *
 * Each account type has a place holder promise that resolves to null, if the account is supplied
 * it then reassigns the promise to an actual promise.
 *
 * @author omneex
 * @param accounts A Map of accounts and ids
 * @return Array An array of account objects containing the creation dates
 * @see Map
 **/
async function getAccountAges(accounts) {
    console.log(accounts)
    // YouTube
    let youtubePromise = new Promise((resolve) => {
        resolve(null)
    })
    if (accounts.has('youtube')) {
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY,
        })

        youtubePromise = youtube.channels.list({
            part: 'snippet',
            id: accounts.get('youtube'),
        })
    }

    // Twitter
    let twitterPromise = new Promise((resolve) => {
        resolve(null)
    })
    if (accounts.has('twitter')) {
        var client = new Twitter({
            consumer_key: process.env.TWITTER_CLIENT_ID,
            consumer_secret: process.env.TWITTER_CLIENT_SECRET,
            bearer_token: process.env.TWITTER_CLIENT_BEARER,
        })
        twitterPromise = client.get('users/show', { user_id: '702234804' })
    }

    // Twitch
    let twitchPromise = new Promise((resolve) => {
        resolve(null)
    })
    if (accounts.has('twitch')) {
        let authProvider = new ClientCredentialsAuthProvider(
            process.env.TWITCH_CLIENT_ID,
            process.env.TWITCH_CLIENT_SECRET
        )
        let twitchClient = new ApiClient({ authProvider })
        twitchPromise = twitchClient.helix.users.getUserById('62730467')
    }

    // Reddit
    let redditPromise = new Promise((resolve) => {
        resolve(null)
    })
    if (accounts.has('reddit')) {
        const redditWrapper = new snoowrap({
            userAgent: 'OpenAD (v1)',
            clientId: 'ANqQWysAuwku_Q',
            clientSecret: 'fHqm8-jWr1WrfgHztahWxGJbHClrsA',
            refreshToken: '23964635-WYpmYgqT-pSXz4ciA8yuDT7vaLnEug',
        })

        redditPromise = redditWrapper.getUser('art_wins').fetch()
    }
    let twitterUser, twitchUser, redditUser, youtubeUser
    // Wait for them all to finish!
    ;[twitterUser, twitchUser, redditUser, youtubeUser] = await Promise.all([
        twitterPromise,
        twitchPromise,
        redditPromise,
        youtubePromise,
    ])

    console.log(twitterUser)
    console.log({
        'Youtube Username': youtubeUser.data.items[0].snippet.title,
        'Created at': Date(youtubeUser.data.items[0].snippet.publishedAt),
    })
}

router.get('/verify-accounts', async (req, res) => {
    if (!req.user) {
        return res.status(401).send({
            message: 'No user in session, you must login first.',
        })
    } else {
        try {
            let resp = await axios.get(
                'https://discord.com/api/users/@me/connections',
                {
                    headers: {
                        Authorization: 'Bearer ' + req.user.accessToken,
                    },
                }
            )

            let accounts = new Map()
            const supportedAccountTypes = [
                'youtube',
                'twitter',
                'twitch',
                'reddit',
            ]
            resp.data.forEach((el) => {
                if (
                    supportedAccountTypes.indexOf(el.type) !== -1 &&
                    el.verified === true
                ) {
                    accounts.set(el.type, el.id)
                }
            })

            await getAccountAges(accounts)
        } catch (e) {
            console.log(e)
        }
        res.send('Done.')
    }
})

module.exports = router
