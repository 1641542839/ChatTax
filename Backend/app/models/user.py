"""
User model for database.
"""
from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # OAuth fields
    google_id = Column(String, unique=True, index=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    oauth_provider = Column(String, nullable=True)  # 'google', 'github', etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    
    # Relationships
    chat_sessions = relationship("ChatSession", back_populates="user")
