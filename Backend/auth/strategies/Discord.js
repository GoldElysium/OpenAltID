let {UserModel} = require("../../database/models/UserModel");
let DiscordStrategy = require('passport-discord').Strategy;

module.exports = function (passport) {
    passport.use(new DiscordStrategy({
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: 'http://localhost:8080/auth/discord/callback',
            scope: ['identify'],
            state: false
        },
        function (accessToken, refreshToken, profile, done) {
            console.log("Access Token:" + accessToken)
            console.log("Refresh Token:" + refreshToken)

            let docu = new UserModel({
                _id: parseInt(profile.id),
                username: profile.username,
                mfa_enabled: (profile.mfa_enabled === 'true'),
                premium_type: parseInt(profile.premium_type),
                verified: (profile.verified === 'true'),
                accessToken: profile.accessToken,
                avatar: profile.avatar,
                connection: []
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
        }));
}