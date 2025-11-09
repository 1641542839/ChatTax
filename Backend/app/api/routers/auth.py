"""
Authentication router for login, register, and token management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.database import get_db
from app.schemas.schemas import (
    UserCreate,
    UserResponse,
    Token,
    LoginRequest,
)
from app.services.auth_service import AuthService
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if not payload:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = AuthService.get_user_by_id(db, user_id=int(user_id))
    if user is None:
        raise credentials_exception

    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user exists
    if AuthService.get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    if AuthService.get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create user
    db_user = AuthService.create_user(db, user)
    return db_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login and get access token (email + password only)."""
    # form_data.username actually contains the email (frontend sends email in username field)
    email = form_data.username
    
    # First, detect if this is an OAuth-only account (no password set)
    candidate = AuthService.get_user_by_email(db, email)
    if candidate and not candidate.hashed_password:
        # Explicit message for accounts created via Google OAuth
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account was created with Google Sign-In. Please sign in with Google.",
        )

    user = AuthService.authenticate_user(db, email, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.post("/google", response_model=Token)
async def google_login(
    google_token: str,
    db: Session = Depends(get_db),
):
    """
    Authenticate user with Google OAuth token.
    
    This endpoint receives a Google ID token from the frontend,
    verifies it with Google, and either creates a new user or
    logs in an existing user.
    
    Args:
        google_token: Google ID token from frontend Google Sign-In
        db: Database session
        
    Returns:
        JWT access token and refresh token
        
    Raises:
        HTTPException 401: If Google token is invalid
        HTTPException 400: If email is not verified
    """
    from app.services.google_oauth_service import google_oauth_service
    
    # Verify Google token and get user info
    token_info = await google_oauth_service.verify_google_token(google_token)
    user_info = google_oauth_service.get_user_info_from_token(token_info)
    
    # Check if user exists by Google ID
    user = AuthService.get_user_by_google_id(db, user_info["google_id"])
    
    if not user:
        # Check if user exists by email (existing account linking)
        user = AuthService.get_user_by_email(db, user_info["email"])
        
        if user:
            # Link existing account to Google
            user.google_id = user_info["google_id"]
            user.avatar_url = user_info["avatar_url"]
            user.oauth_provider = "google"
            db.commit()
            db.refresh(user)
        else:
            # Create new user from Google account
            user = AuthService.create_oauth_user(
                db,
                email=user_info["email"],
                full_name=user_info["full_name"],
                google_id=user_info["google_id"],
                avatar_url=user_info["avatar_url"],
            )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    # Create JWT tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }
