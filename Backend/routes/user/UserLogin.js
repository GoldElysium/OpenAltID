let express = require('express');
let router = express.Router();

// This is just a synonym of auth/discord
router.get('/login',
    function (req, res) {
        res.redirect('http://localhost:8080/auth/discord')
    });

// Just destroys the session and goes back /
router.get('/logout',
    function (req, res) {
        req.session.destroy(function (err) {
            res.redirect('/');
        });
    });