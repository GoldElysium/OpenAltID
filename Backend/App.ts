import 'dotenv/config';

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan';
import cors from 'cors';
import connectRedis from 'connect-redis';
import redis from 'redis';
import helmet from 'helmet';
import AuthRouter from './routes/auth/AuthRouter';
import UserRouter from './routes/user/UserLogin';
import logger from './logger';
import MongoDb from './database/Mongo';

const morganTiny = morgan('tiny');
MongoDb();

// Create the express app
const app = express();

app.use(helmet());
app.use(morganTiny);
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: ['http://localhost:8000', 'https://verify.holoen.fans'],
        credentials: true,
    }),
);

app.set('trust proxy', 1);
const RedisStore = connectRedis(session);

const redisClient = redis.createClient({
    host: 'Redis',
    port: 6379,
});
redisClient.on('error', (err: Error) => {
    logger.error('Could not connect to Redis for session!');
    logger.error(err);
    process.exit(0);
});
redisClient.on('connect', () => {
    logger.info('Connected to Redis for session!');
});

app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: process.env.SECRET as string,
        resave: true,
        saveUninitialized: true,
        cookie: {
            // eslint-disable-next-line max-len
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
require('./auth/strategies/Discord').DiscordAuth(passport);

// Define routes.
app.use('/auth', AuthRouter);
app.use('/user', UserRouter);

app.get('/', async (_: express.Request, res: express.Response) => {
    res.send('The server is running! yay.');
});

app.listen(process.env.PORT || 8080, () => {
    logger.info(`Listening on port: ${process.env.PORT || 8080}`);
});

export default app;
