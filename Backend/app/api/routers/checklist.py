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
from app.services.checklist_service import ChecklistService

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
    
    The checklist is tailored to the user's:
    - Employment status
    - Income sources
    - Dependents
    - Investments
    - Rental properties
    - First-time filer status
    
    Returns a checklist with items categorized as todo/doing/done.
    """
)
async def generate_checklist(
    request: ChecklistGenerateRequest,
    checklist_service: ChecklistService = Depends(get_checklist_service)
) -> ChecklistResponse:
    """
    Generate and save a personalized tax checklist.
    
    Follows Single Responsibility Principle - only handles HTTP layer.
    
    Args:
        request: Checklist generation request with user_id and identity_info
        checklist_service: Checklist service (injected)
        
    Returns:
        ChecklistResponse with generated checklist items
        
    Raises:
        HTTPException: If generation fails
    """
    try:
        checklist = await checklist_service.generate_and_save_checklist(
            user_id=request.user_id,
            identity_info=request.identity_info
        )
        return checklist
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
