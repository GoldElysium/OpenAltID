let express = require('express');
let DiscordAuth = require('./DiscordAuth');

let router = express.Router();

router.use('/discord', DiscordAuth);
// Disabling unused routes
//router.use('/google', GoogleAuth)
//router.use('/reddit', RedditAuth)
//router.use('/twitch', TwitchAuth)

module.exports = router;
