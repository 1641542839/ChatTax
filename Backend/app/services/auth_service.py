"""
Authentication service for user management.
"""
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.schemas import UserCreate
from app.core.security import get_password_hash, verify_password
from typing import Optional


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
        """Get user by Google ID."""
        return db.query(User).filter(User.google_id == google_id).first()

    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """Create a new user."""
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            username=user.username,
            hashed_password=hashed_password,
            full_name=user.full_name,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def create_oauth_user(
        db: Session,
        email: str,
        full_name: str,
        google_id: str,
        avatar_url: Optional[str] = None,
    ) -> User:
        """
        Create a new user from OAuth (Google) authentication.
        
        Args:
            db: Database session
            email: User email from Google
            full_name: User full name from Google
            google_id: Google user ID
            avatar_url: User avatar URL from Google
            
        Returns:
            Created User instance
        """
        # Generate username from email
        username = email.split("@")[0]
        base_username = username
        counter = 1
        
        # Ensure unique username
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

    @staticmethod
    def authenticate_user(
        db: Session, email: str, password: str
    ) -> Optional[User]:
        """Authenticate user with email and password (email only, no username)."""
        # Only look up by email
        user = AuthService.get_user_by_email(db, email)
        if not user:
            return None
        # Disallow password login for OAuth-only accounts (no hashed password)
        if not user.hashed_password:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
