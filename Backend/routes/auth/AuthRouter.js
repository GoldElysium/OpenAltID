const express = require('express');
const DiscordAuth = require('./DiscordAuth');

const router = express.Router();

router.use('/discord', DiscordAuth);
module.exports = router;
