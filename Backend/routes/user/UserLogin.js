const express = require('express');
const axios = require('axios');
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

router.get('/verify-accounts', async (req, res) => {
    if (!req.user) {
        return res.status(401).send({
            message: 'No user in session, you must login first.',
        });
    } else {
        try {
            let accounts = await getUserConnectionIDs(req.user);
            accounts = await getAccountAges(accounts);

            // Todo Actually pass in the real server ID
            let verified = await verifyUser(accounts, 123456789, req.user);

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
