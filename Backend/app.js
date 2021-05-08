require('dotenv').config();

const express        = require('express');
const session        = require('express-session');
const passport       = require('passport');
const request        = require('request');
const bodyParser     = require('body-parser');
const morgan         = require('morgan')('combined');

const Strategy       = require('passport-twitter').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const TwitchStrategy = require('passport-oauth').OAuth2Strategy;

let trustProxy = false;
if (process.env.DYNO) {
    trustProxy = true;
}

// Create the express app
const app = express();

app.use(morgan);
app.use(bodyParser.urlencoded({extended: true}));

app.use(passport.initialize());
app.use(passport.session());
app.use(session({secret: process.env['SECRET'], resave: true, saveUninitialized: false}));


// Twitter Passport
passport.use(new Strategy({
        consumerKey: process.env['TWITTER_CONSUMER_KEY'],
        consumerSecret: process.env['TWITTER_CONSUMER_SECRET'],
        callbackURL: '/auth/twitter/callback',
        proxy: trustProxy
    },
    function (token, tokenSecret, profile, done) {
        console.log("Token:" + token)
        console.log("Token Secret:" + tokenSecret)
        console.log("Profile" + profile.toString())
        return done(null, profile);
    }));

// Google Passport
passport.use(new GoogleStrategy({
        clientID: process.env['GOOGLE_CLIENT_ID'],
        clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
        callbackURL: "/auth/google/callback"
    },
    function (accessToken, refreshToken, profile, done) {
        console.log("Access Token:" + accessToken)
        console.log("Refresh Token:" + refreshToken)
        console.log("Profile" + profile.toString())
        return done(null, profile);
    }
));


// Twitch Passport
TwitchStrategy.prototype.userProfile = function (accessToken, done) {
    var options = {
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
            'Client-ID': process.env['TWITCH_CLIENT_ID'],
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Authorization': 'Bearer ' + accessToken
        }
    };
    request(options, function (error, response, body) {
        if (response && response.statusCode === 200) {
            done(null, JSON.parse(body));
        } else {
            done(JSON.parse(body));
        }
    });
}

passport.use('twitch', new TwitchStrategy({
        authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
        tokenURL: 'https://id.twitch.tv/oauth2/token',
        clientID: process.env['TWITCH_CLIENT_ID'],
        clientSecret: process.env['TWITCH_SECRET'],
        callbackURL: "/auth/google/callback",
        state: true
    },
    function (accessToken, refreshToken, profile, done) {
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;

        done(null, profile);
    }
));


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});


// Define routes.
app.get('/',
    function (req, res) {
        res.json({"Page": "Index"})
    });

app.get('/login',
    function (req, res) {
        console.log('ENV');
        console.log(process.env);
        console.log('Headers:');
        console.log(req.headers)
        res.json({"Page": "Login Page"})
    });

app.get('/auth/google',
    passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/plus.login']}));

app.get('/auth/google/callback',
    passport.authenticate('google', {failureRedirect: '/auth/google'}),
    function (req, res) {
        res.redirect('/');
    });

app.get('/auth/twitch',
    passport.authenticate('twitch', {scope: 'user_read'}));

app.get('/auth/twitch/callback',
    passport.authenticate('twitch', {successRedirect: '/', failureRedirect: '/'}),
    function (req, res) {
        res.redirect('/');
    });

app.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.json({"Username": "Login Page"})
    });

app.get('/logout',
    function (req, res) {
        req.session.destroy(function (err) {
            res.redirect('/');
        });
    });

app.listen(process.env['PORT'] || 8080);