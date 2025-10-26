# Two-Stage Retrieval with Reranking Guide

## 🎯 Overview

The ChatTax RAG system implements a **two-stage retrieval architecture** for optimal balance between speed and accuracy:

1. **Stage 1: Fast Retrieval** - FAISS bi-encoder (retrieve top 20)
2. **Stage 2: Precise Reranking** - Cross-encoder (return top 5)

## 🏗️ Architecture

```
User Query
    ↓
┌─────────────────────────────────────────────┐
│ Stage 1: FAISS Vector Search                │
│ - Bi-encoder: all-MiniLM-L6-v2              │
│ - Cosine similarity on 384-dim embeddings   │
│ - Fast: ~5ms for 3,246 vectors              │
│ - Retrieve: Top 20 candidates               │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Stage 2: Cross-Encoder Reranking            │
│ - Model: ms-marco-MiniLM-L-6-v2             │
│ - Joint query-document encoding             │
│ - Slower: ~200ms for 20 pairs               │
│ - Return: Top 5 most relevant               │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Stage 3: LLM Answer Generation              │
│ - Model: GPT-4o-mini                        │
│ - Context: Top 5 reranked documents         │
│ - Generate: Answer with citations           │
└─────────────────────────────────────────────┘
```

## 🔧 Implementation Details

### Services Architecture (SOLID Principles)

**1. `reranker_service.py` - Strategy Pattern**
```python
# Interface Segregation Principle
class RerankerStrategy(ABC):
    @abstractmethod
    def rerank(self, query, documents, top_k) -> List[Dict]:
        pass

# Concrete implementations
class CrossEncoderReranker(RerankerStrategy):
    """Uses sentence-transformers cross-encoder"""
    
class NoOpReranker(RerankerStrategy):
    """Fallback when reranking disabled"""

# Dependency Inversion Principle
class RerankerService:
    def __init__(self, strategy: RerankerStrategy):
        self.strategy = strategy  # Depends on abstraction
```

**2. `vector_store_service.py` - Single Responsibility**
```python
def retrieve_documents(
    query: str,
    top_k: int = 5,
    use_reranking: bool = True,
    initial_retrieval_size: int = 20
):
    # Stage 1: FAISS search
    candidates = faiss_search(query, n=initial_retrieval_size)
    
    # Stage 2: Optional reranking
    if use_reranking:
        reranker = get_reranker_service()
        results = reranker.rerank_documents(query, candidates, top_k)
    else:
        results = candidates[:top_k]
    
    return results
```

## 📊 Performance Comparison

| Method | Candidates | Time | Accuracy | Use Case |
|--------|-----------|------|----------|----------|
| **FAISS Only** | 5 | ~5ms | Good | Fast responses, simple queries |
| **FAISS + Rerank** | 20→5 | ~205ms | Excellent | Best accuracy, complex queries |
| **No Rerank (20)** | 20 | ~8ms | Fair | High recall, broad queries |

## 🚀 Usage

### API Endpoint

```bash
POST /api/chat/query?use_reranking=true&initial_candidates=20
```

**Request:**
```json
{
  "question": "How do I claim home office deduction?",
  "user_type": "individual",
  "top_k": 5
}
```

**Response:**
```json
{
  "answer": "To claim home office deduction...",
  "sources": [
    {
      "chunk_id": "abc123",
      "source_url": "https://www.ato.gov.au/...",
      "relevance_score": 0.72,      // FAISS bi-encoder score
      "rerank_score": 0.95,          // Cross-encoder score (higher!)
      "section_heading": "Home Office Expenses",
      ...
    }
  ],
  "confidence": 0.89
}
```

### Python Code

```python
from app.services.vector_store_service import get_vector_store_service

# WITH reranking (recommended)
results = get_vector_store_service().retrieve_documents(
    query="tax deduction rules",
    top_k=5,
    use_reranking=True,
    initial_retrieval_size=20
)

# WITHOUT reranking (faster)
results = get_vector_store_service().retrieve_documents(
    query="tax deduction rules",
    top_k=5,
    use_reranking=False
)
```

## 🎨 Configuration Options

