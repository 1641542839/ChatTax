"""
Chat router for SSE streaming responses with RAG integration.
"""
import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.db.database import get_db
from app.schemas.schemas import ChatMessage, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/stream")
async def chat_stream(
    message: ChatMessage,
    db: Session = Depends(get_db),
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
    
    **RAG Pipeline:**
    1. Retrieve relevant documents from vector store (FAISS + optional reranking)
    2. Generate answer using LLM (GPT-4o-mini) with retrieved context
    3. Stream answer back to client in real-time
    
    **Frontend-compatible SSE format:**
    - Chunks: `data: {"type": "chunk", "content": "..."}`
    - Complete: `data: {"type": "done"}`
    - Error: `data: {"type": "error", "message": "..."}`
    
    **Query Parameters:**
    - `user_type`: individual (default), business, or professional
    - `use_reranking`: true (default) for better accuracy, false for faster response
    
    **Example:**
    ```
    POST /api/chat/stream?user_type=individual&use_reranking=true
    Body: {"message": "What deductions can I claim as a developer?"}
    ```
    """

    async def event_generator():
        """Generate SSE events for streaming response."""
        try:
            async for chunk in ChatService.generate_stream_response(
                message=message.content,
                user_type=user_type,
                use_reranking=use_reranking
            ):
                # Send chunk as SSE event (format matching frontend expectations)
                yield {
                    "event": "message",
                    "data": json.dumps({"type": "chunk", "content": chunk}),
                }

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
