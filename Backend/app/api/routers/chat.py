"""
Chat router for SSE streaming responses.
"""
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.db.database import get_db
from app.schemas.schemas import ChatMessage, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/stream")
async def chat_stream(message: ChatMessage, db: Session = Depends(get_db)):
    """
    Stream chat responses using Server-Sent Events (SSE).
    """

    async def event_generator():
        """Generate SSE events for streaming response."""
        try:
            async for chunk in ChatService.generate_stream_response(message.content):
                # Send chunk as SSE event
                yield {
                    "event": "message",
                    "data": json.dumps({"content": chunk}),
                }

            # Send completion event
            yield {
                "event": "done",
                "data": json.dumps({"status": "completed"}),
            }

        except Exception as e:
            # Send error event
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}),
            }

    return EventSourceResponse(event_generator())
