"""
Session API router for managing chat sessions.

Endpoints:
- POST /api/sessions - Create new session
- GET /api/sessions - List user's sessions
- GET /api/sessions/{session_id} - Get session details
- POST /api/sessions/{session_id}/messages - Add message to session
- DELETE /api/sessions/{session_id} - Deactivate session
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.services.session_service import SessionService
from app.services.identity_extractor_service import IdentityExtractorService


router = APIRouter()


# Request/Response Models
class CreateSessionRequest(BaseModel):
    """Request model for creating a new session."""
    title: Optional[str] = None


class AddMessageRequest(BaseModel):
    """Request model for adding a message to a session."""
    role: str  # "user" or "assistant"
    content: str


class SessionResponse(BaseModel):
    """Response model for session data."""
    id: int
    session_id: str
    title: str
    is_active: bool
    checklist_id: Optional[int]
    checklist_generated: bool
    message_count: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class SessionDetailResponse(SessionResponse):
    """Detailed session response with conversation history."""
    conversation_history: List[dict]
    extracted_identity: Optional[dict]
    identity_completion: Optional[dict]
    completion_percentage: int = 0  # 0-100, calculated from extracted_identity
    
    class Config:
        from_attributes = True


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    request: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new chat session for the current user.
    
    Args:
        request: Session creation request
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created session data
    """
    session = SessionService.create_session(
        db=db,
        user_id=current_user.id,
        title=request.title
    )
    
    return SessionResponse(
        id=session.id,
        session_id=session.session_id,
        title=session.title or "New Chat",
        is_active=session.is_active,
        checklist_id=session.checklist_id,
        checklist_generated=session.checklist_generated,
        message_count=len(session.conversation_history or []),
        created_at=session.created_at.isoformat() if session.created_at else "",
        updated_at=session.updated_at.isoformat() if session.updated_at else ""
    )


@router.get("/sessions", response_model=List[SessionResponse])
def list_sessions(
    limit: int = 50,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all sessions for the current user.
    
    Args:
        limit: Maximum number of sessions to return
        include_inactive: Whether to include inactive sessions
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of sessions
    """
    sessions = SessionService.list_user_sessions(
        db=db,
        user_id=current_user.id,
        limit=limit,
        include_inactive=include_inactive
    )
    
    return [
        SessionResponse(
            id=s.id,
            session_id=s.session_id,
            title=s.title or "New Chat",
            is_active=s.is_active,
            checklist_id=s.checklist_id,
            checklist_generated=s.checklist_generated,
            message_count=len(s.conversation_history or []),
            created_at=s.created_at.isoformat() if s.created_at else "",
            updated_at=s.updated_at.isoformat() if s.updated_at else ""
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific session.
    
    Args:
        session_id: Session UUID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Detailed session data with conversation history
    """
    session = SessionService.get_session(db, session_id, current_user.id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Calculate identity completion if there's extracted_identity
    identity_completion = None
    completion_percentage = 0
    
    if session.extracted_identity:
        from app.services.identity_extraction_service import get_identity_extraction_service
        from app.schemas.schemas import ChecklistIdentityInfo
        
        try:
            extraction_service = get_identity_extraction_service()
            identity_info = ChecklistIdentityInfo(**session.extracted_identity)
            completion_percentage = extraction_service._calculate_completion(identity_info)
            
            identity_completion = {
                "completion_percentage": completion_percentage,
                "can_generate_checklist": completion_percentage >= 60
            }
        except Exception as e:
            print(f"[session.py] Error calculating completion: {e}")
    
    return SessionDetailResponse(
        id=session.id,
        session_id=session.session_id,
        title=session.title or "New Chat",
        is_active=session.is_active,
        checklist_id=session.checklist_id,
        checklist_generated=session.checklist_generated,
        message_count=len(session.conversation_history or []),
        conversation_history=session.conversation_history or [],
        extracted_identity=session.extracted_identity,
        identity_completion=identity_completion,
        completion_percentage=completion_percentage,
        created_at=session.created_at.isoformat() if session.created_at else "",
        updated_at=session.updated_at.isoformat() if session.updated_at else ""
    )


@router.post("/sessions/{session_id}/messages", response_model=SessionDetailResponse)
def add_message(
    session_id: str,
    request: AddMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a message to a session's conversation history.
    
    Args:
        session_id: Session UUID
        request: Message data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated session data
    """
    # Validate role
    if request.role not in ["user", "assistant"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'user' or 'assistant'"
        )
    
    session = SessionService.add_message(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
        role=request.role,
        content=request.content
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Extract identity after adding message
    extraction_result = IdentityExtractorService.extract_identity_from_conversation(
        session.conversation_history
    )
    
    # Update extracted identity in session
    if extraction_result["extracted_info"]:
        SessionService.update_extracted_identity(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
            identity_info=extraction_result["extracted_info"]
        )
    
    identity_completion = {
        "completion_percentage": extraction_result["completion_percentage"],
        "missing_fields": extraction_result["missing_fields"],
        "is_complete": extraction_result["is_complete"]
    }
    
    return SessionDetailResponse(
        id=session.id,
        session_id=session.session_id,
        title=session.title or "New Chat",
        is_active=session.is_active,
        checklist_id=session.checklist_id,
        checklist_generated=session.checklist_generated,
        message_count=len(session.conversation_history or []),
        conversation_history=session.conversation_history or [],
        extracted_identity=extraction_result["extracted_info"],
        identity_completion=identity_completion,
        created_at=session.created_at.isoformat() if session.created_at else "",
        updated_at=session.updated_at.isoformat() if session.updated_at else ""
    )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deactivate a session (soft delete).
    
    Args:
        session_id: Session UUID
        db: Database session
        current_user: Authenticated user
    """
    session = SessionService.deactivate_session(db, session_id, current_user.id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return None
