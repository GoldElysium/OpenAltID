let { UserModel } = require('../../database/models/UserModel')
let RedditStrategy = require('passport-reddit').Strategy

module.exports = function (passport) {
    passport.use(
        new RedditStrategy(
            {
                clientID: process.env.REDDIT_CLIENT_ID,
                clientSecret: process.env.REDDIT_CLIENT_SECRET,
                callbackURL: 'http://localhost:8080/auth/reddit/callback',
            },
            function (accessToken, refreshToken, profile, done) {
                console.log('Access Token:' + accessToken)
                console.log('Refresh Token:' + refreshToken)

                let docu = new UserModel({
                    connection: [],
                })

                let user = UserModel.findOneAndUpdate(
                    { _id: parseInt(profile.id) },
                    docu,
                    {
                        upsert: true,
                        new: true,
                        runValidators: true,
                    },
                    function (err) {
                        console.log(err)
                    }
                )
                return done(null, profile)
            }
        )
    )
}
