"""
Query router for RAG-based tax question answering with two-stage retrieval.
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.schemas import QueryRequest, QueryResponse
from app.services.vector_store_service import get_vector_store_service
from app.services.llm_service import get_llm_service

router = APIRouter(prefix="/chat", tags=["Query"])


@router.post("/query", response_model=QueryResponse)
async def query_tax_question(
    request: QueryRequest,
    db: Session = Depends(get_db),
    use_reranking: bool = Query(
        default=True,
        description="Enable cross-encoder reranking for better relevance"
    ),
    initial_candidates: int = Query(
        default=20,
        ge=5,
        le=50,
        description="Number of candidates to retrieve before reranking (5-50)"
    )
):
    """
    Answer tax questions using two-stage RAG (Retrieval-Augmented Generation).
    
    **Two-Stage Retrieval Process:**
    
    1. **Fast Similarity Search** (FAISS bi-encoder)
       - Retrieve top N candidates (default: 20)
       - Uses cosine similarity on 384-dim embeddings
       - Fast but less precise
    
    2. **Precise Reranking** (Cross-encoder)
       - Rerank candidates with joint query-document encoding
       - Return top K results (request.top_k, default: 3)
       - Slower but more accurate
    
    3. **Answer Generation** (LLM)
       - Generate answer using top K documents as context
       - Include citations and confidence score
    
    **Query Parameters:**
    - `use_reranking`: Enable/disable reranking (default: True)
    - `initial_candidates`: Candidates for reranking (default: 20, range: 5-50)
    
    **Request Body:**
    ```json
    {
        "question": "How do I claim home office deduction?",
        "user_type": "individual",
        "top_k": 3
    }
    ```
    
    **Performance Tips:**
    - Disable reranking for faster responses: `use_reranking=false`
    - Reduce candidates for speed: `initial_candidates=10`
    - Increase candidates for better recall: `initial_candidates=30`
    """
    try:
        # Get services
        vector_store = get_vector_store_service()
        llm_service = get_llm_service()
        
        # Step 1: Two-stage retrieval (FAISS + Reranking)
        retrieved_docs = vector_store.retrieve_documents(
            query=request.question,
            user_type=request.user_type,
            top_k=request.top_k,
            use_reranking=use_reranking,
            initial_retrieval_size=initial_candidates
        )
        
        if not retrieved_docs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No relevant documents found for your question. Please try rephrasing or contact support."
            )
        
        # Step 2: Generate answer using LLM
        answer, sources, confidence = llm_service.generate_answer(
            question=request.question,
            retrieved_docs=retrieved_docs,
            user_type=request.user_type
        )
        
        # Step 3: Return response
        return QueryResponse(
            answer=answer,
            sources=sources,
            confidence=confidence,
            user_type=request.user_type
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector store error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing query: {str(e)}"
        )


@router.get("/stats")
async def get_vector_store_stats():
    """
    Get statistics about the vector store.
    
    Returns:
        Dictionary with vector store statistics
    """
    try:
        vector_store = get_vector_store_service()
        stats = vector_store.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving stats: {str(e)}"
        )
