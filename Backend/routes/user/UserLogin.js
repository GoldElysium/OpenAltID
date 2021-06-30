const express = require('express');
const axios = require('axios');
const { UserModel } = require('../../database/models/UserModel');
const { verificationModel } = require('../../database/models/VerificationDataModel');
const { SocialMediaAccountsModel } = require('../../database/models/SocialMediaAccountsModel');
const { verifyUser } = require('./UserFunctions');
const { getAccountAges } = require('./UserFunctions');
const { getUserConnectionIDs } = require('./UserFunctions');

const Redis = require("ioredis");
const { checkIfAccountExists } = require("./UserFunctions");
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
    res.redirect(process.env.HOSTNAME + '/auth/discord');
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
        return res.status(401).send('No user in session, you must login first.');
    }

    // Avoid doing it again if they were verified
    if (req.user.verified === true) {
        return res.send({
            verified: true,
        });
    }

    try {
        let accounts = await getUserConnectionIDs(req.user);
        // Check for alts, if one is found do not verify the user
        let duplicateFound = await checkIfAccountExists(accounts);
        if (duplicateFound) {
            return res.send({
                verified: false,
                reason: "Alt account detected."
            })
        }
        // Get the ages of the accounts
        accounts = await getAccountAges(accounts);
        let redisValue = await redis.get("uuid:" + req.params.identifier)
        if (!redisValue) {
            return res.send({
                verified: false,
                reason: "Invalid identifier."
            })
        }
        let user_id
        let guild_id

        try {
            redisValue = redisValue.split(":")
            user_id = redisValue[0]
            guild_id = redisValue[1]
        } catch (error) {
            logger.error(error)
            return res.send({
                verified: false,
                reason: "Internal server error."
            })
        }

        let verified = await verifyUser(accounts, guild_id, req.user);

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
            }).exec();

        let key = `complete:${user_id}:${guild_id}`
        let value = "false"
        if (verified) {
            value = "true"
        }

        await redis.set(key, value)

        if (verified) {
            return res.send({
                verified: verified,
                reason: "You should be verified."
            });
        } else {
            return res.send({
                verified: verified,
                reason: "Failed verification, make sure to connect accounts"
            });
        }


    } catch (e) {
        logger.error("Main try")
        logger.error(e)
        return res.send({
            verified: false,
            reason: "Internal server error.",
        })
    }
});

module.exports = router;
