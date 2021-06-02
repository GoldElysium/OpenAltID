let express = require('express');
let router = express.Router();

let passport = require("passport");
const axios = require("axios");
const {UserModel} = require("../../database/models/UserModel");

router.get('/',
    passport.authorize('twitch', {
        failWithError: true
    }));

router.get('/callback',
    passport.authorize('twitch', {failureRedirect: '/login'}),
    function (req, res) {
        if (req.user) {
            console.log(req.user)
            console.log(req.account)

            UserModel.findById({_id: parseInt(req.user.id)}).then(docu => {
                console.log("Found by ID:")
                console.log(docu)
                console.log(req.account.created_at)
                let newConn = {
                    _id: req.account.id,
                    type: "twitch",
                    createdAt: req.account.created_at
                }
                docu.connections.push(newConn)
                docu.save()
            }).finally((error) => {
                if (error) {
                    res.json({"Success": false})
                }
                res.json({"Success": true})
            })


        } else {
            res.json({"Success": false})
        }

    });

module.exports = router;