# RAG System Architecture

Detailed explanation of the Retrieval-Augmented Generation (RAG) system in ChatTax.

## What is RAG?

**RAG (Retrieval-Augmented Generation)** combines two AI approaches:

1. **Retrieval**: Find relevant documents from a knowledge base (FAISS vector store)
2. **Generation**: Use LLM (GPT-4o-mini) to generate answers based on retrieved documents

**Why RAG?**
- ✅ Reduces hallucinations (answers grounded in real documents)
- ✅ Provides citations and sources
- ✅ Can update knowledge without retraining LLM
- ✅ More cost-effective than fine-tuning
- ✅ Transparent (users see source documents)

## RAG Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        RAG Query Pipeline                         │
└──────────────────────────────────────────────────────────────────┘

User Question: "What are home office deductions in Australia?"
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Query Embedding                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Transformer: sentence-transformers/all-MiniLM-L6-v2         │ │
│ │ Input: "What are home office deductions in Australia?"      │ │
│ │ Output: [0.234, -0.567, 0.891, ..., 0.123] (384 dimensions) │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Vector Similarity Search (FAISS)                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Index: 3,246 document chunks (384-dim vectors)              │ │
│ │ Algorithm: Flat (exact search) with L2 distance             │ │
│ │ Query: Find top 20 most similar vectors                     │ │
│ │ Time: ~5-8ms (in-memory search)                             │ │
│ │                                                              │ │
│ │ Results (indices): [245, 1089, 2341, ..., 890]             │ │
│ │ Distances: [0.234, 0.456, 0.567, ..., 0.789]               │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Two-Stage Retrieval (Optional Reranking)                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Stage 1: FAISS Bi-Encoder (Fast Retrieval)                  │ │
│ │   - Encode query and documents separately                   │ │
│ │   - Cosine similarity on embeddings                         │ │
│ │   - Retrieve top 20 candidates                              │ │
│ │   - Time: ~8ms                                              │ │
│ │                                                              │ │
│ │ Stage 2: Cross-Encoder Reranking (Precise Scoring)         │ │
│ │   - Model: ms-marco-MiniLM-L-6-v2                          │ │
│ │   - Jointly encode query + document pairs                   │ │
│ │   - Score each of 20 candidates                             │ │
│ │   - Return top 5 most relevant                              │ │
│ │   - Time: ~200ms                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Metadata Retrieval                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Source: metadata.parquet (Pandas DataFrame)                 │ │
│ │ For each FAISS index [245, 1089, 2341, 890, 1567]:         │ │
│ │   meta_row = metadata.iloc[index]                           │ │
│ │   Extract:                                                   │ │
│ │     - source_url: https://www.ato.gov.au/...                │ │
│ │     - section_heading: "Home office expenses"               │ │
│ │     - text: "You can claim deductions for..."               │ │
│ │     - crawl_date: "2024-10-15"                              │ │
│ │     - provenance: "Australian Taxation Office"              │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Context Formatting                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Format retrieved documents into context:                    │ │
│ │                                                              │ │
│ │ [Source 1] Home office expenses                             │ │
│ │ URL: https://www.ato.gov.au/individuals/deductions/home-... │ │
│ │ Last Updated: 2024-09-01                                    │ │
│ │ Content: You can claim deductions for expenses related...  │ │
│ │                                                              │ │
│ │ [Source 2] Working from home deductions                     │ │
│ │ URL: https://www.ato.gov.au/...                             │ │
│ │ ...                                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Prompt Construction                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ System Prompt:                                              │ │
│ │ "You are an Australian tax assistant. Answer questions     │ │
│ │  based ONLY on the provided context. Cite sources."        │ │
│ │                                                              │ │
│ │ Context: [Formatted sources from Step 5]                    │ │
│ │                                                              │ │
│ │ User Question: "What are home office deductions..."         │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: LLM Generation (OpenAI GPT-4o-mini)                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Model: gpt-4o-mini                                          │ │
│ │ Temperature: 0.3 (more deterministic)                       │ │
│ │ Max Tokens: 1000                                            │ │
│ │                                                              │ │
│ │ Generated Answer:                                           │ │
│ │ "In Australia, you can claim home office deductions for    │ │
│ │  expenses directly related to your work [Source 1].        │ │
│ │  This includes electricity, internet, and depreciation     │ │
│ │  of office equipment [Source 2]. You can use either the    │ │
│ │  fixed rate method (67 cents per hour) or the actual       │ │
│ │  cost method [Source 1]..."                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 8: Response Assembly                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {                                                            │ │
│ │   "answer": "In Australia, you can claim...",              │ │
│ │   "sources": [                                              │ │
│ │     {                                                        │ │
│ │       "chunk_id": "ato_245",                                │ │
│ │       "source_url": "https://www.ato.gov.au/...",          │ │
│ │       "section_heading": "Home office expenses",           │ │
│ │       "text": "You can claim deductions...",               │ │
│ │       "relevance_score": 0.89,                             │ │
│ │       "crawl_date": "2024-10-15"                           │ │
│ │     },                                                       │ │
│ │     ...                                                      │ │
│ │   ],                                                         │ │
│ │   "confidence": 0.85,                                       │ │
│ │   "timestamp": "2024-11-08T10:30:00"                       │ │
│ │ }                                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
    ↓
