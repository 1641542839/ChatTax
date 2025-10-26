"""
Reranker service for improving retrieval relevance using cross-encoder models.

This service implements the Open/Closed Principle by allowing different
reranker strategies without modifying existing code.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Tuple
from sentence_transformers import CrossEncoder
import logging

logger = logging.getLogger(__name__)


class RerankerStrategy(ABC):
    """
    Abstract base class for reranking strategies.
    Follows Interface Segregation Principle - single focused interface.
    """
    
    @abstractmethod
    def rerank(
        self, 
        query: str, 
        documents: List[Dict], 
        top_k: int = 5
    ) -> List[Dict]:
        """
        Rerank documents based on query relevance.
        
        Args:
            query: User's search query
            documents: List of document dictionaries with 'text' field
            top_k: Number of top results to return after reranking
            
        Returns:
            List of reranked documents with updated scores
        """
        pass


class CrossEncoderReranker(RerankerStrategy):
    """
    Cross-encoder based reranker using sentence-transformers.
    
    This class follows Single Responsibility Principle - only handles reranking.
    Model choice is configurable (Open/Closed Principle).
    """
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        Initialize cross-encoder reranker.
        
        Args:
            model_name: HuggingFace model identifier for cross-encoder
                       Default: ms-marco-MiniLM-L-6-v2 (fast, good performance)
                       Alternatives:
                       - cross-encoder/ms-marco-MiniLM-L-12-v2 (better, slower)
                       - cross-encoder/ms-marco-TinyBERT-L-2-v2 (fastest, lower quality)
        """
        try:
            self.model = CrossEncoder(model_name, max_length=512)
            self.model_name = model_name
            logger.info(f"✅ Loaded cross-encoder model: {model_name}")
        except Exception as e:
            logger.error(f"❌ Failed to load cross-encoder model: {e}")
            raise
    
    def rerank(
        self, 
        query: str, 
        documents: List[Dict], 
        top_k: int = 5
    ) -> List[Dict]:
        """
        Rerank documents using cross-encoder model.
        
        The cross-encoder jointly encodes query and document,
        providing more accurate relevance scores than bi-encoder similarity.
        
        Args:
            query: User's search query
            documents: List of document dictionaries with 'text' field
            top_k: Number of top results to return
            
        Returns:
            List of top_k reranked documents with 'rerank_score' field
        """
        if not documents:
            return []
        
        if len(documents) <= top_k:
            # If we have fewer documents than requested, just score them all
            logger.debug(f"Document count ({len(documents)}) <= top_k ({top_k}), scoring all")
        
        try:
            # Prepare query-document pairs for cross-encoder
            pairs = [[query, doc.get("text", "")] for doc in documents]
            
            # Get cross-encoder scores
            scores = self.model.predict(pairs)
            
            # Add rerank scores to documents
            for doc, score in zip(documents, scores):
                doc["rerank_score"] = float(score)
            
            # Sort by rerank score (descending) and return top_k
            reranked = sorted(documents, key=lambda x: x["rerank_score"], reverse=True)
            top_results = reranked[:top_k]
            
            logger.debug(
                f"Reranked {len(documents)} documents, returning top {len(top_results)}"
            )
            
            return top_results
            
        except Exception as e:
            logger.error(f"Reranking failed: {e}. Returning original documents.")
            # Fallback: return original documents if reranking fails
            return documents[:top_k]


class NoOpReranker(RerankerStrategy):
    """
    No-operation reranker that returns documents as-is.
    
    Useful for:
    - Testing without reranking overhead
    - Fallback when reranker fails to load
    - A/B testing reranking impact
    """
    
    def rerank(
        self, 
        query: str, 
        documents: List[Dict], 
        top_k: int = 5
    ) -> List[Dict]:
        """Return top_k documents without reranking."""
        logger.debug(f"NoOpReranker: returning top {top_k} documents")
        return documents[:top_k]


class RerankerService:
    """
    Service for managing document reranking.
    
    Follows Dependency Inversion Principle:
    - Depends on RerankerStrategy abstraction, not concrete implementations
    - Allows strategy swapping at runtime
    """
    
    def __init__(self, strategy: RerankerStrategy = None):
        """
        Initialize reranker service with a strategy.
        
        Args:
            strategy: Reranking strategy to use. 
                     If None, defaults to CrossEncoderReranker
        """
        if strategy is None:
            try:
                self.strategy = CrossEncoderReranker()
            except Exception as e:
                logger.warning(f"Failed to load CrossEncoder, using NoOpReranker: {e}")
                self.strategy = NoOpReranker()
        else:
            self.strategy = strategy
    
    def rerank_documents(
        self,
        query: str,
        documents: List[Dict],
        top_k: int = 5
    ) -> List[Dict]:
        """
        Rerank documents using the configured strategy.
        
        Args:
            query: User's search query
            documents: Retrieved documents to rerank
            top_k: Number of top results to return
            
        Returns:
            List of reranked documents
        """
        return self.strategy.rerank(query, documents, top_k)
    
    def set_strategy(self, strategy: RerankerStrategy) -> None:
        """
        Change reranking strategy at runtime.
        
        Enables:
        - A/B testing different models
        - Fallback to simpler strategies
        - Dynamic model selection based on query type
        
        Args:
            strategy: New reranking strategy
        """
        self.strategy = strategy
        logger.info(f"Switched to reranker strategy: {type(strategy).__name__}")


# Singleton instance
_reranker_service = None


def get_reranker_service() -> RerankerService:
    """
    Get singleton instance of RerankerService.
    
    Lazy initialization - model loads only when first accessed.
    """
    global _reranker_service
    if _reranker_service is None:
        _reranker_service = RerankerService()
    return _reranker_service
