const express = require('express');

const router = express.Router();
const passport = require('passport');

router.get('/', passport.authenticate('discord'));

router.post('/callback', passport.authenticate('discord'), async (_, res) => {
    res.json({ Success: true });
});

module.exports = router;
