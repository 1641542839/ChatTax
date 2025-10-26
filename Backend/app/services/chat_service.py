"""
Chat service for handling AI chat operations with RAG (Retrieval-Augmented Generation).

Integrates:
- Vector store retrieval (FAISS + Cross-Encoder)
- LLM answer generation (OpenAI)
- Streaming response delivery
"""
import asyncio
import logging
from typing import AsyncGenerator
from urllib.parse import urlparse

from app.services.vector_store_service import get_vector_store_service
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)


def extract_title_from_url(url: str) -> str:
    """
    Extract a human-readable title from ATO URL.
    
    Examples:
        https://www.ato.gov.au/individuals-and-families/your-tax-return/your-notice-of-assessment
        -> "Your notice of assessment"
        
        https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim
        -> "Deductions you can claim"
    
    Args:
        url: The source URL
        
    Returns:
        Human-readable title
    """
    try:
        # Parse URL and get the path
        parsed = urlparse(url)
        path = parsed.path.strip('/')
        
        # Get the last segment of the path
        segments = path.split('/')
        last_segment = segments[-1] if segments else ''
        
        # Convert hyphens to spaces and capitalize each word
        title = last_segment.replace('-', ' ').title()
        
        # If title is too short or empty, try to get more segments
        if len(title) < 10 and len(segments) >= 2:
            # Use last 2 segments
            title = ' - '.join(segments[-2:]).replace('-', ' ').title()
        
        # If still empty, return a generic title
        if not title:
            title = "ATO Document"
        
        return title
    except Exception as e:
        logger.warning(f"Failed to extract title from URL {url}: {e}")
        return "ATO Document"


class ChatService:
    """
    Service for chat operations with RAG and streaming support.
    
    Follows Single Responsibility Principle:
    - Orchestrates RAG pipeline
    - Handles streaming response generation
    """

    @staticmethod
    async def generate_stream_response(
        message: str,
        user_type: str = "individual",
        use_reranking: bool = True,
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response using RAG pipeline.
        
        Pipeline:
        1. Retrieve relevant documents (FAISS + optional reranking)
        2. Generate answer using LLM with retrieved context
        3. Stream answer back to client
        
        Args:
            message: User's question
            user_type: Type of user (individual, business, professional)
            use_reranking: Whether to use cross-encoder reranking
            
        Yields:
            str: Chunks of the generated answer
        """
        try:
            # Step 1: Retrieve relevant documents
            logger.info(f"Processing query: {message[:100]}...")
            
            vector_service = get_vector_store_service()
            retrieved_docs = vector_service.retrieve_documents(
                query=message,
                user_type=user_type,
                top_k=5,
                use_reranking=use_reranking,
                initial_retrieval_size=20
            )
            
            if not retrieved_docs:
                # Fallback if no documents found
                fallback_message = (
                    "I apologize, but I couldn't find relevant information in my knowledge base "
                    "to answer your question accurately. Please try rephrasing your question or "
                    "consult with a tax professional for personalized guidance."
                )
                yield fallback_message
                return
            
            logger.info(f"Retrieved {len(retrieved_docs)} documents")
            
            # Step 2: Generate answer with LLM (streaming)
            llm_service = get_llm_service()
            
            # Stream answer generation directly from LLM
            full_answer = ""
            async for chunk in llm_service.stream_answer(
                question=message,
                retrieved_docs=retrieved_docs,
                user_type=user_type
            ):
                full_answer += chunk
                yield chunk
                # No artificial delay - let it stream naturally
            
            logger.info(f"Completed answer streaming, length: {len(full_answer)}")
            
            # Step 3: Prepare and stream sources information
            sources = llm_service._prepare_sources(retrieved_docs)
            confidence = llm_service._calculate_confidence(retrieved_docs)
            
            # Optionally append sources information
            if sources:
                yield "\n\n---\n\n"
                yield "**Sources:**\n\n"
                
                for idx, source in enumerate(sources[:3], 1):
                    # Generate title from URL
                    title = extract_title_from_url(source.source_url)
                    
                    source_text = (
                        f"{idx}. [{title}]({source.source_url})\n"
                        f"   - Relevance: {source.relevance_score:.2%}"
                    )
                    if source.rerank_score:
                        source_text += f" | Reranked: {source.rerank_score:.2%}"
                    source_text += "\n"
                    
                    yield source_text
                    await asyncio.sleep(0.05)
                
                yield f"\n*Confidence: {confidence:.0%}*\n"
            
        except Exception as e:
            logger.error(f"Error in generate_stream_response: {e}", exc_info=True)
            
            # Error fallback
            error_message = (
                "I apologize, but I encountered an error while processing your question. "
                "This might be due to:\n"
                "- OpenAI API connectivity issues\n"
                "- Vector store initialization problems\n"
                "- Model loading issues\n\n"
                "Please try again in a moment or contact support if the issue persists."
            )
            yield error_message
    
    @staticmethod
    async def generate_simple_stream_response(
        message: str,
    ) -> AsyncGenerator[str, None]:
        """
        Generate a simple streaming response without RAG.
        Fallback method for testing or when RAG is unavailable.
        
        Args:
            message: User's message
            
        Yields:
            str: Chunks of a generic response
        """
        responses = [
            "Thank you for your question. ",
            "I'll help you with that.\n\n",
            f'You asked: "{message[:100]}..."\n\n',
            "I'm processing your request using our tax knowledge base...\n\n",
            "Please note: This is a simplified response. ",
            "For detailed tax advice, please use the full RAG query endpoint ",
            "or consult with a tax professional.",
        ]
        
        for chunk in responses:
            yield chunk
            await asyncio.sleep(0.05)


# Singleton instance
_chat_service_instance = None


def get_chat_service() -> ChatService:
    """
    Get singleton instance of ChatService.
    
    Returns:
        ChatService: The singleton chat service instance
    """
    global _chat_service_instance
    if _chat_service_instance is None:
        _chat_service_instance = ChatService()
    return _chat_service_instance

