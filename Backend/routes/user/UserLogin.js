const express = require('express');
const axios = require('axios');
const { UserModel } = require('../../database/models/UserModel');
const { verificationModel } = require('../../database/models/VerificationData');
const { verifyUser } = require('./UserFunctions');
const { getAccountAges } = require('./UserFunctions');
const { getUserConnectionIDs } = require('./UserFunctions');

const Redis = require("ioredis");
const { logger } = require("../../logger");

const redis = new Redis({
    port: 6379,
    host: "Redis",
})

redis.on("ready", async ()=>{
    logger.info("IOREDIS is ready!")
    await redis.set("Test", "IOREDIS TEST: SUCCESS")
    let response = await redis.get("Test")
    logger.info(response)
})

redis.on("error", (error) => {
    logger.error("IOREDIS ERROR - "+error)
})

let router = express.Router();

// This is just a synonym of auth/discord
router.get('/login', async function (req, res) {
    console.log("/login HOSTNAME:" + process.env.HOSTNAME)
    res.redirect("http://localhost:8080" + '/auth/discord');
});

// Just destroys the session and goes back /
router.get('/logout', async function (req, res) {
    req.session.destroy(function (err) {
        return res.send("Logged out user.")
    });
});

router.get('/dashboard', async function (req, res) {
    if (!req.user) {
        return res.status(401).send({ message: 'Not logged in' });
    } else {
        return res.send({
            avatar: req.user.avatar,
            username: req.user.username,
            verified: req.user.verified,
            id: req.user._id,
        });
    }
});

router.get('/is-logged-in', async function (req, res) {
    if (req.user) {
        return res.json({ logged_in: true });
    } else {
        return res.status(401).send({ message: 'Not logged in' });
    }
});

router.get('/verify-accounts/:identifier', async (req, res) => {
    if (!req.user) {
        return res.status(401).send({
            message: 'No user in session, you must login first.',
        });
    } else {
        // Avoid doing it again if they were verified
        if (req.user.verified) {
            return res.send({
                verified: req.user.verified,
            });
        }

        try {
            let accounts = await getUserConnectionIDs(req.user);
            accounts = await getAccountAges(accounts);

            // Todo Actually pass in the real server ID
            let verified = await verifyUser(accounts, 123456789, req.user);

            let docu = new UserModel({
                _id: req.user.id,
                username: req.user.username,
                mfa_enabled:
                    String(req.user.mfa_enabled).toLowerCase() === 'true',
                premium_type: parseInt(req.user.premium_type),
                verifiedEmail: req.user.verifiedEmail,
                verified: verified,
                accessToken: req.user.accessToken,
                avatar: req.user.avatar,
                connection: [],
            });

            await UserModel.findOneAndUpdate(
                { _id: req.user.id },
                docu,
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                    useFindAndModify: true,
                }).exec();
            logger.info("KEYS: " + await redis.keys("*"))
            logger.info("IDENTIFIER: " + "uuid:" + req.params.identifier)
            let redisValue = await redis.get("uuid:" + req.params.identifier)
            logger.info(redisValue)
            if (redisValue) {
                redisValue = redisValue.split(":")
                let user_id = redisValue[0]
                let guild_id = redisValue[1]
                let key = `complete:${user_id}:${guild_id}`
                let value = "false"
                if (verified) {
                    value = "true"
                }
                await redis.set(key, value)
                return res.send({
                    verified: verified,
                });
            }
            else {
                logger.error("Incorrect identifier.")
                return res.status(500).send({
                    message: 'Incorrect identifier.',
                });
            }

        } catch (e) {
            logger.error(e)
            return res.status(500).send({
                message: 'Error occurred while fetching account info.',
            });
        }
    }
});

module.exports = router;