Response sent to user
```

## Components Deep Dive

### 1. Embedding Model

**Model**: `sentence-transformers/all-MiniLM-L6-v2`

**Specifications**:
- Output dimensions: 384
- Max sequence length: 256 tokens
- Model size: ~80MB
- Inference time: ~10ms per text

**Why this model?**
- Fast inference (important for real-time queries)
- Good balance between speed and quality
- Widely used and well-tested
- Small enough to run on CPU

**Example**:
```python
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer('all-MiniLM-L6-v2')
query = "What are home office deductions?"
query_vector = embedder.encode([query])  # Shape: (1, 384)
```

### 2. FAISS Vector Store

**Index Type**: Flat (exact search)

**Properties**:
- **Exhaustive search**: Compares with every vector
- **Accuracy**: 100% (always finds true nearest neighbors)
- **Speed**: ~5ms for 3,246 vectors (CPU)
- **Memory**: ~5MB for 3,246 × 384 float32 vectors

**Index Creation** (already done):
```python
import faiss
import numpy as np

# Embed all 3,246 documents
embeddings = embedder.encode(all_documents)  # Shape: (3246, 384)

# L2 normalize for cosine similarity
faiss.normalize_L2(embeddings)

# Create flat index
index = faiss.IndexFlatL2(384)
index.add(embeddings)

# Save index
faiss.write_index(index, 'index.faiss')
```

**Search**:
```python
# Load index
index = faiss.read_index('index.faiss')

# Embed query
query_vector = embedder.encode([query])
faiss.normalize_L2(query_vector)

# Search top 5
distances, indices = index.search(query_vector, k=5)
# distances: [0.234, 0.456, 0.567, 0.678, 0.789]
# indices: [245, 1089, 2341, 890, 1567]
```

### 3. Two-Stage Retrieval

**Stage 1: Bi-Encoder (FAISS)**
- Encodes query and documents **separately**
- Fast but less accurate
- Used for initial candidate retrieval

**Stage 2: Cross-Encoder (Reranking)**
- Encodes query + document **together**
- Slower but more accurate
- Used for final ranking

**Comparison**:

| Method | Speed | Accuracy | Use Case |
|--------|-------|----------|----------|
| Bi-Encoder | ⚡ Fast (~5ms) | ✓ Good | Initial retrieval (1000s of docs) |
| Cross-Encoder | 🐢 Slow (~10ms/pair) | ✓✓ Excellent | Reranking (10-20 candidates) |

**Implementation**:
```python
# Stage 1: FAISS retrieval (fast)
candidates = faiss_search(query, n=20)  # Top 20 candidates

# Stage 2: Cross-encoder reranking (accurate)
reranked = cross_encoder.rank(query, candidates, top_k=5)
# Returns top 5 most relevant
```

**Models**:
- **Bi-Encoder**: all-MiniLM-L6-v2 (384-dim)
- **Cross-Encoder**: ms-marco-MiniLM-L-6-v2 (trained on MS MARCO)

### 4. Metadata Management

**File Format**: Parquet (compressed columnar format)

**Why Parquet?**
- ✅ Efficient storage (50% smaller than CSV)
- ✅ Fast column access
- ✅ Preserves data types
- ✅ Pandas native support

**Schema**:
```python
metadata.dtypes
# chunk_id              object
# doc_id                object
# source_url            object
# section_heading       object
# text                  object
# tokens_est            int64
# is_table_summary      bool
# provenance            object
# crawl_date            object
# last_updated_on_page  object
```

**Loading**:
```python
import pandas as pd

