"""
Session Service for managing chat sessions and conversation history.

Responsibilities:
- Create new chat sessions
- Load existing sessions with history
- Add messages to sessions
- Update session metadata (title, checklist link)
- List user's sessions
"""
import uuid
import json
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.chat_session import ChatSession
from app.models.user import User


class SessionService:
    """Service for managing chat sessions."""
    
    @staticmethod
    def create_session(db: Session, user_id: int, title: Optional[str] = None) -> ChatSession:
        """
        Create a new chat session for a user.
        
        Args:
            db: Database session
            user_id: User ID
            title: Optional session title (auto-generated if None)
            
        Returns:
            ChatSession: Newly created session
        """
        session_id = str(uuid.uuid4())
        
        new_session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            title=title or "新对话",
            conversation_history=[],
            is_active=True
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return new_session
    
    @staticmethod
    def get_session(db: Session, session_id: str, user_id: int) -> Optional[ChatSession]:
        """
        Get a session by ID (with user ownership check).
        
        Args:
            db: Database session
            session_id: Session UUID
            user_id: User ID (for ownership verification)
            
        Returns:
            ChatSession or None if not found/unauthorized
        """
        return db.query(ChatSession).filter(
            ChatSession.session_id == session_id,
            ChatSession.user_id == user_id
        ).first()
    
    @staticmethod
    def get_session_by_id(db: Session, id: int, user_id: int) -> Optional[ChatSession]:
        """
        Get a session by database ID.
        
        Args:
            db: Database session
            id: Database ID
            user_id: User ID (for ownership verification)
            
        Returns:
            ChatSession or None
        """
        return db.query(ChatSession).filter(
            ChatSession.id == id,
            ChatSession.user_id == user_id
        ).first()
    
    @staticmethod
    def list_user_sessions(
        db: Session, 
        user_id: int, 
        limit: int = 50,
        include_inactive: bool = False
    ) -> List[ChatSession]:
        """
        List all sessions for a user.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of sessions to return
            include_inactive: Whether to include inactive sessions
            
        Returns:
            List of ChatSession objects (newest first)
        """
        query = db.query(ChatSession).filter(ChatSession.user_id == user_id)
        
        if not include_inactive:
            query = query.filter(ChatSession.is_active == True)
        
        return query.order_by(ChatSession.updated_at.desc()).limit(limit).all()
    
    @staticmethod
    def add_message(
        db: Session, 
        session_id: str, 
        user_id: int,
        role: str, 
        content: str
    ) -> Optional[ChatSession]:
        """
        Add a message to a session's conversation history.
        
        Args:
            db: Database session
            session_id: Session UUID
            user_id: User ID
            role: Message role ("user" or "assistant")
            content: Message content
            
        Returns:
            Updated ChatSession or None if not found
        """
        session = SessionService.get_session(db, session_id, user_id)
        
        if not session:
            return None
        
        # Parse existing history
        history = session.conversation_history or []
        
        # Add new message
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        history.append(message)
        
        # Update session
        session.conversation_history = history
        
        # Auto-generate title from first user message
        if not session.title or session.title == "新对话":
            if role == "user" and len(history) <= 2:
                # Use first 50 chars of first user message as title
                session.title = content[:50] + "..." if len(content) > 50 else content
        
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def update_checklist_link(
        db: Session, 
        session_id: str, 
        user_id: int,
        checklist_id: int
    ) -> Optional[ChatSession]:
        """
        Link a checklist to a session.
        
        Args:
            db: Database session
            session_id: Session UUID
            user_id: User ID
            checklist_id: Checklist ID to link
            
        Returns:
            Updated ChatSession or None if not found
        """
        session = SessionService.get_session(db, session_id, user_id)
        
        if not session:
            return None
        
        session.checklist_id = checklist_id
        session.checklist_generated = True
        
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def update_extracted_identity(
        db: Session,
        session_id: str,
        user_id: int,
        identity_info: Dict
    ) -> Optional[ChatSession]:
        """
        Update extracted identity information from conversation.
        
        Args:
            db: Database session
            session_id: Session UUID
            user_id: User ID
            identity_info: Dictionary with identity fields
            
        Returns:
            Updated ChatSession or None if not found
        """
        session = SessionService.get_session(db, session_id, user_id)
        
        if not session:
            return None
        
        session.extracted_identity = identity_info
        
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def deactivate_session(
        db: Session,
        session_id: str,
        user_id: int
    ) -> Optional[ChatSession]:
        """
        Mark a session as inactive (soft delete).
        
        Args:
            db: Database session
            session_id: Session UUID
            user_id: User ID
            
        Returns:
            Updated ChatSession or None if not found
        """
        session = SessionService.get_session(db, session_id, user_id)
        
        if not session:
            return None
        
        session.is_active = False
        
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def get_conversation_history(
        db: Session,
        session_id: str,
        user_id: int
    ) -> List[Dict]:
        """
        Get conversation history for a session.
        
        Args:
            db: Database session
            session_id: Session UUID
            user_id: User ID
            
        Returns:
            List of message dictionaries
        """
        session = SessionService.get_session(db, session_id, user_id)
        
        if not session:
            return []
        
        return session.conversation_history or []
    
    @staticmethod
    def clear_conversation_history(
        db: Session,
        session_id: str,
        user_id: int
    ) -> Optional[ChatSession]:
        """
        Clear all messages from a session (keeps session metadata).
        
        Args:
            db: Database session
            session_id: Session UUID
            user_id: User ID
            
        Returns:
            Updated ChatSession or None if not found
        """
        session = SessionService.get_session(db, session_id, user_id)
        
        if not session:
            return None
        
        session.conversation_history = []
        session.extracted_identity = None
        session.checklist_id = None
        session.checklist_generated = False
        
        db.commit()
        db.refresh(session)
        
        return session
