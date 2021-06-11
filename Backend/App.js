require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const morgan = require('morgan')('tiny');
const cors = require('cors');
const mongoose = require('mongoose');

const AuthRouter = require('./routes/auth/AuthRouter');
const UserRouter = require('./routes/user/UserLogin');

// Create the express app
const app = express();

app.use(morgan);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    cors({
        origin: ['http://localhost:8000','https://verify.holoen.fans'],
        credentials: true,
    })
);
app.use(
    session({
        secret: process.env['SECRET'],
        resave: true,
        saveUninitialized: true,
        cookie: {
            // This must be set to true for production, but it needs SSL, which can't be done from local.
            // See: https://stackoverflow.com/questions/11277779/passportjs-deserializeuser-never-called
            secure: false,
            sameSite: 'lax',
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

require('./auth/PassportConfig')(passport);

// Define routes.
app.use('/auth', AuthRouter);
app.use('/user', UserRouter);

app.get('/', function (req, res) {
    if (req.user) {
        res.json({ Page: 'Index', User: req.user });
    } else {
        res.json({ Page: 'Index', User: 'none' });
    }
});

app.get('/login', function (req, res) {
    res.redirect('http://localhost:8080/auth/discord');
});

app.get(
    '/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.json({ Username: 'Login Page' });
    }
);

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

app.get('/failure', function (req, res) {
    res.json({ Failed: 'could not login' });
});

app.listen(process.env['PORT'] || 8080, function (err) {
    if (err) {
        console.log('Failed to start server: ', err);
    } else {
        const db = require('./database/Mongo')();
        console.log('Listening on port: ', process.env['PORT'] || 8080);
    }
});

module.exports = app;