metadata = pd.read_parquet('metadata.parquet')
# Shape: (3246, 10)
```

**Position-Based Mapping**:
```python
# FAISS returns: indices = [245, 1089, 2341]
for idx in indices:
    meta_row = metadata.iloc[idx]  # O(1) access
    source_url = meta_row['source_url']
    text = meta_row['text']
```

### 5. LLM Integration (OpenAI)

**Model**: GPT-4o-mini

**Why GPT-4o-mini?**
- Cost-effective ($0.15 per 1M input tokens)
- Fast inference (~1-2s for typical answers)
- High quality for factual Q&A
- Good instruction following

**Prompt Template**:
```python
system_prompt = """
You are an expert Australian tax assistant.

IMPORTANT RULES:
1. Answer ONLY based on the provided context
2. Cite sources using [Source 1], [Source 2] format
3. If information is not in context, say "I don't have information about that"
4. Focus on AUSTRALIAN PERSONAL tax law for INDIVIDUAL taxpayers
5. Do NOT provide information about U.S. tax or business tax

Context:
{formatted_sources}

Question: {user_question}
"""
```

**Temperature**: 0.3 (more deterministic, less creative)

**Max Tokens**: 1000 (typical answers are 200-500 tokens)

### 6. Confidence Scoring

**Factors**:
1. **Relevance scores** from FAISS (cosine similarity)
2. **Number of sources** retrieved
3. **LLM certainty** (estimated from response)

**Calculation**:
```python
def calculate_confidence(sources, answer):
    # Average relevance of top 3 sources
    avg_relevance = np.mean([s['relevance_score'] for s in sources[:3]])
    
    # Penalty if answer contains uncertainty phrases
    uncertainty_phrases = ['might', 'possibly', 'unclear', 'not sure']
    uncertainty_penalty = sum(phrase in answer.lower() 
                             for phrase in uncertainty_phrases) * 0.1
    
    confidence = max(0.0, min(1.0, avg_relevance - uncertainty_penalty))
    return confidence
```

## Performance Optimization

### 1. Caching Strategies

**Query Caching**:
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_search(query: str, top_k: int):
    return vector_store.search(query, top_k)
```

**Embedding Caching**:
```python
embedding_cache = {}

def get_cached_embedding(text):
    if text not in embedding_cache:
        embedding_cache[text] = embedder.encode([text])
    return embedding_cache[text]
```

### 2. Batch Processing

**For multiple queries**:
```python
# Bad: Sequential encoding
embeddings = [embedder.encode([q]) for q in queries]

# Good: Batch encoding
embeddings = embedder.encode(queries)  # 5x faster
```

### 3. Index Optimization

**For larger datasets (>10K docs)**:
```python
# Use IVF index instead of Flat
nlist = 100  # Number of clusters
quantizer = faiss.IndexFlatL2(384)
index = faiss.IndexIVFFlat(quantizer, 384, nlist)

# Train index
index.train(embeddings)
index.add(embeddings)

# Search with probes
index.nprobe = 10  # Search 10 clusters
distances, indices = index.search(query_vector, k=5)
```

## Error Handling

### 1. No Relevant Documents Found

```python
if max_relevance_score < 0.5:
    return {
        "answer": "I don't have enough relevant information to answer that question accurately.",
        "sources": [],
        "confidence": 0.0
    }
```

### 2. OpenAI API Failures

```python
try:
    response = openai.chat.completions.create(...)
except openai.RateLimitError:
    # Retry with exponential backoff
    time.sleep(2 ** retry_count)
except openai.APIError as e:
    logger.error(f"OpenAI API error: {e}")
    # Return fallback response
```

### 3. FAISS Index Not Found

```python
if not os.path.exists('index.faiss'):
    raise FileNotFoundError(
        "FAISS index not found. Please run build_index.py first."
    )
```

## Quality Assurance

### 1. Relevance Threshold

Only return documents with relevance > 0.6:
```python
filtered_sources = [s for s in sources if s['relevance_score'] > 0.6]
```

### 2. Citation Validation

Ensure all citations in answer exist in sources:
```python
citations = re.findall(r'\[Source (\d+)\]', answer)
if max(citations) > len(sources):
    logger.warning("Invalid citation in answer")
```

### 3. Answer Length Control

```python
if len(answer.split()) < 10:
    logger.warning("Answer too short, may be incomplete")
if len(answer.split()) > 500:
    logger.warning("Answer too long, may be off-topic")
```

## Next Steps

- [FAISS Integration Details](./faiss-integration.md)
- [Reranking System](./reranking-system.md)
- [API Reference](../03-api/query-endpoint.md)
