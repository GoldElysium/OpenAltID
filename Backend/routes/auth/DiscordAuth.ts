import express from 'express';
import passport from 'passport';

const router = express.Router();

router.get('/', passport.authenticate('discord'));

router.post('/callback', passport.authenticate('discord'), async (_, res) => {
    res.json({ success: true });
});

export default router;
