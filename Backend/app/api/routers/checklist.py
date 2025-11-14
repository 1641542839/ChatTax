"""
Checklist API router for tax preparation checklist endpoints.

Follows SOLID principles:
- Single Responsibility: Only handles HTTP routing and request/response
- Open/Closed: Extensible through dependency injection
- Liskov Substitution: Follows FastAPI router patterns
- Interface Segregation: Clean API interface
- Dependency Inversion: Depends on service abstractions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.schemas import (
    ChecklistGenerateRequest,
    ChecklistResponse,
    ChecklistUpdateRequest
)
from app.services.checklist_service import ChecklistService, GenerationMode
from app.models.user import User
from app.api.dependencies import get_current_user

# Create router with prefix and tags
router = APIRouter(
    prefix="/api/checklist",
    tags=["checklist"],
    responses={404: {"description": "Not found"}}
)


# Dependency for checklist service
def get_checklist_service(db: Session = Depends(get_db)) -> ChecklistService:
    """Get checklist service instance with database session."""
    return ChecklistService(db)


@router.post(
    "/generate",
    response_model=ChecklistResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate personalized tax checklist",
    description="""
    Generate a personalized tax preparation checklist based on user's identity information.
    
    Supports three generation modes (Path 1, 2, 3):
    - form: Quick form-based generation (default)
    - guided_chat: From guided conversation (requires session_id)
    - free_chat: From free conversation (requires session_id)
    
    The checklist is tailored to the user's tax situation.
    """
)
async def generate_checklist(
    request: ChecklistGenerateRequest,
    generation_mode: GenerationMode = GenerationMode.FORM,
    session_id: str = None,
    current_user: User = Depends(get_current_user),
    checklist_service: ChecklistService = Depends(get_checklist_service)
) -> ChecklistResponse:
    """
    Generate and save a personalized tax checklist.
    
    Follows Open/Closed Principle - extended to support multiple modes
    without breaking existing functionality.
    
    Args:
        request: Checklist generation request with identity_info
        generation_mode: How checklist is generated (form/guided_chat/free_chat)
        session_id: Required for guided_chat and free_chat modes
        current_user: Authenticated user (injected)
        checklist_service: Checklist service (injected)
        
    Returns:
        ChecklistResponse with generated checklist items
        
    Raises:
        HTTPException: If generation fails or parameters invalid
    """
    try:
        # Validate parameters for chat-based modes
        if generation_mode in [GenerationMode.GUIDED_CHAT, GenerationMode.FREE_CHAT]:
            if not session_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"session_id is required for {generation_mode} mode"
                )
            
            # Generate from conversation
            checklist = await checklist_service.generate_from_conversation(
                user_id=current_user.id,
                session_id=session_id,
                generation_mode=generation_mode
            )
        else:
            # Form-based generation (Path 1)
            checklist = await checklist_service.generate_and_save_checklist(
                user_id=current_user.id,
                identity_info=request.identity_info,
                generation_mode=generation_mode,
                session_id=session_id
            )
        
        return checklist
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate checklist: {str(e)}"
        )


@router.get(
    "/{checklist_id}",
    response_model=ChecklistResponse,
    summary="Get checklist by ID",
    description="Retrieve a specific checklist by its ID. User must own the checklist."
)
async def get_checklist(
    checklist_id: int,
    user_id: int,
    checklist_service: ChecklistService = Depends(get_checklist_service)
) -> ChecklistResponse:
    """
    Get a checklist by ID.
    
    Args:
        checklist_id: ID of the checklist
        user_id: ID of the user (for authorization)
        checklist_service: Checklist service (injected)
        
    Returns:
        ChecklistResponse
        
    Raises:
        HTTPException: If checklist not found or doesn't belong to user
    """
    checklist = checklist_service.get_checklist(checklist_id, user_id)
    
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist {checklist_id} not found or you don't have access"
        )
    
    return checklist


@router.get(
    "/user/{user_id}",
    response_model=List[ChecklistResponse],
    summary="Get all checklists for a user",
    description="Retrieve all checklists belonging to a specific user, ordered by creation date (newest first)."
)
async def get_user_checklists(
    user_id: int,
    checklist_service: ChecklistService = Depends(get_checklist_service)
) -> List[ChecklistResponse]:
    """
    Get all checklists for a user.
    
    Args:
        user_id: ID of the user
        checklist_service: Checklist service (injected)
        
    Returns:
        List of ChecklistResponse objects
    """
    return checklist_service.get_user_checklists(user_id)


@router.patch(
    "/{checklist_id}/status",
    response_model=ChecklistResponse,
    summary="Update checklist item status",
    description="""
    Update the status of a specific checklist item.
    
    Status can be:
    - todo: Not started
    - doing: In progress
    - done: Completed
    """
)
async def update_item_status(
    checklist_id: int,
    user_id: int,
    update_request: ChecklistUpdateRequest,
    checklist_service: ChecklistService = Depends(get_checklist_service)
) -> ChecklistResponse:
    """
    Update the status of a checklist item.
    
    Args:
        checklist_id: ID of the checklist
        user_id: ID of the user (for authorization)
        update_request: Request with item_id and new status
        checklist_service: Checklist service (injected)
        
    Returns:
        Updated ChecklistResponse
        
    Raises:
        HTTPException: If checklist or item not found
    """
    checklist = checklist_service.update_item_status(
        checklist_id=checklist_id,
        user_id=user_id,
        item_id=update_request.item_id,
        new_status=update_request.status
    )
    
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist {checklist_id} or item {update_request.item_id} not found"
        )
    
    return checklist


@router.delete(
    "/{checklist_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a checklist",
    description="Delete a checklist. User must own the checklist."
)
async def delete_checklist(
    checklist_id: int,
    user_id: int,
    checklist_service: ChecklistService = Depends(get_checklist_service)
):
    """
    Delete a checklist.
    
    Args:
        checklist_id: ID of the checklist
        user_id: ID of the user (for authorization)
        checklist_service: Checklist service (injected)
        
    Raises:
        HTTPException: If checklist not found
    """
    success = checklist_service.delete_checklist(checklist_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist {checklist_id} not found or you don't have access"
        )
    
    return None


@router.post(
    "/generate-from-session",
    response_model=ChecklistResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate checklist from chat session",
    description="""
    Generate a personalized checklist from an existing chat session's extracted identity.
    
    This endpoint analyzes the conversation history in the specified session and generates
    a tailored tax preparation checklist based on the information gathered during the chat.
    
    Requirements:
    - Session must belong to the current user
    - Session must have sufficient information (completion >= 60%)
    - Checklist must not already exist for this session
    """
)
async def generate_checklist_from_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    checklist_service: ChecklistService = Depends(get_checklist_service)
) -> ChecklistResponse:
    """
    Generate checklist from chat session's extracted identity information.
    
    Business logic:
    1. Validate session ownership
    2. Check if checklist already exists
    3. Verify extracted_identity has sufficient information
    4. Generate checklist using LLM
    5. Link checklist to session
    
    Args:
        session_id: UUID of the chat session
        current_user: Authenticated user (injected)
        db: Database session (injected)
        checklist_service: Checklist service (injected)
        
    Returns:
        ChecklistResponse with generated checklist
        
    Raises:
        HTTPException 404: Session not found
        HTTPException 400: Checklist already exists or insufficient information
    """
    from app.services.session_service import SessionService
    from app.schemas.schemas import ChecklistIdentityInfo
    from app.services.identity_extraction_service import get_identity_extraction_service
    
    # Get session
    session = SessionService.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check if checklist already exists
    if session.checklist_generated and session.checklist_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Checklist already exists for this session (ID: {session.checklist_id}). Use regenerate endpoint to update."
        )
    
    # Check if we have extracted identity
    if not session.extracted_identity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough information collected. Continue chatting to provide more details about your tax situation."
        )
    
    # Calculate completion percentage
    extraction_service = get_identity_extraction_service()
    identity_info = ChecklistIdentityInfo(**session.extracted_identity)
    completion_pct = extraction_service._calculate_completion(identity_info)
    
    if completion_pct < 60:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient information ({completion_pct}% complete). Please provide more details. Need at least 60%."
        )
    
    # Generate checklist
    checklist = await checklist_service.generate_and_save_checklist(
        user_id=current_user.id,
        identity_info=identity_info
    )
    
    # Link checklist to session
    session.checklist_id = checklist.id
    session.checklist_generated = True
    db.commit()
    db.refresh(session)
    
    print(f"[checklist.py] ✅ Generated checklist {checklist.id} from session {session_id}")
    
    return checklist


@router.put(
    "/{checklist_id}/regenerate",
    response_model=ChecklistResponse,
    summary="Regenerate checklist",
    description="""
    Regenerate an existing checklist with updated information.
    
    Can regenerate based on:
    - Original identity_info (if no session_id provided)
    - Updated session.extracted_identity (if session_id provided)
    
    This is useful when the user provides additional information after initial generation.
    """
)
async def regenerate_checklist(
    checklist_id: int,
    session_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    checklist_service: ChecklistService = Depends(get_checklist_service)
) -> ChecklistResponse:
    """
    Regenerate checklist with updated information.
    
    Args:
        checklist_id: ID of existing checklist
        session_id: Optional session ID to use updated extracted_identity
        current_user: Authenticated user (injected)
        db: Database session (injected)
        checklist_service: Checklist service (injected)
        
    Returns:
        ChecklistResponse with regenerated checklist
        
    Raises:
        HTTPException 404: Checklist not found
    """
    from app.services.session_service import SessionService
    from app.schemas.schemas import ChecklistIdentityInfo
    from app.models.checklist import Checklist
    from datetime import datetime
    
    # Get existing checklist
    existing = checklist_service.get_checklist(checklist_id, current_user.id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found"
        )
    
    # Determine which identity_info to use
    if session_id:
        session = SessionService.get_session(db, session_id, current_user.id)
        if session and session.extracted_identity:
            identity_info = ChecklistIdentityInfo(**session.extracted_identity)
            print(f"[checklist.py] Using updated identity from session {session_id}")
        else:
            identity_info = existing.identity_info
            print(f"[checklist.py] Session not found or no extracted_identity, using original")
    else:
        identity_info = existing.identity_info
        print(f"[checklist.py] No session provided, using original identity_info")
    
    # Regenerate checklist items using LLM
    from app.services.llm_service import get_llm_service
    llm_service = get_llm_service()
    new_items = await llm_service.generate_tax_checklist(identity_info)
    
    # Update database
    checklist_model = db.query(Checklist).filter_by(id=checklist_id, user_id=current_user.id).first()
    if not checklist_model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist not found")
    
    checklist_model.identity_info = identity_info.model_dump()
    checklist_model.checklist_json = new_items
    checklist_model.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(checklist_model)
    
    print(f"[checklist.py] ✅ Regenerated checklist {checklist_id} with {len(new_items)} items")
    
    return checklist_service._to_response(checklist_model)
