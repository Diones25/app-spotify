import { Router } from 'express';
import spotifyController from '../controllers/spotify';

const router = Router();

router.get('/login', spotifyController.login);
router.get('/callback', spotifyController.callback);
router.get('/api/refresh_token', spotifyController.refreshToken);

export default router;