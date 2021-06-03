let express = require('express')
let router = express.Router()

let passport = require('passport')

router.get('/', passport.authenticate('discord'))

router.get('/callback', passport.authenticate('discord'), function (req, res) {
    console.log('Successful')
    res.json({ Success: true })
})

module.exports = router
