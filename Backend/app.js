require('dotenv').config();

const express           = require('express');
const session           = require('express-session');
const passport          = require('passport');
const request           = require('request');
const bodyParser        = require('body-parser');
const morgan            = require('morgan')('combined');

const TwitterStrategy   = require('passport-twitter').Strategy;
const GoogleStrategy    = require('passport-google-oauth').OAuth2Strategy;
const TwitchStrategy    = require('passport-oauth').OAuth2Strategy;
const DiscordStrategy   = require('passport-discord').Strategy;
const RedditStrategy    = require('passport-reddit').Strategy;

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
passport.use(new TwitterStrategy({
        consumerKey: process.env.TWITTER_CLIENT_ID,
        consumerSecret: process.env.TWITTER_CLIENT_SECRET,
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
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
            'Client-ID': process.env.TWITCH_CLIENT_ID,
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
        clientID: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        state: true
    },
    function (accessToken, refreshToken, profile, done) {
        console.log("Access Token:" + accessToken)
        console.log("Refresh Token:" + refreshToken)
        console.log("Profile" + profile.toString())
        return done(null, profile);
    }
));


// Reddit Passport
passport.use(new RedditStrategy({
        clientID: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        callbackURL: "/auth/reddit/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        console.log("Access Token:" + accessToken)
        console.log("Refresh Token:" + refreshToken)
        console.log("Profile" + profile.toString())
        return done(null, profile);
    }
));


// Discord Passport
passport.use(new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: '/auth/discord/callback',
        scope: ['identify', 'guilds'],
        state: true
    },
    function(accessToken, refreshToken, profile, done) {
        console.log("Access Token:" + accessToken)
        console.log("Refresh Token:" + refreshToken)
        console.log("Profile" + profile.toString())
        return done(null, profile);
    }));



// Serialize Stuff
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
        res.redirect('/auth/discord')
    });

// Google (tested) /////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/auth/google',
    passport.authorize('google', {scope: ['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/plus.login']
    }));

app.get('/auth/google/callback',
    passport.authorize('google', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful
        console.log("Successful")
        res.json({"Success": true})
    });

// Twitch (redirect mismatch) //////////////////////////////////////////////////////////////////////////////////////////
app.get('/auth/twitch',
    passport.authorize('twitch', {
        scope: 'user_read',
        successRedirect: '/',
        failureRedirect: '/'
    }));

app.get('/auth/twitch/callback',
    passport.authorize('twitch', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful
        console.log("Successful")
        res.json({"Success": true})
    });

// Discord (redirect mismatch) /////////////////////////////////////////////////////////////////////////////////////////
app.get('/auth/discord',
    passport.authenticate('discord'));

app.get('/auth/discord/callback',
    passport.authenticate('discord'),
    function(req, res) {
        // Successful
        console.log("Successful")
        res.json({"Success": true})
    });

// Reddit //////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/auth/reddit', function (req, res, next) {
    req.session.state = crypto.randomBytes(32).toString('hex');
    passport.authorize('reddit', {
        state: req.session.state
    });
});

app.get('/auth/reddit/callback', function (req, res, next) {
    if (req.query.state === req.session.state) {
        passport.authorize('reddit', {
            successRedirect: '/'
        })(req, res, next);
    } else {
        next(new Error(403))
    }
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