
import { Request, Response, NextFunction } from 'express';

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Date validation (YYYY-MM-DD format)
const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
};

// OTP validation (6 digits)
const isValidOTP = (otp: string): boolean => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

// Signup validation
export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, dob, otp } = req.body;
  const errors: string[] = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Email validation
  if (!email || !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Date of birth validation
  if (!dob || !isValidDate(dob)) {
    errors.push('Please provide a valid date of birth (YYYY-MM-DD format)');
  } else {
    // Check if user is at least 13 years old
    const birthDate = new Date(dob);
    const minAge = new Date();
    minAge.setFullYear(minAge.getFullYear() - 13);
    
    if (birthDate > minAge) {
      errors.push('You must be at least 13 years old to sign up');
    }
  }

  // OTP validation
  if (!otp || !isValidOTP(otp)) {
    errors.push('Please provide a valid 6-digit OTP');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Login validation
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;
  const errors: string[] = [];

  // Email validation
  if (!email || !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // OTP validation
  if (!otp || !isValidOTP(otp)) {
    errors.push('Please provide a valid 6-digit OTP');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Send OTP validation
export const validateSendOTP = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  const errors: string[] = [];

  // Email validation
  if (!email || !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Google auth validation
export const validateGoogleAuth = (req: Request, res: Response, next: NextFunction) => {
  const { idToken } = req.body;
  const errors: string[] = [];

  if (!idToken || typeof idToken !== 'string') {
    errors.push('Google ID token is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};