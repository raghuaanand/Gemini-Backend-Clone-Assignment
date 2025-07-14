import { Router } from 'express';

const router = Router();

// Controllers (to be implemented)
import {
  signup,
  sendOtp,
  verifyOtp,
  forgotPassword,
  changePassword
} from '../controllers/authController';

router.post('/signup', signup);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', changePassword);

export default router; 