/**
 * Google Login Button Component
 * Provides Google Sign-In functionality with one-tap login
 */

'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { loginWithGoogle } from '@/services/googleAuth';
import { useAuthStore } from '@/store/authStore';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Google Login Button with OAuth integration
 * 
 * Features:
 * - One-tap login experience
 * - Automatic user creation/login
 * - JWT token management
 * - Error handling with user feedback
 */
export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error('Google Client ID not configured');
    return null;
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      message.error('Failed to get Google credentials');
      return;
    }

    try {
      // Send Google token to backend
      const response = await loginWithGoogle(credentialResponse.credential);

      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }

      // Update auth store
      setToken(response.access_token);

      // Get user info
      // Note: You might want to fetch user details from /api/auth/me
      
      message.success('Successfully logged in with Google!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
        // Refresh to update navbar
        window.location.reload();
      }
    } catch (error) {
      console.error('Google login error:', error);
      message.error('Failed to login with Google. Please try again.');
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  const handleGoogleError = () => {
    message.error('Google login failed. Please try again.');
    console.error('Google Sign-In failed');
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="google-login-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
        />
      </div>
    </GoogleOAuthProvider>
  );
}

/**
 * Standalone Google Login Button (without provider wrapper)
 * Use this when GoogleOAuthProvider is already set up in parent component
 */
export function GoogleLoginButtonOnly({ onSuccess, onError }: GoogleLoginButtonProps) {
  const router = useRouter();
  const { setToken } = useAuthStore();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      message.error('Failed to get Google credentials');
      return;
    }

    try {
      const response = await loginWithGoogle(credentialResponse.credential);
      
      localStorage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      
      setToken(response.access_token);
      message.success('Successfully logged in with Google!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/chat');
      }
    } catch (error) {
      console.error('Google login error:', error);
      message.error('Failed to login with Google. Please try again.');
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => {
        message.error('Google login failed');
        console.error('Google Sign-In failed');
      }}
      theme="outline"
      size="large"
      text="signin_with"
      shape="rectangular"
    />
  );
}
