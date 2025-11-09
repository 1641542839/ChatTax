# Google OAuth Integration

Complete guide for Google OAuth 2.0 authentication in ChatTax Backend.

## Overview

ChatTax supports Google Sign-In using OAuth 2.0 protocol. Users can log in with their Google account without creating a separate password.

### Features

- **One-Click Login**: Sign in with Google button
- **Automatic Account Creation**: New users created automatically from Google profile
- **Account Linking**: Existing email accounts can be linked to Google
- **Secure Token Verification**: Tokens verified directly with Google
- **Avatar Support**: User profile pictures from Google

---

## Setup Instructions

### 1. Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - App name: ChatTax
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/auth/callback/google`
7. Copy **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add to `.env`:

```bash
# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
```

### 3. Install Dependencies

```bash
cd Backend
pip install -r requirements.txt

# Includes:
# authlib==1.3.2
# itsdangerous==2.2.0
```

### 4. Update Database Schema

Run migrations to add OAuth fields to User model:

```bash
# If using Alembic
alembic revision --autogenerate -m "Add OAuth fields"
alembic upgrade head

# Or recreate database (development only)
rm chattax.db
python -c "from app.db.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

---

## API Endpoints

### POST /api/auth/google

Authenticate user with Google OAuth token.

**Request:**

```json
{
  "google_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjJ..."
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid Google token
- `400 Bad Request`: Email not verified or missing
- `500 Internal Server Error`: Google OAuth not configured

---

## Database Schema Changes

### User Model Updates

```python
class User(Base):
    __tablename__ = "users"
    
    # Existing fields
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)  # ← Now nullable
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # NEW OAuth fields
    google_id = Column(String, unique=True, index=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    oauth_provider = Column(String, nullable=True)  # 'google', 'github', etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

**Key Changes:**
- `hashed_password` is now **nullable** (OAuth users don't have passwords)
- `google_id` stores Google user ID for identification
- `avatar_url` stores user's Google profile picture
- `oauth_provider` identifies authentication method

---

## Implementation Details

### Google Token Verification

```python
# app/services/google_oauth_service.py

async def verify_google_token(self, token: str) -> Dict[str, Any]:
    """Verify Google ID token and extract user information."""
    verify_url = "https://oauth2.googleapis.com/tokeninfo"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(verify_url, params={"id_token": token})
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        token_info = response.json()
        
        # Verify audience (client ID)
        if token_info.get("aud") != self.client_id:
            raise HTTPException(status_code=401, detail="Token audience mismatch")
        
        return {
            "email": token_info.get("email"),
            "email_verified": token_info.get("email_verified") == "true",
            "name": token_info.get("name"),
            "picture": token_info.get("picture"),
            "google_id": token_info.get("sub"),
        }
```

### User Creation/Login Flow

```
1. Frontend sends Google ID token
    ↓
2. Backend verifies token with Google
    ↓
3. Check if user exists by google_id
    ↓
4a. User exists → Login
    ↓
4b. User not exists → Check by email
    ↓
5a. Email exists → Link Google account
    ↓
5b. Email not exists → Create new user
    ↓
6. Generate JWT tokens
    ↓
7. Return tokens to frontend
```

### AuthService Updates

```python
# app/services/auth_service.py

@staticmethod
def create_oauth_user(
    db: Session,
    email: str,
    full_name: str,
    google_id: str,
    avatar_url: Optional[str] = None,
) -> User:
    """Create a new user from OAuth (Google) authentication."""
    # Generate unique username from email
    username = email.split("@")[0]
    base_username = username
    counter = 1
    
    while AuthService.get_user_by_username(db, username):
        username = f"{base_username}{counter}"
        counter += 1
    
    db_user = User(
        email=email,
        username=username,
        full_name=full_name,
        google_id=google_id,
        avatar_url=avatar_url,
        oauth_provider="google",
        hashed_password=None,  # OAuth users don't have password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

---

## Security Considerations

### Token Verification

1. **Verify Token Signature**: Tokens verified directly with Google's tokeninfo endpoint
2. **Check Audience**: Ensure token `aud` matches our Client ID
3. **Email Verification**: Only accept tokens with `email_verified: true`
4. **Token Expiry**: Google tokens expire after 1 hour

### Account Linking

- If email already exists (non-OAuth user), link Google account
- User can then sign in with either password or Google
- `google_id` is stored for future OAuth logins

### Password Handling

- OAuth users have `hashed_password = NULL`
- These users cannot log in with password
- Must use Google Sign-In to authenticate

---

## Testing

### Manual Testing

1. **Test with curl** (get token from frontend first):

```bash
curl -X POST http://localhost:8000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "google_token": "YOUR_GOOGLE_TOKEN_HERE"
  }'
```

2. **Expected Response**:

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### Testing Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| **New Google user** | Creates new account, returns tokens |
| **Existing Google user** | Logs in, returns tokens |
| **Existing email user** | Links Google, returns tokens |
| **Invalid token** | Returns 401 error |
| **Unverified email** | Returns 400 error |

---

## Troubleshooting

### Error: "Google OAuth not configured"

**Cause**: `GOOGLE_CLIENT_ID` not set in environment

**Solution**:
```bash
# Add to .env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Error: "Invalid Google token"

**Causes**:
- Token expired (>1 hour old)
- Token from different client ID
- Malformed token

**Solution**: Get fresh token from frontend

### Error: "Token audience mismatch"

**Cause**: Token's `aud` field doesn't match Backend `GOOGLE_CLIENT_ID`

**Solution**: Ensure Frontend and Backend use same Google Client ID

### Error: "Email not verified"

**Cause**: User's Google email not verified

**Solution**: User must verify email in Google account

---

## Production Deployment

### Environment Variables

```bash
# Production .env
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback/google
```

### Google Console Configuration

Update authorized origins and redirect URIs:

```
Authorized JavaScript origins:
- https://yourdomain.com
- https://www.yourdomain.com

Authorized redirect URIs:
- https://yourdomain.com/auth/callback/google
- https://www.yourdomain.com/auth/callback/google
```

### Database Migration

```bash
# Production database migration
alembic upgrade head
```

---

## For GitHub Copilot

**OAuth Integration Context**:
ChatTax Backend integrates Google OAuth 2.0 for authentication. Google ID tokens verified via Google's tokeninfo endpoint. Users created/linked in database with `google_id`, `avatar_url`, `oauth_provider` fields. JWT tokens generated after successful OAuth verification.

**Key Components**:
- `GoogleOAuthService`: Token verification service
- `POST /api/auth/google`: OAuth login endpoint
- `User` model: Added OAuth fields (google_id, avatar_url, oauth_provider)
- `AuthService.create_oauth_user()`: Creates OAuth users

**Flow**: Frontend → Google token → Backend verify → Check user exists → Create/link/login → Return JWT

**Critical Files**:
- `app/services/google_oauth_service.py` - Token verification
- `app/api/routers/auth.py` - OAuth endpoint
- `app/models/user.py` - User model with OAuth fields
- `app/services/auth_service.py` - OAuth user creation

---

**See also**: 
- [Frontend OAuth Integration](../../../Frontend/docs/03-api/oauth-integration.md)
- [Authentication Guide](./endpoints.md)
- [User Management](../05-database/database-management.md)
