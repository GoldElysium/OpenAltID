const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: 'http://localhost:8080/auth/google/callback',
            },
            function (accessToken, refreshToken, profile, done) {
                console.log('Access Token:' + accessToken);
                console.log('Refresh Token:' + refreshToken);
                profile.bearerToken = accessToken;
                return done(null, profile);
            }
        )
    );
};
