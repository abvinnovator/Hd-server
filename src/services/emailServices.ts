import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { OTPModel } from '../models/Otp'

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

export class EmailService {
  // Send OTP for signup
  static async sendSignupOTP(email: string, name: string): Promise<string> {
    const otp = generateOTP();
    
    // Save OTP to database
    await OTPModel.create(email, otp, 10); // 10 minutes expiry

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Notes App" <${config.email.user}>`,
      to: email,
      subject: 'Complete Your Signup - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Notes App!</h2>
          <p>Hi ${name},</p>
          <p>Thanks for signing up! Please use the following OTP to complete your registration:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 2.5em; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 0.9em;">Best regards,<br>Notes App Team</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Signup OTP sent to:', email);
      return otp; // Return for testing purposes (remove in production)
    } catch (error) {
      console.error('❌ Error sending signup OTP:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send OTP for login
  static async sendLoginOTP(email: string): Promise<string> {
    const otp = generateOTP();
    
    // Save OTP to database
    await OTPModel.create(email, otp, 10); // 10 minutes expiry

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Notes App" <${config.email.user}>`,
      to: email,
      subject: 'Login OTP - Notes App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Login to Notes App</h2>
          <p>Here's your login OTP:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2196F3; font-size: 2.5em; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 0.9em;">Best regards,<br>Notes App Team</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Login OTP sent to:', email);
      return otp; // Return for testing purposes (remove in production)
    } catch (error) {
      console.error('❌ Error sending login OTP:', error);
      throw new Error('Failed to send login OTP');
    }
  }
}