### Query Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `use_reranking` | `true` | boolean | Enable cross-encoder reranking |
| `initial_candidates` | `20` | 5-50 | Candidates before reranking |
| `top_k` | `5` | 1-10 | Final results to return |

### Model Selection

Edit `reranker_service.py` to change cross-encoder model:

```python
# Fast but lower quality
CrossEncoderReranker("cross-encoder/ms-marco-TinyBERT-L-2-v2")

# Balanced (default)
CrossEncoderReranker("cross-encoder/ms-marco-MiniLM-L-6-v2")

# Best quality but slower
CrossEncoderReranker("cross-encoder/ms-marco-MiniLM-L-12-v2")
```

## 🧪 Testing

Run the test suite:

```bash
# Start server
uvicorn main:app --reload

# In another terminal
python test_rag.py
```

The test script compares results WITH and WITHOUT reranking.

## 📈 Why Two-Stage Retrieval?

### Problem with Single-Stage

**FAISS Bi-Encoder Limitations:**
- Encodes query and documents **independently**
- Fast but less precise
- May miss semantic nuances

**Example:**
```
Query: "home office deduction eligibility"
FAISS might rank:
1. "Home office setup tips" (score: 0.78)
2. "Office furniture deductions" (score: 0.76)
3. "Eligibility criteria for home office" (score: 0.74) ⬅️ Should be #1!
```

### Solution: Cross-Encoder Reranking

**Cross-Encoder Benefits:**
- Jointly encodes query + document
- Captures interaction between terms
- Much more accurate relevance scoring

**After Reranking:**
```
1. "Eligibility criteria for home office" (rerank: 0.95) ✅
2. "Office furniture deductions" (rerank: 0.82)
3. "Home office setup tips" (rerank: 0.71)
```

## 🔍 Score Interpretation

### FAISS Score (Cosine Similarity)
- Range: 0.0 - 1.0
- Good: > 0.70
- Excellent: > 0.85

### Rerank Score (Cross-Encoder)
- Range: -infinity to +infinity (normalized to ~0-1)
- Good: > 0.80
- Excellent: > 0.90

**Rule of thumb:** Rerank scores are more reliable for final ranking.

## ⚡ Performance Optimization

### When to Use Reranking

**✅ USE RERANKING:**
- Complex, multi-part questions
- Questions requiring precise semantic matching
- When accuracy is more important than speed
- Production question-answering systems

**❌ SKIP RERANKING:**
- Simple keyword searches
- When speed is critical (<10ms required)
- Broad exploratory queries
- A/B testing baseline performance

### Tuning Parameters

**For Better Accuracy:**
```python
initial_retrieval_size=30  # Retrieve more candidates
top_k=3                    # Return fewer final results
```

**For Better Speed:**
```python
initial_retrieval_size=10  # Retrieve fewer candidates
use_reranking=False        # Skip reranking entirely
```

## 🛠️ Troubleshooting

### Common Issues

**1. First query slow (~2-5 seconds)**
- **Cause**: Cross-encoder model downloading
- **Solution**: Normal on first run, subsequent queries fast

**2. Out of memory errors**
- **Cause**: Too many candidates for reranking
- **Solution**: Reduce `initial_candidates` to 10-15

**3. Poor reranking results**
- **Cause**: Wrong model for domain
- **Solution**: Try different cross-encoder models (see Configuration)

### Debugging

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check logs for:
```
✅ Loaded cross-encoder model: ms-marco-MiniLM-L-6-v2
Retrieved 20 candidates from FAISS
Reranked to top 5 documents
```

## 📚 References

- **Bi-Encoders**: [Sentence-BERT](https://arxiv.org/abs/1908.10084)
- **Cross-Encoders**: [Efficient Natural Language Response Suggestion](https://arxiv.org/abs/1705.00652)
- **MS MARCO Models**: [Hugging Face](https://huggingface.co/cross-encoder)

## 💡 Best Practices

1. **Always use reranking in production** unless latency critical
2. **Tune `initial_candidates`** based on dataset size
3. **Monitor rerank scores** to identify low-confidence answers
4. **Cache reranking results** for identical queries
5. **A/B test** reranking impact on user satisfaction

---

**Created**: 2025-10-26  
**Status**: ✅ Implemented and tested
