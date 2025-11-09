"""
Chat Session model for storing conversation history.

Supports:
- Multi-turn conversations
- Checklist generation context
- User identity extraction from conversation
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class ChatSession(Base):
    """
    Chat session model for managing conversation history.
    
    Attributes:
        id: Primary key
        session_id: Unique UUID for session
        user_id: Foreign key to users table
        title: Session title (auto-generated from first message)
        conversation_history: JSON array of messages
        extracted_identity: Extracted ChecklistIdentityInfo (JSON)
        checklist_id: Associated checklist (if generated)
        checklist_generated: Whether checklist has been generated
        is_active: Whether session is active
        created_at: Session creation timestamp
        updated_at: Last update timestamp
    """
    
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Session metadata
    title = Column(String, nullable=True)  # Auto-generated from first message
    
    # Conversation data
    conversation_history = Column(JSON, default=list)  # [{"role": "user|assistant", "content": "..."}]
    
    # Checklist generation context
    extracted_identity = Column(JSON, nullable=True)  # ChecklistIdentityInfo as dict
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=True)
    checklist_generated = Column(Boolean, default=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    checklist = relationship("Checklist", back_populates="chat_session")
