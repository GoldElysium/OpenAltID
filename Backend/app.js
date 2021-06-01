require('dotenv').config();

const express           = require('express');
const session           = require('express-session');
const passport          = require('passport');
const request           = require('request');
const bodyParser        = require('body-parser');
const morgan            = require('morgan')('combined');
const cors              = require('cors')
const mongoose = require('mongoose');

const TwitterStrategy   = require('passport-twitter').Strategy;
const GoogleStrategy    = require('passport-google-oauth').OAuth2Strategy;
const TwitchStrategy    = require('passport-oauth').OAuth2Strategy;
const DiscordStrategy   = require('passport-discord').Strategy;
const RedditStrategy    = require('passport-reddit').Strategy;

mongoose.connect('mongodb+srv://botuser:WPkkmEqWkUNqTdSU@hefsverificationbot.lgjlc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Connected to database!")
});

let connection = new mongoose.Schema({
    id: String,
    type: String,
    createdAt: Date
})

let User = new mongoose.Schema({
    _id: Number, // the discord id
    username: String,
    mfa_enabled: Boolean,
    premium_type: {type: Number, min: 0, max: 3},
    verified: Boolean,
    accessToken: String,
    avatar: String,
    connections: [connection]
});

let trustProxy = false;
if (process.env.DYNO) {
    trustProxy = true;
}

// Create the express app
const app = express();

app.use(morgan);
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
    origin: 'http://localhost:8000'
}))
app.use(session({
    secret: process.env['SECRET'],
    resave: true,
    saveUninitialized: true,
    cookie: {
        // This must be set to true for production, but it needs SSL, which can't be done from local.
        // See: https://stackoverflow.com/questions/11277779/passportjs-deserializeuser-never-called
        secure: false
    }}));
app.use(passport.initialize());
app.use(passport.session());


// Twitter Passport
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
            connections: [connection]
        })
        console.log("Profile" + profile.id)
        return done(null, profile);
    }));

// Google Passport
passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8080/auth/google/callback"
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
        callbackURL: "http://localhost:8080/auth/google/callback",
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
        callbackURL: "http://localhost:8080/auth/reddit/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        console.log("Function")
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
        callbackURL: 'http://localhost:8080/auth/discord/callback',
        scope: ['identify'],
        state: false
    },
    function(accessToken, refreshToken, profile, done) {
        console.log("Access Token:" + accessToken)
        console.log("Refresh Token:" + refreshToken)

        let usermodel = mongoose.model("User", User)

        let docu = new usermodel({
            _id: parseInt(profile.id),
            username: profile.username,
            mfa_enabled: (profile.mfa_enabled === 'true'),
            premium_type: parseInt(profile.premium_type),
            verified: (profile.verified === 'true'),
            accessToken: profile.accessToken,
            avatar: profile.avatar,
            connection:[]
        });

        let user = usermodel.findOneAndUpdate(
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



// Serialize Stuff
passport.serializeUser(function (user, done) {
    console.log(user.id)
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    // receives the info from the session, is then responsible for getting the info from DB and returning the obj
    // get from DB

    let usermodel = mongoose.model("User", User)
    let userobj;
    usermodel.findById(id).then(docu => {
        console.log("User deserialized: ")
        console.log(docu)
        done(null, docu);
    }).catch(error => {
        console.log(error)
        done(null, null)
    });

    // return the user from db

});


// Define routes.
app.get('/',
    function (req, res) {
    if (req.user) {
    res.json({"Page": "Index", "User":req.user})
    }
    else {
        res.json({"Page": "Index", "User": "none"})
    }
    });

app.get('/login',
    function (req, res) {
        res.redirect('http://localhost:8080/auth/discord')
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
    passport.authenticate('discord', {successRedirect: "/"}),
    function(req, res) {
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

app.get('/failure',
    function (req, res) {
        res.json({"Failed": "could not login"})
    });

app.listen(process.env['PORT'] || 8080);