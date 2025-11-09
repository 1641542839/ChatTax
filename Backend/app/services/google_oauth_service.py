"""
Google OAuth2 service for authentication.
Handles Google Sign-In integration following OAuth 2.0 protocol.
"""
from typing import Optional, Dict, Any
from authlib.integrations.starlette_client import OAuth
from fastapi import HTTPException, status
import httpx

from app.core.config import settings


class GoogleOAuthService:
    """
    Service for Google OAuth 2.0 authentication.
    
    Responsibilities:
    - Initialize OAuth client configuration
    - Verify Google ID tokens
    - Extract user information from Google tokens
    """

    def __init__(self):
        """Initialize Google OAuth configuration."""
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret
        self.redirect_uri = settings.google_redirect_uri

    async def verify_google_token(self, token: str) -> Dict[str, Any]:
        """
        Verify Google ID token and extract user information.
        
        Args:
            token: Google ID token from frontend
            
        Returns:
            Dict containing user information (email, name, picture, sub)
            
        Raises:
            HTTPException: If token verification fails
        """
        if not self.client_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth not configured. Please set GOOGLE_CLIENT_ID.",
            )

        # Google's token verification endpoint
        verify_url = "https://oauth2.googleapis.com/tokeninfo"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    verify_url,
                    params={"id_token": token}
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google token",
                    )
                
                token_info = response.json()
                
                # Verify token audience (client ID)
                if token_info.get("aud") != self.client_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token audience mismatch",
                    )
                
                # Verify token is not expired
                if int(token_info.get("exp", 0)) < httpx.get("https://www.google.com/").elapsed.total_seconds():
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token expired",
                    )
                
                return {
                    "email": token_info.get("email"),
                    "email_verified": token_info.get("email_verified") == "true",
                    "name": token_info.get("name"),
                    "picture": token_info.get("picture"),
                    "google_id": token_info.get("sub"),
                }
                
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to verify token with Google: {str(exc)}",
            )

    def get_user_info_from_token(self, token_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract and validate user information from verified token.
        
        Args:
            token_info: Verified token information from Google
            
        Returns:
            Dict with standardized user information
            
        Raises:
            HTTPException: If required information is missing
        """
        email = token_info.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google",
            )
        
        if not token_info.get("email_verified"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not verified by Google",
            )
        
        return {
            "email": email,
            "full_name": token_info.get("name", ""),
            "avatar_url": token_info.get("picture"),
            "google_id": token_info.get("google_id"),
        }


# Singleton instance
google_oauth_service = GoogleOAuthService()
