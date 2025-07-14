import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { me } from '../controllers/userController';

const router = Router();

router.get('/me', authenticateJWT, me);

export default router; 