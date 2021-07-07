import express from 'express';
import DiscordAuth from './DiscordAuth';

const router = express.Router();

router.use('/discord', DiscordAuth);
export default router;
