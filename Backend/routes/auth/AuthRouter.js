let express = require('express');
let DiscordAuth = require('./DiscordAuth');

let router = express.Router();

router.use('/discord', DiscordAuth);
module.exports = router;
