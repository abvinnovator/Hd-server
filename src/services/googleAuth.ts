import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/config';

const client = new OAuth2Client(config.google.clientId);

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export class GoogleAuthService {
  // Verify Google ID token
  static async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo | null> {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        return null;
      }

      return {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
      };
    } catch (error) {
      console.error('❌ Google token verification failed:', error);
      return null;
    }
  }

  // Generate Google OAuth URL (for future use if needed)
  static getGoogleAuthUrl(): string {
    const redirectUri = `${config.frontend.url}/auth/google/callback`;
    const scope = 'openid email profile';
    
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.google.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  }
}