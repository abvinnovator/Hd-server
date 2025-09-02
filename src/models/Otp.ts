import pool from '../config/database';

export interface OTP {
  id?: number;
  email: string;
  otp_code: string;
  expires_at: Date;
  is_used?: boolean;
  created_at?: Date;
}

export class OTPModel {
  // Create new OTP
  static async create(email: string, otpCode: string, expiresInMinutes = 10): Promise<void> {
    // First, delete any existing OTPs for this email
    await pool.query('DELETE FROM otps WHERE email = $1', [email]);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const query = `
      INSERT INTO otps (email, otp_code, expires_at)
      VALUES ($1, $2, $3)
    `;
    
    await pool.query(query, [email, otpCode, expiresAt]);
  }

  // Verify OTP
  static async verify(email: string, otpCode: string): Promise<boolean> {
    const query = `
      SELECT * FROM otps 
      WHERE email = $1 AND otp_code = $2 AND expires_at > NOW() AND is_used = FALSE
    `;
    
    const result = await pool.query(query, [email, otpCode]);
    
    if (result.rows.length === 0) {
      return false;
    }

    // Mark OTP as used
    await pool.query('UPDATE otps SET is_used = TRUE WHERE id = $1', [result.rows[0].id]);
    return true;
  }

  // Clean up expired OTPs (call this periodically)
  static async cleanExpired(): Promise<void> {
    await pool.query('DELETE FROM otps WHERE expires_at < NOW() OR is_used = TRUE');
  }
}