# Using Pre-Crawled Tax Document Data

## Overview

The ChatTax backend uses **pre-crawled tax documents** from official sources (IRS, tax authorities). The data is stored in two files:

1. **`index.faiss`**: FAISS vector index with document embeddings
2. **`metadata.parquet`**: Pandas DataFrame with document metadata

Both files are located in: `app/db/faiss_index/`

---

## Data Structure

### Metadata Schema (from `metadata.parquet`)

Each row in the metadata represents a text chunk from a crawled tax document:

| Field | Type | Description |
|-------|------|-------------|
| `chunk_id` | string | Unique identifier for this text chunk |
| `doc_id` | string | Parent document identifier |
| `source_url` | string | Original URL of the tax document |
| `section_heading` | string | Section/heading title |
| `text` | string | Actual text content of the chunk |
| `tokens_est` | int | Estimated token count |
| `is_table_summary` | bool | Whether this is a table summary |
| `table_ref` | string | Table reference (if applicable) |
| `provenance` | string | Data source/origin information |
| `crawl_date` | string | Date when data was crawled |
| `last_updated_on_page` | string | Last update date from source page |

---

## How It Works

### 1. Vector Store Service

The `VectorStoreService` loads the existing FAISS index and metadata:

```python
# app/services/vector_store_service.py

# Load FAISS index
self.faiss_index = faiss.read_index("app/db/faiss_index/index.faiss")

# Load metadata
self.metadata = pd.read_parquet("app/db/faiss_index/metadata.parquet")
```

### 2. Query Process

When a user asks a question:

1. **Generate Query Embedding**:
   ```python
   query_vector = self.embedder.encode([query])
   ```

2. **Search FAISS Index**:
   ```python
   distances, indices = self.faiss_index.search(query_vector, top_k)
   ```

3. **Retrieve Metadata**:
   ```python
   for idx in indices[0]:
       meta_row = self.metadata.iloc[idx]
       # Get chunk_id, text, source_url, etc.
   ```

4. **Return Results**:
   Documents with metadata + relevance scores

### 3. LLM Integration

Retrieved documents are sent to OpenAI GPT-4o-mini:

```python
# Format context with metadata
context = f"""
[Source 1] {doc['section_heading']}
URL: {doc['source_url']}
Last Updated: {doc['last_updated_on_page']}
Content: {doc['text']}
"""

# Generate answer with citations
answer = llm.invoke(prompt_with_context)
```

---

## Verifying Your Data

### Check Index Status

```python
from app.services.vector_store_service import get_vector_store_service

service = get_vector_store_service()
stats = service.get_stats()

print(stats)
# Output:
# {
#   'status': 'initialized',
#   'vector_count': 5000,
#   'metadata_count': 5000,
#   'unique_docs': 150,
#   'crawl_date_range': {'earliest': '2024-01-01', 'latest': '2024-10-20'}
# }
```

### Inspect Metadata

```python
import pandas as pd

metadata = pd.read_parquet("app/db/faiss_index/metadata.parquet")

# View first few rows
print(metadata.head())

# Check columns
print(metadata.columns.tolist())

# Count unique documents
print(f"Unique documents: {metadata['doc_id'].nunique()}")

# Check date range
print(f"Crawl dates: {metadata['crawl_date'].min()} to {metadata['crawl_date'].max()}")
```

---

## Updating the Data

### Option 1: Re-crawl and Replace

1. Run your web scraping script
2. Generate new `index.faiss` and `metadata.parquet`
3. Replace files in `app/db/faiss_index/`
4. Restart the server

### Option 2: Incremental Updates

```python
import faiss
import pandas as pd
from sentence_transformers import SentenceTransformer

# Load existing data
index = faiss.read_index("app/db/faiss_index/index.faiss")
metadata = pd.read_parquet("app/db/faiss_index/metadata.parquet")

# Add new documents
new_texts = ["New tax document text..."]
embedder = SentenceTransformer('all-MiniLM-L6-v2')
new_vectors = embedder.encode(new_texts)

# Update index
index.add(new_vectors)

# Update metadata
new_metadata = pd.DataFrame([{
    'chunk_id': 'new_001',
    'doc_id': 'new_doc',
    'source_url': 'https://...',
    'text': new_texts[0],
    # ... other fields
}])
metadata = pd.concat([metadata, new_metadata], ignore_index=True)

# Save
faiss.write_index(index, "app/db/faiss_index/index.faiss")
metadata.to_parquet("app/db/faiss_index/metadata.parquet")
```

