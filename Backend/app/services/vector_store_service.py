"""
Vector database service for document retrieval using FAISS with real crawled data.

Implements two-stage retrieval:
1. Fast similarity search with FAISS (retrieve top 20)
2. Precise reranking with cross-encoder (return top 5)
"""
import os
import faiss
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from sentence_transformers import SentenceTransformer
import logging

from app.core.config import settings
from app.services.reranker_service import get_reranker_service

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service for managing FAISS vector store with crawled tax document metadata."""

    def __init__(self, index_path: str = "app/db/faiss_index"):
        """
        Initialize vector store service with existing FAISS index and metadata.
        
        Args:
            index_path: Path to FAISS index directory containing index.faiss and metadata.parquet
        """
        self.index_path = Path(index_path)
        
        # Initialize sentence transformer for query embeddings
        # Use the same model that was used to create the index
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        self.faiss_index: Optional[faiss.Index] = None
        self.metadata: Optional[pd.DataFrame] = None
        self._load_index_and_metadata()

    def _load_index_and_metadata(self) -> None:
        """Load existing FAISS index and metadata from parquet file."""
        index_file = self.index_path / "index.faiss"
        # Updated: Use actual filename 'meta.parquet' instead of 'metadata.parquet'
        metadata_file = self.index_path / "meta.parquet"
        
        if not index_file.exists():
            raise FileNotFoundError(
                f"FAISS index not found at {index_file}. "
                "Please ensure the index.faiss file exists in the faiss_index directory."
            )
        
        if not metadata_file.exists():
            raise FileNotFoundError(
                f"Metadata file not found at {metadata_file}. "
                "Please ensure the meta.parquet file exists in the faiss_index directory."
            )
        
        try:
            # Load FAISS index
            self.faiss_index = faiss.read_index(str(index_file))
            print(f"✅ Loaded FAISS index with {self.faiss_index.ntotal} vectors from {index_file}")
            
            # Load metadata
            self.metadata = pd.read_parquet(metadata_file)
            print(f"✅ Loaded metadata with {len(self.metadata)} entries from {metadata_file}")
            
            # Validate index and metadata alignment
            if self.faiss_index.ntotal != len(self.metadata):
                print(f"⚠️ Warning: Index vectors ({self.faiss_index.ntotal}) != metadata rows ({len(self.metadata)})")
            
        except Exception as e:
            raise RuntimeError(f"Error loading FAISS index or metadata: {e}")

    def retrieve_documents(
        self,
        query: str,
        user_type: str = "individual",
        top_k: int = 5,
        use_reranking: bool = True,
        initial_retrieval_size: int = 20
    ) -> List[Dict]:
        """
        Two-stage document retrieval with optional reranking.
        
        Stage 1: Fast FAISS similarity search (retrieve top N candidates)
        Stage 2: Cross-encoder reranking (return top K most relevant)
        
        This approach balances speed and accuracy:
        - FAISS provides fast initial filtering
        - Cross-encoder provides precise relevance scoring
        
        Args:
            query: User's search query
            user_type: Type of user (individual, business, professional) - for future filtering
            top_k: Final number of documents to return (default: 5)
            use_reranking: Whether to use cross-encoder reranking (default: True)
            initial_retrieval_size: Number of candidates to retrieve before reranking (default: 20)
            
        Returns:
            List of top_k most relevant documents with metadata and scores
            
        Example:
            >>> service = VectorStoreService()
            >>> results = service.retrieve_documents(
            ...     query="How to file tax return?",
            ...     top_k=5,
            ...     use_reranking=True
            ... )
            >>> print(f"Found {len(results)} documents")
            >>> print(f"Top result score: {results[0]['rerank_score']:.3f}")
        """
        if self.faiss_index is None or self.metadata is None:
            raise ValueError("Vector store not properly initialized")
        
        # Ensure we retrieve enough candidates for reranking
        # If reranking disabled, retrieve exactly top_k
        retrieval_count = initial_retrieval_size if use_reranking else top_k
        
        # Don't retrieve more than we have
        retrieval_count = min(retrieval_count, self.faiss_index.ntotal)
        
        logger.debug(
            f"Retrieving {retrieval_count} candidates for query: '{query[:50]}...'"
        )
        
        # Generate query embedding using bi-encoder
        query_vector = self.embedder.encode([query], convert_to_numpy=True)
        query_vector = query_vector.astype('float32')
        
        # Normalize query vector for cosine similarity
        faiss.normalize_L2(query_vector)
        
        # Stage 1: Fast FAISS similarity search
        distances, indices = self.faiss_index.search(query_vector, retrieval_count)
        
        # Prepare initial results with metadata
        candidates = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx == -1:  # FAISS returns -1 for empty results
                continue
            
            # Get metadata for this document
            meta_row = self.metadata.iloc[idx]
            
            # Convert distance to similarity score
            # For cosine similarity: score = 1 - distance (already in [0,1] range after normalization)
            similarity_score = float(1 - distance) if distance <= 1 else float(1 / (1 + distance))
            
            candidate = {
                "chunk_id": str(meta_row["chunk_id"]),
                "score": similarity_score,  # Bi-encoder similarity score
                "doc_id": str(meta_row["doc_id"]),
                "source_url": str(meta_row["source_url"]),
                "section_heading": str(meta_row["section_heading"]),
                "text": str(meta_row["text"]),
                "tokens_est": int(meta_row["tokens_est"]),
                "is_table_summary": bool(meta_row["is_table_summary"]),
                "table_ref": str(meta_row["table_ref"]) if pd.notna(meta_row["table_ref"]) else None,
                "provenance": str(meta_row["provenance"]),
                "crawl_date": str(meta_row["crawl_date"]),
                "last_updated_on_page": str(meta_row["last_updated_on_page"]) if pd.notna(meta_row["last_updated_on_page"]) else None,
                "doc_type": str(meta_row["doc_type"]) if "doc_type" in meta_row else None
            }
            candidates.append(candidate)
        
        logger.debug(f"Retrieved {len(candidates)} candidates from FAISS")
        
        # Stage 2: Cross-encoder reranking (if enabled)
        if use_reranking and len(candidates) > 0:
            try:
                reranker = get_reranker_service()
                results = reranker.rerank_documents(
                    query=query,
                    documents=candidates,
                    top_k=top_k
                )
                logger.debug(f"Reranked to top {len(results)} documents")
                return results
            except Exception as e:
                logger.error(f"Reranking failed: {e}. Falling back to FAISS results.")
                # Fallback: return top_k from FAISS results
                return candidates[:top_k]
        else:
            # No reranking: return top_k from FAISS results
            return candidates[:top_k]

    def get_stats(self) -> dict:
        """Get statistics about the vector store."""
        if not self.faiss_index or self.metadata is None:
            return {"status": "not_initialized", "document_count": 0}
        
        return {
            "status": "initialized",
            "vector_count": self.faiss_index.ntotal,
            "metadata_count": len(self.metadata),
            "index_path": str(self.index_path),
            "embedding_dimension": self.faiss_index.d,
            "unique_docs": self.metadata['doc_id'].nunique() if 'doc_id' in self.metadata.columns else "unknown",
            "crawl_date_range": {
                "earliest": str(self.metadata['crawl_date'].min()) if 'crawl_date' in self.metadata.columns else "unknown",
                "latest": str(self.metadata['crawl_date'].max()) if 'crawl_date' in self.metadata.columns else "unknown"
            }
        }


# Singleton instance
_vector_store_service: Optional[VectorStoreService] = None


def get_vector_store_service() -> VectorStoreService:
    """Get singleton instance of VectorStoreService."""
    global _vector_store_service
    if _vector_store_service is None:
        _vector_store_service = VectorStoreService()
    return _vector_store_service
