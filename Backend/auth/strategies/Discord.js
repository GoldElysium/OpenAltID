const axios = require('axios');
let { UserModel } = require('../../database/models/UserModel');
let DiscordStrategy = require('passport-discord').Strategy;

module.exports = function (passport) {
    passport.use(
        new DiscordStrategy(
            {
                clientID: process.env.DISCORD_CLIENT_ID,
                clientSecret: process.env.DISCORD_CLIENT_SECRET,
                callbackURL: 'https://verify.holoen.fans/discordredirect',
                scope: ['identify', 'connections'],
                state: false,
            },
            async function (accessToken, refreshToken, profile, done) {
                let docu = new UserModel({
                    _id: profile.id,
                    username: profile.username,
                    mfa_enabled:
                        String(profile.mfa_enabled).toLowerCase() === 'true',
                    premium_type: parseInt(profile.premium_type),
                    verifiedEmail:
                        String(profile.verified).toLowerCase() === 'true',
                    verified: false,
                    accessToken: profile.accessToken,
                    avatar: profile.avatar,
                    connection: [],
                });

                UserModel.findOneAndUpdate(
                    { _id: profile.id },
                    docu,
                    {
                        upsert: true,
                        new: true,
                        runValidators: true,
                        useFindAndModify: true,
                    },
                    function (err) {
                        console.log(err);
                    }
                );
                return done(null, profile);
            }
        )
    );
};
