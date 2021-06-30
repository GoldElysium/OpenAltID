const express = require('express');
const Redis = require('ioredis');
const { UserModel } = require('../../database/models/UserModel');
const { verifyUser } = require('./UserFunctions');
const { getAccountAges } = require('./UserFunctions');
const { getUserConnectionIDs } = require('./UserFunctions');

const { checkIfAccountExists } = require('./UserFunctions');
const { logger } = require('../../logger');

const redis = new Redis({
    port: 6379,
    host: 'Redis',
});

redis.on('ready', async () => {
    logger.info('IOREDIS is ready!');
    await redis.set('Test', 'IOREDIS TEST: SUCCESS');
    const response = await redis.get('Test');
    logger.info(response);
});

redis.on('error', (error) => {
    logger.error(`IOREDIS ERROR - ${error}`);
});

const router = express.Router();

// This is just a synonym of auth/discord
router.get('/login', async (_, res) => {
    console.log(`/login HOSTNAME:${process.env.HOSTNAME}`);
    res.redirect(`${process.env.HOSTNAME}/auth/discord`);
});

// Just destroys the session and goes back /
router.get('/logout', async (req, res) => {
    req.session.destroy(() => res.send('Logged out user.'));
});

router.get('/dashboard', async (req, res) => {
    if (!req.user) {
        return res.status(401).send({ message: 'Not logged in' });
    }
    return res.send({
        avatar: req.user.avatar,
        username: req.user.username,
        verified: req.user.verified,
        id: req.user.id,
    });
});

router.get('/is-logged-in', async (req, res) => {
    if (req.user) {
        return res.json({ logged_in: true });
    }
    return res.status(401).json({ message: 'Not logged in' });
});

router.get('/verify-accounts/:identifier', async (req, res) => {
    if (!req.user) {
        return res.status(401).send('No user in session, you must login first.');
    }

    // Avoid doing it again if they were verified
    if (req.user.verified === true) {
        return res.json({
            verified: true,
        });
    }

    try {
        let accounts = await getUserConnectionIDs(req.user);
        // Check for alts, if one is found do not verify the user
        const duplicateFound = await checkIfAccountExists(accounts);
        if (duplicateFound) {
            return res.json({
                verified: false,
                reason: 'Alt account detected.',
            });
        }
        // Get the ages of the accounts
        accounts = await getAccountAges(accounts);
        let redisValue = await redis.get(`uuid:${req.params.identifier}`);
        if (!redisValue) {
            return res.json({
                verified: false,
                reason: 'Invalid identifier.',
            });
        }
        let userId;
        let guildId;

        try {
            redisValue = redisValue.split(':');
            [userId, guildId] = redisValue;
        } catch (error) {
            logger.error(error);
            return res.json({
                verified: false,
                reason: 'Internal server error.',
            });
        }

        const verified = await verifyUser(accounts, guildId, req.user);

        const docu = new UserModel({
            _id: req.user.id,
            username: req.user.username,
            mfa_enabled:
              String(req.user.mfa_enabled).toLowerCase() === 'true',
            premium_type: parseInt(req.user.premium_type, 10),
            verifiedEmail: req.user.verifiedEmail,
            verified,
            accessToken: req.user.accessToken,
            avatar: req.user.avatar,
            connection: [],
        });

        await UserModel.findOneAndUpdate(
            { _id: req.user.id },
            docu,
            {
                upsert: true,
            },
        ).exec();

        const key = `complete:${userId}:${guildId}`;
        const value = verified ? 'true' : 'false';

        await redis.set(key, value);

        if (verified) {
            return res.json({
                verified,
                reason: 'You should be verified.',
            });
        }
        return res.json({
            verified,
            reason: 'Failed verification, make sure to connect accounts',
        });
    } catch (e) {
        logger.error('Main try');
        logger.error(e);
        return res.json({
            verified: false,
            reason: 'Internal server error.',
        });
    }
});

module.exports = router;
