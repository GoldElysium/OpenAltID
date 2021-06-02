let express = require('express');
let router = express.Router();

let passport = require("passport");

router.get('/',
    passport.authorize('twitch', {
        failWithError: true
    }));

router.get('/callback',
    passport.authorize('twitch', {failureRedirect: '/login'}),
    function (req, res) {
        console.log(req.w)
        console.log("Successful")
        res.json({"Success": true})
    });

module.exports = router;