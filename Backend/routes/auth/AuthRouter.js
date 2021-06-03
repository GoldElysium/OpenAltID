let express = require('express')
let DiscordAuth = require('./DiscordAuth')
let TwitchAuth = require('./TwitchAuth')
let GoogleAuth = require('./GoogleAuth')
let RedditAuth = require('./RedditAuth')

let router = express.Router()

router.use('/discord', DiscordAuth)
// Disabling unused routes
//router.use('/google', GoogleAuth)
//router.use('/reddit', RedditAuth)
//router.use('/twitch', TwitchAuth)

module.exports = router
