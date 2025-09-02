
import express from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  validateSignup,
  validateLogin,
  validateSendOTP,
  validateGoogleAuth,
} from "../middleware/Validation"

const router = express.Router();

// Public routes
router.post('/send-signup-otp', validateSendOTP, AuthController.sendSignupOTP);
router.post('/signup', validateSignup, AuthController.signup);
router.post('/send-login-otp', validateSendOTP, AuthController.sendLoginOTP);
router.post('/login', validateLogin, AuthController.login);
router.post('/google', validateGoogleAuth, AuthController.googleAuth);

// Protected routes
router.get('/me', authenticateToken, AuthController.getCurrentUser);
router.post('/logout', authenticateToken, AuthController.logout);

export default router;