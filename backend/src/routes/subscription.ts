import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import {
  subscribePro,
  stripeWebhook,
  subscriptionStatus
} from '../controllers/subscriptionController';
import express from 'express';

const router = Router();

router.post('/subscribe/pro', authenticateJWT, subscribePro);
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
router.get('/subscription/status', authenticateJWT, subscriptionStatus);

export default router; 