---

## Embedding Model

The system uses **Sentence-Transformers** for embeddings:

```python
# Model: all-MiniLM-L6-v2
# Dimensions: 384
# Performance: Fast, good quality for semantic search
```

**Important**: If you re-generate the index, use the **same embedding model** to ensure compatibility!

---

## Troubleshooting

### Error: "FAISS index not found"

**Cause**: Missing `index.faiss` file

**Solution**:
1. Verify file exists: `app/db/faiss_index/index.faiss`
2. Check file permissions
3. Re-run your crawling script to generate the index

### Error: "Metadata file not found"

**Cause**: Missing `metadata.parquet` file

**Solution**:
1. Verify file exists: `app/db/faiss_index/metadata.parquet`
2. Ensure it was generated with the same chunks as the FAISS index

### Error: "Index vectors != metadata rows"

**Cause**: Mismatch between index size and metadata rows

**Solution**:
1. Regenerate both files together
2. Ensure one metadata row per vector in the index

### Low Relevance Scores

**Possible Causes**:
- Question is too vague or general
- Tax documents don't cover the topic
- Different terminology between question and documents

**Solutions**:
- Add more diverse tax documents
- Improve query preprocessing
- Use query expansion techniques

---

## Performance Optimization

### 1. Index Type

Current: Flat index (exact search)

For large datasets (>100K vectors), consider:
```python
# Use IVF (Inverted File Index) for faster search
quantizer = faiss.IndexFlatL2(384)
index = faiss.IndexIVFFlat(quantizer, 384, 100)  # 100 clusters
```

### 2. GPU Acceleration

```python
# Use GPU for faster search (if available)
import faiss
res = faiss.StandardGpuResources()
gpu_index = faiss.index_cpu_to_gpu(res, 0, cpu_index)
```

### 3. Caching

Cache frequently asked questions:
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_query(question: str):
    return retrieve_documents(question)
```

---

## Data Quality Guidelines

### For Web Crawling

1. **Extract Clean Text**:
   - Remove HTML tags
   - Preserve formatting (lists, tables)
   - Keep section headings

2. **Chunking Strategy**:
   - 500-1000 tokens per chunk
   - Preserve semantic boundaries
   - Include context (section heading)

3. **Metadata Completeness**:
   - Always include `source_url`
   - Record `crawl_date` for freshness tracking
   - Capture `last_updated_on_page` when available

4. **Quality Checks**:
   - Validate URLs are accessible
   - Ensure text is meaningful (not error pages)
   - Remove duplicate chunks

### Example Crawling Script Structure

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd

def crawl_tax_document(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Extract sections
    sections = soup.find_all('section')
    
    chunks = []
    for section in sections:
        heading = section.find('h2').text
        text = section.get_text(strip=True)
        
        chunks.append({
            'doc_id': extract_doc_id(url),
            'source_url': url,
            'section_heading': heading,
            'text': text,
            'crawl_date': datetime.now().isoformat(),
            # ... other fields
        })
    
    return chunks

# Generate embeddings and save
chunks = crawl_tax_document("https://www.irs.gov/...")
metadata = pd.DataFrame(chunks)
metadata.to_parquet("metadata.parquet")

# Create FAISS index
embedder = SentenceTransformer('all-MiniLM-L6-v2')
vectors = embedder.encode(metadata['text'].tolist())
index = faiss.IndexFlatL2(384)
index.add(vectors)
faiss.write_index(index, "index.faiss")
```

---

## Best Practices

1. **Regular Updates**: Re-crawl tax documents quarterly to keep data current
2. **Version Control**: Track `crawl_date` to identify outdated content
3. **Quality Metrics**: Monitor relevance scores and user feedback
4. **Backup**: Keep backups of both `index.faiss` and `metadata.parquet`
5. **Documentation**: Maintain a record of crawled sources and dates

---

## Next Steps

1. ✅ Verify your existing `index.faiss` and `metadata.parquet` files
2. ✅ Start the server: `uvicorn main:app --reload`
3. ✅ Test queries: `python test_rag.py`
4. ✅ Monitor performance and relevance scores
5. ✅ Plan regular data updates

For questions about the crawled data format or FAISS index, contact your data engineering team or refer to the crawling script documentation.
