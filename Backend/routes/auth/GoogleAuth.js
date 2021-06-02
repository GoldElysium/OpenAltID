let express = require('express');
let router = express.Router();

let passport = require("passport");

router.get('/',
    passport.authorize('google', {
        scope: ['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/plus.login']
    }));

router.get('/callback',
    passport.authorize('google', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful
        console.log("Successful")
        res.json({"Success": true})
    });

module.exports = router;