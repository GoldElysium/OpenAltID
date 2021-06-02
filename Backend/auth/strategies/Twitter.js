let TwitterStrategy = require('passport-twitter').Strategy;
let {ConnectionModel} = require("../../database/models/UserModel");


module.exports = function (passport) {
    let trustProxy = false;
    if (process.env.DYNO) {
        trustProxy = true;
    }

    passport.use(new TwitterStrategy({
            consumerKey: process.env.TWITTER_CLIENT_ID,
            consumerSecret: process.env.TWITTER_CLIENT_SECRET,
            callbackURL: 'http://localhost:8080/auth/twitter/callback',
            proxy: trustProxy
        },
        function (token, tokenSecret, profile, done) {
            console.log("Token:" + token)
            console.log("Token Secret:" + tokenSecret)
            let user = User.findOneAndUpdate({
                _id: profile.id,
                username: String,
                mfa_enabled: Boolean,
                premium_type: {type: Number, min: 0, max: 3},
                verified: Boolean,
                accessToken: String,
                avatar: String,
                connections: [ConnectionModel]
            })
            console.log("Profile" + profile.id)
            return done(null, profile);
        }));
}