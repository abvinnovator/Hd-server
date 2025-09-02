import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { UserModel } from '../models/User';

// Extend Request interface to include user
export interface AuthRequest extends Request {
  user?: any;
}

// Generate JWT token
export const generateToken = (userId: number): string => {
  return jwt.sign(
    { userId },
    config.jwtSecret as string,
    { expiresIn: config.jwtExpiresIn } as any
  );
};

// Verify JWT token middleware
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    // Ensure config.jwtSecret is defined and token is a string
    if (!config.jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret not configured',
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    // Check that decoded has userId
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    const user = await UserModel.findById((decoded as { userId: number }).userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};