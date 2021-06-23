require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const morgan = require('morgan')('tiny');
const cors = require('cors');
const redis = require('redis');
const connectRedis = require('connect-redis');

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

console.log(process.env['FRONTEND_HOST'])

app.set('trust proxy', 1);
const RedisStore = connectRedis(session)

const redisClient = redis.createClient({
    // Todo get the ip from env
    host: process.env['REDIS_IP'] || '172.17.0.2',
    port: 6379
});
redisClient.on('error', function (err) {
    console.log('Error while connecting to redis! ' + err);
});
redisClient.on('connect', function () {
    console.log('Connected to Redis!');
});

app.use(
    session({
        store: new RedisStore({client: redisClient}),
        secret: process.env['SECRET'] || "setthisinenv",
        resave: true,
        saveUninitialized: true,
        cookie: {
            // This must be set to true for production, but it needs SSL, which can't be done from local.
            // See: https://stackoverflow.com/questions/11277779/passportjs-deserializeuser-never-called
            secure: false,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 10 // 10 minute sessions
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

require('./auth/PassportConfig')(passport);
require('./auth/strategies/Discord')(passport);

// Define routes.
app.use('/auth', AuthRouter);
app.use('/user', UserRouter);

app.get('/', function (req, res) {
    res.send("The server is running! yay.")
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