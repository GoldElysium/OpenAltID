let {UserModel} = require("../../database/models/UserModel");
let {ConnectionModel} = require("../../database/models/UserModel");
let TwitchStrategy = require('passport-twitch-new').Strategy;

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

            let docu = new UserModel({
                connection: [new ConnectionModel({
                    id: String,
                    type: String,
                    createdAt: Date
                })]
            });

            UserModel.findOneAndUpdate(
                {_id: parseInt(profile.id)},
                docu,
                {
                    upsert: true,
                    new: true,
                    runValidators: true
                }, function (err) {
                    console.log(err)
                })
            return done(null, profile);
        }
    ));
}