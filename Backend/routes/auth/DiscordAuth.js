let express = require('express');
let router = express.Router();
let passport = require('passport');

router.get('/', passport.authenticate('discord'));

router.post('/callback', passport.authenticate('discord'), async function (req, res) {
    res.json({ Success: true });
});

module.exports = router;
