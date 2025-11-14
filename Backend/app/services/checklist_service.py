"""
Checklist service for managing tax preparation checklists.

Follows SOLID principles:
- Single Responsibility: Only handles checklist business logic
- Open/Closed: Extensible through dependency injection
- Dependency Inversion: Depends on abstractions (SQLAlchemy models)
"""
from typing import List, Dict, Optional
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from datetime import datetime
from app.models.checklist import Checklist
from app.schemas.schemas import ChecklistIdentityInfo, ChecklistItem, ChecklistResponse
from app.services.llm_service import get_llm_service
from app.services.identity_extractor_service import IdentityExtractorService
from app.services.session_service import SessionService


class GenerationMode(str, Enum):
    """Checklist generation modes."""
    FORM = "form"  # Path 1: Quick form-based generation
    GUIDED_CHAT = "guided_chat"  # Path 2: Guided conversation
    FREE_CHAT = "free_chat"  # Path 3: Free conversation extraction


class ChecklistService:
    """
    Service for managing tax preparation checklists.
    
    Follows Single Responsibility Principle - handles all checklist-related business logic.
    """
    
    def __init__(self, db: Session):
        """
        Initialize checklist service with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        self.llm_service = get_llm_service()
    
    async def generate_and_save_checklist(
        self, 
        user_id: int, 
        identity_info: ChecklistIdentityInfo,
        generation_mode: GenerationMode = GenerationMode.FORM,
        session_id: Optional[str] = None
    ) -> ChecklistResponse:
        """
        Generate a personalized checklist using LLM and save to database.
        
        Follows Open/Closed Principle - extended to support three generation modes
        without modifying the core logic.
        
        Args:
            user_id: ID of the user
            identity_info: User's identity and tax situation information
            generation_mode: How checklist was generated (form/guided_chat/free_chat)
            session_id: Optional session ID for chat-based generation
            
        Returns:
            ChecklistResponse with generated checklist
            
        Raises:
            Exception: If checklist generation or database save fails
        """
        # DEBUG: Log identity_info before LLM call
        print(f"🔍 ChecklistService - identity_info to be sent to LLM:")
        print(f"  - employment_status: {identity_info.employment_status}")
        print(f"  - income_sources: {identity_info.income_sources}")
        print(f"  - has_dependents: {identity_info.has_dependents}")
        print(f"  - has_investment: {identity_info.has_investment}")
        print(f"  - has_rental_property: {identity_info.has_rental_property}")
        print(f"  - is_first_time_filer: {identity_info.is_first_time_filer}")
        print(f"  - additional_info: {identity_info.additional_info}")
        
        # Step 1: Generate checklist using LLM
        checklist_items = await self.llm_service.generate_tax_checklist(identity_info)
        
        # Step 2: Create database record
        checklist = Checklist(
            user_id=user_id,
            identity_info=identity_info.model_dump(),
            checklist_json=checklist_items,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Step 3: Save to database
        self.db.add(checklist)
        self.db.commit()
        self.db.refresh(checklist)
        
        # Step 4: Link to session if provided (for chat-based generation)
        if session_id:
            SessionService.update_checklist_link(
                db=self.db,
                session_id=session_id,
                user_id=user_id,
                checklist_id=checklist.id
            )
        
        # Step 5: Convert to response schema
        return self._to_response(checklist)
    
    async def generate_from_conversation(
        self,
        user_id: int,
        session_id: str,
        generation_mode: GenerationMode = GenerationMode.FREE_CHAT
    ) -> ChecklistResponse:
        """
        Generate checklist from conversation history (Path 2 & 3).
        
        Follows Single Responsibility - delegates extraction to IdentityExtractorService.
        
        Args:
            user_id: ID of the user
            session_id: Session UUID containing conversation
            generation_mode: guided_chat or free_chat
            
        Returns:
            ChecklistResponse with generated checklist
            
        Raises:
            ValueError: If session not found or insufficient information
        """
        # Step 1: Get session and conversation history
        session = SessionService.get_session(self.db, session_id, user_id)
        if not session:
            raise ValueError("Session not found")
        
        conversation_history = session.conversation_history or []
        if not conversation_history:
            raise ValueError("No conversation history found")
        
        # Step 2: Extract identity info from conversation
        extraction_result = IdentityExtractorService.extract_identity_from_conversation(
            conversation_history
        )
        
        if not extraction_result["is_complete"]:
            raise ValueError(
                f"Insufficient information. Missing fields: {extraction_result['missing_fields']}"
            )
        
        # Step 3: Format for checklist generation
        identity_info_dict = IdentityExtractorService.format_for_checklist(
            extraction_result["extracted_info"]
        )
        identity_info = ChecklistIdentityInfo(**identity_info_dict)
        
        # Step 4: Generate and save checklist with session link
        return await self.generate_and_save_checklist(
            user_id=user_id,
            identity_info=identity_info,
            generation_mode=generation_mode,
            session_id=session_id
        )
    
    def get_checklist(self, checklist_id: int, user_id: int) -> Optional[ChecklistResponse]:
        """
        Retrieve a checklist by ID.
        
        Args:
            checklist_id: ID of the checklist
            user_id: ID of the user (for authorization)
            
        Returns:
            ChecklistResponse if found and belongs to user, None otherwise
        """
        checklist = self.db.query(Checklist).filter(
            Checklist.id == checklist_id,
            Checklist.user_id == user_id
        ).first()
        
        if checklist:
            return self._to_response(checklist)
        return None
    
    def get_user_checklists(self, user_id: int) -> List[ChecklistResponse]:
        """
        Get all checklists for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of ChecklistResponse objects
        """
        checklists = self.db.query(Checklist).filter(
            Checklist.user_id == user_id
        ).order_by(Checklist.created_at.desc()).all()
        
        return [self._to_response(checklist) for checklist in checklists]
    
    def update_item_status(
        self, 
        checklist_id: int, 
        user_id: int, 
        item_id: str, 
        new_status: str
    ) -> Optional[ChecklistResponse]:
        """
        Update the status of a specific checklist item.
        
        Follows Single Responsibility - only updates status, validation happens elsewhere.
        
        Args:
            checklist_id: ID of the checklist
            user_id: ID of the user (for authorization)
            item_id: ID of the item to update
            new_status: New status (todo, doing, done)
            
        Returns:
            Updated ChecklistResponse if successful, None if not found
        """
        checklist = self.db.query(Checklist).filter(
            Checklist.id == checklist_id,
            Checklist.user_id == user_id
        ).first()
        
        if not checklist:
            return None
        
        # Update the specific item's status
        items = checklist.checklist_json
        updated = False
        
        for item in items:
            if item.get("id") == item_id:
                item["status"] = new_status
                updated = True
                break
        
        if not updated:
            return None
        
        # Save updated checklist
        # Need to use flag_modified for JSON fields to track changes
        checklist.checklist_json = items
        flag_modified(checklist, "checklist_json")
        checklist.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(checklist)
        
        return self._to_response(checklist)
    
    def delete_checklist(self, checklist_id: int, user_id: int) -> bool:
        """
        Delete a checklist.
        
        Args:
            checklist_id: ID of the checklist
            user_id: ID of the user (for authorization)
            
        Returns:
            True if deleted, False if not found
        """
        checklist = self.db.query(Checklist).filter(
            Checklist.id == checklist_id,
            Checklist.user_id == user_id
        ).first()
        
        if not checklist:
            return False
        
        self.db.delete(checklist)
        self.db.commit()
        return True
    
    def _to_response(self, checklist: Checklist) -> ChecklistResponse:
        """
        Convert database model to response schema.
        
        Follows Interface Segregation Principle - converts to specific interface.
        
        Args:
            checklist: Database checklist model
            
        Returns:
            ChecklistResponse schema
        """
        # Convert checklist items to ChecklistItem schemas
        items = [
            ChecklistItem(**item) for item in checklist.checklist_json
        ]
        
        return ChecklistResponse(
            id=checklist.id,
            user_id=checklist.user_id,
            identity_info=ChecklistIdentityInfo(**checklist.identity_info),
            items=items,
            created_at=checklist.created_at,
            updated_at=checklist.updated_at
        )


def get_checklist_service(db: Session) -> ChecklistService:
    """
    Factory function for creating ChecklistService instance.
    
    Follows Dependency Inversion Principle - returns abstraction.
    
    Args:
        db: SQLAlchemy database session
        
    Returns:
        ChecklistService instance
    """
    return ChecklistService(db)
