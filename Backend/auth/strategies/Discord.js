const axios = require("axios");
let {UserModel} = require("../../database/models/UserModel");
let DiscordStrategy = require('passport-discord').Strategy;

module.exports = function (passport) {
    passport.use(new DiscordStrategy({
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: 'http://localhost:8080/auth/discord/callback',
            scope: ['identify','connections'],
            state: false
        },
        async function (accessToken, refreshToken, profile, done) {
            console.log("Access Token:" + accessToken)
            console.log("Refresh Token:" + refreshToken)

            try {
                let resp = await axios.get("https://discord.com/api/users/@me/connections", {
                    headers: {
                        "Authorization": "Bearer " + accessToken
                    }
                })
                console.log(resp.data)
            } catch (e) {
                console.log(e.statusText)
            }


            let docu = new UserModel({
                _id: parseInt(profile.id),
                username: profile.username,
                mfa_enabled: (String(profile.mfa_enabled).toLowerCase() === 'true'),
                premium_type: parseInt(profile.premium_type),
                verified: (String(profile.verified).toLowerCase() === 'true'),
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
                    runValidators: true,
                    useFindAndModify: true
                }, function (err) {
                    console.log(err)
                })
            return done(null, profile);
        }));
}