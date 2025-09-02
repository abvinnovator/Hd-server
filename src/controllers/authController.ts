import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { OTPModel } from '../models/Otp'
import { EmailService } from '../services/emailServices';
import { GoogleAuthService } from '../services/googleAuth';
import { generateToken, AuthRequest } from '../middleware/authMiddleware';

export class AuthController {
  // Send OTP for signup
  static async sendSignupOTP(req: Request, res: Response) {
    try {
      const { email, name } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists. Please login instead.',
        });
      }

      // Send OTP
      await EmailService.sendSignupOTP(email, name);

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email. Please check your inbox.',
      });
    } catch (error) {
      console.error('❌ Send signup OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }
  }

  // Signup with OTP verification
  static async signup(req: Request, res: Response) {
    try {
      const { name, email, dob, otp } = req.body;

      // Verify OTP
      const isValidOTP = await OTPModel.verify(email, otp);
      if (!isValidOTP) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please request a new one.',
        });
      }

      // Check if user already exists (double check)
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists.',
        });
      }

      // Create new user
      const newUser = await UserModel.create({
        name: name.trim(),
        email: email.toLowerCase(),
        dob,
        is_google_user: false,
      });

      // Generate JWT token
      const token = generateToken(newUser.id!);

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            dob: newUser.dob,
            is_google_user: newUser.is_google_user,
          },
          token,
        },
      });
    } catch (error) {
      console.error('❌ Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create account. Please try again.',
      });
    }
  }

  // Send OTP for login
  static async sendLoginOTP(req: Request, res: Response) {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email. Please sign up first.',
        });
      }

      // Check if it's a Google user

      // Send login OTP
      await EmailService.sendLoginOTP(email);

      res.status(200).json({
        success: true,
        message: 'Login OTP sent to your email.',
      });
    } catch (error) {
      console.error('❌ Send login OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send login OTP. Please try again.',
      });
    }
  }

  // Login with OTP
  static async login(req: Request, res: Response) {
    try {
      const { email, otp, rememberMe } = req.body;

      // Check if user exists
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email.',
        });
      }

      // Verify OTP
      const isValidOTP = await OTPModel.verify(email, otp);
      if (!isValidOTP) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please request a new one.',
        });
      }

      // Generate JWT token (longer expiry if remember me is checked)
      const tokenExpiry = rememberMe ? '30d' : '7d';
      const token = generateToken(user.id!);

      res.status(200).json({
        success: true,
        message: 'Login successful!',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            dob: user.dob,
            is_google_user: user.is_google_user,
          },
          token,
        },
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
      });
    }
  }

  // Google authentication
  static async googleAuth(req: Request, res: Response) {
    try {
      const { idToken } = req.body;

      // Verify Google ID token
      const googleUser = await GoogleAuthService.verifyGoogleToken(idToken);
      if (!googleUser) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Google token.',
        });
      }

      // Check if user exists
      let user = await UserModel.findByEmail(googleUser.email);

      if (user) {
        // Existing user - update Google ID if not set
        if (!user.google_id) {
          user = await UserModel.update(user.id!, {
            google_id: googleUser.id,
            is_google_user: true,
          });
        }
      } else {
        // New user - create account
        user = await UserModel.create({
          name: googleUser.name,
          email: googleUser.email,
          google_id: googleUser.id,
          is_google_user: true,
        });
      }

      // Generate JWT token
      const token = generateToken(user!.id!);

      res.status(200).json({
        success: true,
        message: user ? 'Login successful!' : 'Account created and logged in!',
        data: {
          user: {
            id: user!.id,
            name: user!.name,
            email: user!.email,
            dob: user!.dob,
            is_google_user: user!.is_google_user,
          },
          token,
        },
      });
    } catch (error) {
      console.error('❌ Google auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Google authentication failed. Please try again.',
      });
    }
  }

  // Get current user (protected route)
  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const user = req.user;

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            dob: user.dob,
            is_google_user: user.is_google_user,
          },
        },
      });
    } catch (error) {
      console.error('❌ Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user information.',
      });
    }
  }

  // Logout (client-side token removal, but we can add token blacklisting later)
  static async logout(req: Request, res: Response) {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }
}