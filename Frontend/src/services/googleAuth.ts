/**
 * Google OAuth authentication service
 * Handles Google Sign-In integration with Backend API
 */

import { apiClient } from './api';
import type { LoginResponse } from '@/types/api';

export interface GoogleLoginRequest {
  google_token: string;
}

/**
 * Authenticate user with Google OAuth token
 * 
 * @param googleToken - Google ID token from Google Sign-In
 * @returns JWT access token and refresh token
 * @throws APIError if authentication fails
 */
export async function loginWithGoogle(googleToken: string): Promise<LoginResponse> {
  // Send as query parameter
  const response = await apiClient<LoginResponse>(
    `/api/auth/google?google_token=${encodeURIComponent(googleToken)}`,
    {
      method: 'POST',
      auth: false, // Don't send auth token for login
    }
  );

  return response;
}
