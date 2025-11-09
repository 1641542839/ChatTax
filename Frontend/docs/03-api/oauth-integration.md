# Google OAuth Integration

Complete guide for implementing Google Sign-In in ChatTax Frontend.

## Overview

ChatTax Frontend provides Google Sign-In functionality using `@react-oauth/google` library. Users can authenticate with their Google account for quick, secure access.

### Features

- **One-Tap Login**: Streamlined Google Sign-In experience
- **Automatic Token Handling**: JWT tokens stored and managed automatically
- **User Profile**: Access to Google profile information (name, avatar)
- **Seamless Integration**: Works alongside traditional email/password auth

---

## Setup Instructions

### 1. Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (same as Backend)
3. Navigate to **Credentials**
4. Find your OAuth 2.0 Client ID
5. Copy the **Client ID** (ends with `.apps.googleusercontent.com`)

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Google OAuth 2.0
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Backend API (if not already set)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Important**: Must use `NEXT_PUBLIC_` prefix for client-side access.

### 3. Install Dependencies

```bash
cd Frontend
npm install @react-oauth/google
```

---

## Implementation

### GoogleLoginButton Component

```typescript
// src/components/auth/GoogleLoginButton.tsx

'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { loginWithGoogle } from '@/services/googleAuth';
import { useAuthStore } from '@/store/authStore';

export function GoogleLoginButton({ onSuccess, onError }) {
  const router = useRouter();
  const { setToken } = useAuthStore();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error('Google Client ID not configured');
    return null;
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // Send Google token to backend
      const response = await loginWithGoogle(credentialResponse.credential);

      // Store JWT tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      setToken(response.access_token);
      message.success('Successfully logged in with Google!');
      
      router.push('/chat');
    } catch (error) {
      message.error('Failed to login with Google');
      console.error('Google login error:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => message.error('Google login failed')}
        useOneTap
        theme="outline"
        size="large"
      />
    </GoogleOAuthProvider>
  );
}
```

### Google Auth Service

```typescript
// src/services/googleAuth.ts

import { apiClient } from './api';
import type { LoginResponse } from '@/types/api';

/**
 * Authenticate user with Google OAuth token
 */
export async function loginWithGoogle(googleToken: string): Promise<LoginResponse> {
  const response = await apiClient<LoginResponse>('/api/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      google_token: googleToken,
    }),
  });

  return response;
}
```

### Integration in Login Page

```typescript
// src/app/login/page.tsx

'use client';

import { Form, Input, Button, Divider } from 'antd';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

export default function LoginPage() {
  const [form] = Form.useForm();

  const handleEmailLogin = async (values: any) => {
    // Handle email/password login
  };

  return (
    <div className="login-container">
      <h1>Login to ChatTax</h1>
      
      {/* Google Login Button */}
      <GoogleLoginButton />
      
      <Divider>OR</Divider>
      
      {/* Traditional Login Form */}
      <Form form={form} onFinish={handleEmailLogin} layout="vertical">
        <Form.Item label="Email" name="email" rules={[{ required: true }]}>
          <Input type="email" placeholder="Enter your email" />
        </Form.Item>
        
        <Form.Item label="Password" name="password" rules={[{ required: true }]}>
          <Input.Password placeholder="Enter your password" />
        </Form.Item>
        
        <Button type="primary" htmlType="submit" block>
          Login with Email
        </Button>
      </Form>
    </div>
  );
}
```

---

## API Integration

### Authentication Flow

```
1. User clicks "Sign in with Google"
    ↓
2. Google OAuth popup/one-tap appears
    ↓
3. User authorizes ChatTax
    ↓
4. Google returns credential (ID token)
    ↓
5. Frontend sends token to Backend: POST /api/auth/google
    ↓
6. Backend verifies token with Google
    ↓
7. Backend creates/logs in user
    ↓
8. Backend returns JWT tokens
    ↓
9. Frontend stores tokens in localStorage
    ↓
10. Frontend redirects to /chat
```

### Backend Endpoint

**POST /api/auth/google**

Request:
```json
{
  "google_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## Component Props

### GoogleLoginButton

```typescript
interface GoogleLoginButtonProps {
  onSuccess?: () => void;          // Called after successful login
  onError?: (error: Error) => void; // Called on login failure
}
```

### GoogleLogin (from @react-oauth/google)

```typescript
<GoogleLogin
  onSuccess={(response) => {}}  // Credential response handler
  onError={() => {}}            // Error handler
  useOneTap={true}              // Enable one-tap login
  theme="outline"               // "outline" | "filled_blue" | "filled_black"
  size="large"                  // "small" | "medium" | "large"
  text="signin_with"            // Button text variant
  shape="rectangular"           // "rectangular" | "pill" | "circle" | "square"
/>
```

---

## Styling

### Button Customization

```css
/* styles/google-login.css */

