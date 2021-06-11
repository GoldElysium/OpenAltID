const express = require('express');
const axios = require('axios');
const { UserModel } = require('../../database/models/UserModel');
const { verifyUser } = require('./UserFunctions');
const { getAccountAges } = require('./UserFunctions');
const { getUserConnectionIDs } = require('./UserFunctions');

let router = express.Router();

// This is just a synonym of auth/discord
router.get('/login', function (req, res) {
    res.redirect('http://localhost:8080/auth/discord');
});

// Just destroys the session and goes back /
router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

router.get('/dashboard', function (req, res) {
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

router.get('/is-logged-in', function (req, res) {
    if (req.user) {
        return res.json({ logged_in: true });
    } else {
        return res.status(401).send({ message: 'Not logged in' });
    }
});

router.get('/verify-accounts', async (req, res) => {
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

            /*if (verified) {
                const publication = await rabbitBroker.publish('demo_publication', 'Hello World!');
                publication.on('error', (error) => {

                });
            }*/

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

            UserModel.findOneAndUpdate(
                { _id: req.user.id },
                docu,
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                    useFindAndModify: true,
                },
                function (err) {
                    console.log(err);
                }
            );

            // Todo Set the user as verified in the database

            return res.send({
                verified: verified,
            });
        } catch (e) {
            console.log(e);
            res.status(500).send({
                message: 'Error occurred while fetching account info.',
            });
        }
        res.send('Done.');
    }
});

module.exports = router;
