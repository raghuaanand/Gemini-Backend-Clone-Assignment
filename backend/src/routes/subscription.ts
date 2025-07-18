import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import {
  subscribePro,
  subscriptionStatus
} from '../controllers/subscriptionController';

const router = Router();

router.post('/subscribe/pro', authenticateJWT, subscribePro);
router.get('/subscription/status', authenticateJWT, subscriptionStatus);

export default router; 