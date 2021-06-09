const express = require('express');
let router = express.Router();

const passport = require('passport');

router.get('/', function (req, res, next) {
    req.session.state = crypto.randomBytes(32).toString('hex');
    passport.authorize('reddit', {
        state: req.session.state,
    });
});

router.get('/callback', function (req, res, next) {
    if (req.query.state === req.session.state) {
        passport.authorize('reddit', {
            successRedirect: '/',
        })(req, res, next);
    } else {
        next(new Error(403));
    }
});

module.exports = router;
