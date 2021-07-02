require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const morgan = require('morgan')('tiny');
const cors = require('cors');
const connectRedis = require('connect-redis');
const promBundle = require('express-prom-bundle');

const metricsMiddleware = promBundle({ includeMethod: true });

const redis = require('redis');
const helmet = require('helmet');
const AuthRouter = require('./routes/auth/AuthRouter');
const UserRouter = require('./routes/user/UserLogin');
const { logger } = require('./logger');
require('./database/Mongo')();

// Create the express app
const app = express();

app.use(metricsMiddleware);
app.use(helmet());
app.use(morgan);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    cors({
        origin: ['http://localhost:8000', 'https://verify.holoen.fans'],
        credentials: true,
    }),
);

app.set('trust proxy', 1);
const RedisStore = connectRedis(session);

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
});
redisClient.on('error', (err) => {
    logger.error('Could not connect to Redis for session!');
    logger.error(err)
});
redisClient.on('connect', () => {
    logger.info('Connected to Redis for session!');
});

app.use(
    session({
        store: new RedisStore({client: redisClient}),
        secret: process.env.SECRET,
        resave: true,
        saveUninitialized: true,
        cookie: {
            // This must be set to true for production, but it needs SSL, which can't be done from local.
            // See: https://stackoverflow.com/questions/11277779/passportjs-deserializeuser-never-called
            secure: false,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 10, // 10 minute sessions
        },
    }),
);
app.use(passport.initialize());
app.use(passport.session());

require('./auth/PassportConfig')(passport);
require('./auth/strategies/Discord')(passport);

// Define routes.
app.use('/auth', AuthRouter);
app.use('/user', UserRouter);

app.get('/', async (req, res) => {
    res.send('The server is running! yay.');
});

app.listen(process.env.PORT || 8080, (err) => {
    if (err) {
        logger.error('An error occurred while starting the server.');
    } else {
        logger.info(`Listening on port: ${process.env.PORT || 8080}`);
    }
});

module.exports = app;
