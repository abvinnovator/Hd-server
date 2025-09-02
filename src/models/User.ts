
import pool from '../config/database';

export interface User {
  id?: number;
  name: string;
  email: string;
  dob?: string;
  password_hash?: string;
  google_id?: string;
  is_google_user?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  // Create new user
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const query = `
      INSERT INTO users (name, email, dob, password_hash, google_id, is_google_user)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, dob, is_google_user, created_at
    `;
    
    const values = [
      userData.name,
      userData.email,
      userData.dob || null,
      userData.password_hash || null,
      userData.google_id || null,
      userData.is_google_user || false,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  // Find user by Google ID
  static async findByGoogleId(googleId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await pool.query(query, [googleId]);
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT id, name, email, dob, is_google_user, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Update user
  static async update(id: number, userData: Partial<User>): Promise<User | null> {
    const fields = Object.keys(userData).filter(key => key !== 'id');
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => userData[field as keyof User])];

    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, email, dob, is_google_user, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
}