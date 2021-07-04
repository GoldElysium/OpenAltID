const express = require('express');
const Redis = require('ioredis');
const {checkIfAccountsExists} = require("./UserFunctions");
const { UserModel } = require('../../database/models/UserModel');
const { verifyUser } = require('./UserFunctions');
const { getAccountAges } = require('./UserFunctions');
const { getUserConnectionIDs } = require('./UserFunctions');
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


/**
 * Login route, will just redirect to the internal auth route
 */
router.get('/login', async (_, res) => {
    console.log(`/login HOSTNAME:${process.env.HOSTNAME}`);
    res.redirect(`${process.env.HOSTNAME}/auth/discord`);
});

/**
 * Just destroys the session and goes back
 */
router.get('/logout', async (req, res) => {
    req.session.destroy(() => res.send('Logged out user.'));
});

router.get('/dashboard', async (req, res) => {
    if (!req.user) {
        return res.status(401).send('Not logged in');
    }
    return res.json({
        avatar: req.user.avatar,
        username: req.user.username,
        verified: req.user.verified,
        id: req.user.id,
    });
});

router.get('/is-logged-in', async (req, res) => {
    if (req.user) {
        return res.json({logged_in: true});
    }
    return res.status(401).json({logged_in: false});
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

        let accounts = await getUserConnectionIDs(req.user);
        // Check for alts, if one is found do not verify the user
        logger.info('checking if accounts exist');
        let duplicateFound;
        try {
            duplicateFound = await checkIfAccountsExists(req, accounts);
        } catch (e) {
            logger.error(`Error while finding duplicates: ${e}`);
            return res.json({
                verified: false,
                reason: 'Internal server error.',
            });
        }
        if (duplicateFound) {
            const key = `complete:${userId}:${guildId}`;
            const value = 'error:Alt account detected (same social media account found from a different Discord account';

            await redis.set(key, value);
            return res.json({
                verified: false,
                reason: 'Alt account detected.',
            });
        }
        try {
            accounts = await getAccountAges(accounts);
        } catch (e) {
            logger.error(`Failed to get account ages: ${e}`);
            return res.json({
                verified: false,
                reason: 'Internal server error.',
            });
        }

        if (userId !== req.user.id) {
            return res.json({
                verified: false,
                reason: 'User mismatch!',
            });
        }

        const verificationObj = await verifyUser(accounts, guildId, req.user);
        const verified = verificationObj.verified;
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
            {_id: req.user.id},
            docu,
            {
                upsert: true,
            },
        ).exec();

        const key = `complete:${userId}:${guildId}`;
        const value = verified ? `true:${verificationObj.score}:${verificationObj.minscore}` : `false:${verificationObj.score}:${verificationObj.minscore}`;

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
