const DiscordStrategy = require('passport-discord').Strategy;
const { UserModel } = require('../../database/models/UserModel');

module.exports = (passport) => {
    passport.use(
        new DiscordStrategy(
            {
                clientID: process.env.DISCORD_CLIENT_ID,
                clientSecret: process.env.DISCORD_CLIENT_SECRET,
                callbackURL: `${process.env.FRONTEND_HOST}/discordredirect`,
                scope: ['identify', 'connections'],
                state: false,
            },
            (async (_, __, profile, done) => {
                const docu = new UserModel({
                    _id: profile.id,
                    username: profile.username,
                    mfa_enabled:
                  String(profile.mfa_enabled).toLowerCase() === 'true',
                    premium_type: parseInt(profile.premium_type, 10),
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
                    (err) => {
                        console.log(err);
                    },
                );
                return done(null, profile);
            }),
        ),
    );
};
