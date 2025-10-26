"""
Chat service for handling AI chat operations.
"""
import asyncio
from typing import AsyncGenerator


class ChatService:
    """Service for chat operations with streaming support."""

    @staticmethod
    async def generate_stream_response(
        message: str,
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response for chat message.
        This is a simulated response. In production, integrate with OpenAI or other LLM.
        """
        # Simulated streaming response
        responses = [
            "Thank you for your tax question. ",
            "I'll help you understand this topic. ",
            "\n\n",
            "Based on current tax regulations, ",
            "there are several important points to consider:\n\n",
            "1. **Deductions**: ",
            "You may be eligible for various tax deductions ",
            "depending on your situation.\n\n",
            "2. **Credits**: ",
            "Tax credits can directly reduce your tax liability.\n\n",
            "3. **Filing Status**: ",
            "Your filing status significantly impacts your calculations.\n\n",
            f'Regarding your question about "{message[:50]}...", ',
            "I recommend consulting with a tax professional ",
            "for personalized guidance.",
        ]

        for chunk in responses:
            yield chunk
            await asyncio.sleep(0.05)  # Simulate processing delay
