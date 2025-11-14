"""
Chat router for SSE streaming responses with RAG integration.

Follows SOLID principles:
- Single Responsibility: Only handles HTTP streaming
- Dependency Inversion: Depends on ChatService abstraction
"""
import json
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.db.database import get_db
from app.schemas.schemas import ChatMessage, ChatResponse
from app.services.chat_service import ChatService
from app.services.session_service import SessionService
from app.services.context_classifier_service import ContextClassifierService
from app.models.user import User
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/stream")
async def chat_stream(
    message: ChatMessage,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
    session_id: Optional[str] = Query(None, description="Session ID for multi-turn conversation"),
    user_type: str = Query(
        default="individual",
        description="Type of user: individual, business, or professional"
    ),
    use_reranking: bool = Query(
        default=True,
        description="Enable cross-encoder reranking for better accuracy"
    )
):
    """
    Stream chat responses using Server-Sent Events (SSE) with RAG.
    
    **Enhanced with Multi-turn Conversation Support:**
    - Supports session-based conversation history
    - Context-aware intent classification
    - Smart checklist regeneration detection
    
    **RAG Pipeline:**
    1. Load conversation history (if session_id provided)
    2. Classify user intent (EXPLAIN_ITEM, NEW_INFO, UPDATE_REQUEST, GENERAL)
    3. Retrieve relevant documents from vector store
    4. Generate context-aware answer using LLM
    5. Save message to session history
    6. Stream answer back to client in real-time
    
    **Frontend-compatible SSE format:**
    - Chunks: `data: {"type": "chunk", "content": "..."}`
    - Metadata: `data: {"type": "metadata", "intent": "...", "should_regenerate": true/false}`
    - Complete: `data: {"type": "done"}`
    - Error: `data: {"type": "error", "message": "..."}`
    
    **Query Parameters:**
    - `session_id`: Optional session UUID for multi-turn conversation
    - `user_type`: individual (default), business, or professional
    - `use_reranking`: true (default) for better accuracy, false for faster response
    """

    async def event_generator():
        """Generate SSE events for streaming response with session support."""
        try:
            # Step 1: Load conversation history if session provided
            conversation_history = []
            has_checklist = False
            checklist_items = None
            session_obj = None  # Keep reference to session object for later save
            
            if session_id and current_user:
                session_obj = SessionService.get_session(db, session_id, current_user.id)
                if session_obj:
                    conversation_history = session_obj.conversation_history or []
                    has_checklist = session_obj.checklist_generated
                    # TODO: Load checklist items for better intent classification
            
            # Step 2: Classify intent (context-aware)
            intent_result = ContextClassifierService.classify_intent(
                message=message.content,
                conversation_history=conversation_history,
                has_checklist=has_checklist,
                checklist_items=checklist_items
            )
            
            # Send intent metadata to frontend
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "metadata",
                    "intent": intent_result["intent"],
                    "confidence": intent_result["confidence"],
                    "should_regenerate": intent_result.get("should_regenerate", False)
                }),
            }
            
            # Step 3: Generate streaming response with RAG
            full_response = ""
            async for chunk in ChatService.generate_stream_response(
                message=message.content,
                user_type=user_type,
                use_reranking=use_reranking,
                conversation_history=conversation_history
            ):
                full_response += chunk
                # Send chunk as SSE event
                yield {
                    "event": "message",
                    "data": json.dumps({"type": "chunk", "content": chunk}),
                }
            
            # Step 4: Save messages to session
            if session_obj and current_user:
                from datetime import datetime
                from app.services.identity_extraction_service import get_identity_extraction_service
                
                print(f"[chat.py] Saving messages - User: {len(message.content)} chars, Assistant: {len(full_response)} chars")
                print(f"[chat.py] Current history length: {len(conversation_history)}")
                
                # Use the conversation_history we already loaded, append new messages
                updated_history = conversation_history.copy()
                updated_history.append({
                    "role": "user",
                    "content": message.content,
                    "timestamp": datetime.utcnow().isoformat()
                })
                updated_history.append({
                    "role": "assistant",
                    "content": full_response,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Update session with new history
                session_obj.conversation_history = updated_history
                session_obj.updated_at = datetime.utcnow()
                
                # Auto-generate title from first user message
                if not session_obj.title or session_obj.title == "新对话":
                    session_obj.title = message.content[:50] + "..." if len(message.content) > 50 else message.content
                
                # Step 4.5: Extract identity information (only if checklist not yet generated)
                if not session_obj.checklist_generated:
                    print(f"\n[chat.py] ========== IDENTITY EXTRACTION START ==========")
                    print(f"[chat.py] Session ID: {session_obj.session_id}")
                    print(f"[chat.py] History length: {len(updated_history)} messages")
                    print(f"[chat.py] Last message: {updated_history[-1]['content'][:100] if updated_history else 'N/A'}...")
                    
                    extraction_service = get_identity_extraction_service()
                    identity_info, completion_pct = await extraction_service.extract_identity(updated_history)
                    
                    print(f"[chat.py] Extraction result: identity_info={identity_info is not None}, completion={completion_pct}%")
                    
                    if identity_info:
                        session_obj.extracted_identity = identity_info.model_dump()
                        print(f"[chat.py] ✅ Identity saved to DB")
                        print(f"[chat.py]    Employment: {identity_info.employment_status}")
                        print(f"[chat.py]    Income sources: {identity_info.income_sources}")
                        print(f"[chat.py]    Has dependents: {identity_info.has_dependents}")
                        print(f"[chat.py]    Has investment: {identity_info.has_investment}")
                        print(f"[chat.py]    Has rental: {identity_info.has_rental_property}")
                        print(f"[chat.py]    Completion: {completion_pct}%")
                    else:
                        print(f"[chat.py] ⚠️ Identity extraction returned None")
                    
                    print(f"[chat.py] ========== IDENTITY EXTRACTION END ==========\n")
                
                # Commit once for both messages and identity
                db.commit()
                db.refresh(session_obj)
                print(f"[chat.py] Both messages saved, new history length: {len(session_obj.conversation_history)}")
            
            # Send completion event
            yield {
                "event": "message",
                "data": json.dumps({"type": "done"}),
            }

        except Exception as e:
            # Send error event
            yield {
                "event": "message",
                "data": json.dumps({"type": "error", "message": str(e)}),
            }

    return EventSourceResponse(
        event_generator(),
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
