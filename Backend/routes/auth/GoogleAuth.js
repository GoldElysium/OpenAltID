let express = require('express')
let router = express.Router()

let passport = require('passport')
const axios = require('axios')

router.get(
    '/',
    passport.authorize('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/youtube.readonly',
        ],
    }),
    function (req, res) {
        console.log(req.session)
    }
)

router.get(
    '/callback',
    passport.authorize('google', { failureRedirect: '/login' }),
    function (req, res) {
        if (req.user) {
            axios
                .get('https://youtube.googleapis.com/youtube/v3/channels', {
                    params: {
                        part: 'snippet',
                        key: 'AIzaSyDD7AbpgraerVlmPe_Rib-87yEJFBZ0RpY',
                        mine: true,
                    },
                    headers: {
                        Authorization: 'Bearer ' + req.account.bearerToken,
                    },
                })
                .then((resp) => {
                    console.log(resp.data.items[0].snippet)
                })
                .catch((error) => {
                    console.log(error)
                })

            res.json({ Success: true })
        } else {
            res.send('No user in session!')
        }
    }
)

module.exports = router
