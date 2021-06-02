let {UserModel} = require("../../database/models/UserModel");
let {ConnectionModel} = require("../../database/models/UserModel");
let TwitchStrategy = require('passport-twitch-new').Strategy;
const axios = require("axios");

module.exports = function (passport) {
    passport.use(new TwitchStrategy({
            clientID: process.env.TWITCH_CLIENT_ID,
            clientSecret: process.env.TWITCH_CLIENT_SECRET,
            callbackURL: "http://localhost:8080/auth/twitch/callback",
            scope: "user_read"
        },
        function (accessToken, refreshToken, profile, done) {
            console.log("Access Token:" + accessToken)
            console.log("Refresh Token:" + refreshToken)
            return done(null, profile);
        }
    ));
}