.google-login-wrapper {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

/* Override Google button styles if needed */
.google-login-wrapper > div {
  width: 100% !important;
}

.google-login-wrapper button {
  width: 100% !important;
  max-width: 400px;
}
```

### With Tailwind CSS

```typescript
<div className="flex justify-center my-5">
  <GoogleLoginButton />
</div>
```

---

## Error Handling

### Common Errors

**1. "Google Client ID not configured"**

```typescript
// Component won't render if missing
if (!googleClientId) {
  console.error('Google Client ID not configured');
  return null;
}
```

**Solution**: Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`

**2. "Failed to get Google credentials"**

```typescript
if (!credentialResponse.credential) {
  message.error('Failed to get Google credentials');
  return;
}
```

**Causes**:
- User closed popup
- Network error
- Browser blocked popup

**3. Backend API Error (401/400)**

```typescript
try {
  const response = await loginWithGoogle(token);
} catch (error) {
  if (error instanceof APIError) {
    if (error.status === 401) {
      message.error('Invalid Google token');
    } else if (error.status === 400) {
      message.error('Email not verified');
    }
  }
}
```

---

## TypeScript Types

### API Types

```typescript
// src/types/api.ts

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  oauth_provider: 'google' | null;
  is_active: boolean;
  created_at: string;
}
```

### Component Types

```typescript
// Credential response from Google
interface CredentialResponse {
  credential: string;  // JWT token from Google
  select_by: string;   // How user selected (e.g., "btn", "one_tap")
}
```

---

## Testing

### Manual Testing

1. **Check Environment Variables**:
```bash
# Verify GOOGLE_CLIENT_ID is set
echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

2. **Test Login Flow**:
   - Open `http://localhost:3000/login`
   - Click "Sign in with Google"
   - Authorize with Google account
   - Should redirect to `/chat`
   - Check localStorage for tokens:
     ```javascript
     localStorage.getItem('access_token')
     localStorage.getItem('refresh_token')
     ```

3. **Test One-Tap**:
   - Refresh page
   - One-tap prompt should appear
   - Click to auto-login

### Browser Console Testing

```javascript
// Check if Google Client ID is loaded
console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

// Manually trigger login (if you have token)
import { loginWithGoogle } from '@/services/googleAuth';
const response = await loginWithGoogle('YOUR_GOOGLE_TOKEN');
console.log('Tokens:', response);
```

---

## Security Best Practices

### 1. Token Storage

```typescript
// Store tokens in localStorage (simple)
localStorage.setItem('access_token', response.access_token);

// Or use httpOnly cookies (more secure, requires Backend setup)
// Backend sets cookie in response
```

### 2. Token Expiry Handling

```typescript
// Check token expiry before API calls
const token = localStorage.getItem('access_token');
if (isTokenExpired(token)) {
  // Refresh token or re-authenticate
  await refreshAccessToken();
}
```

### 3. Logout Cleanup

```typescript
export function logout() {
  // Clear all auth data
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // Revoke Google session (optional)
  // google.accounts.id.disableAutoSelect();
  
  router.push('/login');
}
```

---

## Troubleshooting

### Issue: One-Tap Not Showing

**Causes**:
- Already logged in
- User dismissed one-tap 3+ times
- Cookies blocked

**Solutions**:
```typescript
// Reset one-tap dismissal
google.accounts.id.cancel();

// Or disable one-tap for testing
<GoogleLogin useOneTap={false} />
```

### Issue: CORS Error

**Error**: `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution**: Ensure Backend CORS allows Frontend origin:
```python
# Backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: "Popup Blocked"

**Cause**: Browser blocking Google popup

**Solution**:
- Allow popups for localhost
- Use `useOneTap={true}` for better UX
- Show user message to enable popups

---

## Production Deployment

### Environment Variables

```bash
# Production .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### Google Console Configuration

Update authorized origins:

```
Authorized JavaScript origins:
- https://yourdomain.com
- https://www.yourdomain.com

Authorized redirect URIs:
- https://yourdomain.com/auth/callback/google
```

### Build Configuration

```bash
# Verify environment variables
npm run build

# Check built files include correct Client ID
grep -r "NEXT_PUBLIC_GOOGLE_CLIENT_ID" .next/
```

---

## For GitHub Copilot

**OAuth Integration Context**:
ChatTax Frontend integrates Google Sign-In using `@react-oauth/google`. GoogleLoginButton component wraps GoogleOAuthProvider and GoogleLogin. On success, sends Google ID token to Backend `/api/auth/google`. Backend returns JWT tokens stored in localStorage. User redirected to /chat after authentication.

**Key Components**:
- `GoogleLoginButton`: Main OAuth component with provider wrapper
- `GoogleLoginButtonOnly`: Button without provider (for reuse)
- `loginWithGoogle()`: Service function to send token to Backend
- `useAuthStore`: Zustand store for auth state management

**Flow**: Click button → Google auth → Get credential → Send to Backend → Receive JWT → Store tokens → Redirect

**Critical Files**:
- `src/components/auth/GoogleLoginButton.tsx` - Google login component
- `src/services/googleAuth.ts` - API integration
- `.env.local` - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` configuration

**Props**: `onSuccess?: () => void`, `onError?: (error: Error) => void`

---

**See also**:
- [Backend OAuth Integration](../../../Backend/docs/03-api/oauth-integration.md)
- [API Integration Guide](./integration.md)
- [Authentication Service](./integration.md#authentication)
