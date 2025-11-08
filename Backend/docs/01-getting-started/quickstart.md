# Quick Start Guide

Get up and running with ChatTax Backend in 5 minutes.

## What is ChatTax?

ChatTax is an AI-powered tax assistant for **Australian individual taxpayers** that uses:
- **RAG (Retrieval-Augmented Generation)**: Answers based on official tax documents
- **FAISS Vector Database**: Fast similarity search through 3,246 tax documents
- **OpenAI GPT-4o-mini**: Intelligent answer generation with citations
- **Dynamic Checklist**: Personalized tax preparation tasks (5-15 items based on complexity)

## Prerequisites

✅ Python 3.8+ installed  
✅ Backend server running (see [Installation Guide](./installation.md))  
✅ OpenAI API key configured in `.env`

## Test the System

### Option 1: Interactive API Docs (Recommended)

1. **Open Swagger UI**: http://localhost:8000/docs

2. **Test Health Check**:
   - Expand `GET /health`
   - Click "Try it out" → "Execute"
   - Expected: `{"status": "healthy"}`

3. **Check Vector Store Stats**:
   - Expand `GET /api/chat/stats`
   - Click "Try it out" → "Execute"
   - Expected: `{"status": "initialized", "document_count": 3246}`

4. **Test RAG Query**:
   - Expand `POST /api/chat/query`
   - Click "Try it out"
   - Enter request body:
     ```json
     {
       "question": "What tax deductions are available for home office expenses in Australia?",
       "user_type": "individual",
       "top_k": 3
     }
     ```
   - Click "Execute"
   - Expected: AI-generated answer with Australian tax sources

### Option 2: Command Line (cURL)

```powershell
# Test health check
curl http://localhost:8000/health

# Test RAG query
curl -X POST "http://localhost:8000/api/chat/query" `
  -H "Content-Type: application/json" `
  -d '{
    "question": "What is the tax-free threshold in Australia?",
    "user_type": "individual",
    "top_k": 3
  }'
```

### Option 3: Python Test Script

Create `test_api.py`:

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# Test health check
response = requests.get(f"{BASE_URL}/health")
print("Health Check:", response.json())

# Test RAG query
query = {
    "question": "What are the tax offsets available for Australian individuals?",
    "user_type": "individual",
    "top_k": 3
}
response = requests.post(f"{BASE_URL}/api/chat/query", json=query)
result = response.json()

print("\n" + "="*50)
print("ANSWER:", result["answer"])
print("\nSOURCES:")
for i, source in enumerate(result["sources"], 1):
    print(f"\n[Source {i}]")
    print(f"  URL: {source.get('source_url', 'N/A')}")
    print(f"  Section: {source.get('section_heading', 'N/A')}")
    print(f"  Relevance: {source.get('relevance_score', 0):.2f}")
```

Run it:
```powershell
python test_api.py
```

## Understanding the Response

### RAG Query Response Structure

```json
{
  "answer": "In Australia, individual taxpayers can claim...",
  "sources": [
    {
      "chunk_id": "ato_doc_1234_chunk_5",
      "doc_id": "ato_doc_1234",
      "source_url": "https://www.ato.gov.au/...",
      "section_heading": "Work-related expenses",
      "text": "You can claim deductions for...",
      "crawl_date": "2024-10-15",
      "last_updated_on_page": "2024-09-01",
      "is_table_summary": false,
      "provenance": "Australian Taxation Office",
      "relevance_score": 0.89
    }
  ],
  "confidence": 0.85,
  "timestamp": "2024-11-08T10:30:00"
}
```

### Key Fields

- **answer**: AI-generated response with citations like [Source 1], [Source 2]
- **sources**: Array of relevant tax documents
  - `source_url`: Original ATO/tax authority URL
  - `section_heading`: Document section name
  - `relevance_score`: 0-1 similarity score (higher = more relevant)
  - `crawl_date`: When document was indexed
- **confidence**: Overall answer confidence (0-1)

## Test Authentication (Optional)

### Register User

```powershell
curl -X POST "http://localhost:8000/api/auth/register" `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### Login

```powershell
curl -X POST "http://localhost:8000/api/auth/login" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "username=testuser&password=password123"
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Use Token

```powershell
$token = "your-access-token"
curl -X GET "http://localhost:8000/api/auth/me" `
  -H "Authorization: Bearer $token"
```

## Test Checklist Generation

Generate personalized tax checklist:

```powershell
curl -X POST "http://localhost:8000/api/checklist/generate" `
  -H "Content-Type: application/json" `
  -d '{
    "user_id": 1,
    "identity_info": {
      "employment_status": "employed",
      "income_sources": ["salary", "investment"],
      "has_dependents": true,
      "has_investment": true,
      "location": "NSW"
    }
  }'
```

Expected: 5-15 personalized tasks based on complexity.

## Common Test Queries

Try these questions to test different scenarios:

### Individual Taxpayer Questions
- "What is the tax-free threshold in Australia?"
- "Can I claim working from home expenses?"
- "What are the tax offsets for low income earners?"
- "How do I claim medical expenses?"

### Complex Scenarios
- "I'm employed and have rental property income. What documents do I need?"
- "What are the depreciation rules for rental properties in Australia?"
- "Can I claim education expenses for work-related courses?"

## Next Steps

1. [Configuration Guide](./configuration.md) - Customize settings
2. [Architecture Overview](../02-architecture/overview.md) - Understand the system
3. [API Reference](../03-api/endpoints.md) - Explore all endpoints
4. [Frontend Integration](./frontend-integration.md) - Connect Next.js frontend

## Troubleshooting

### Empty or Generic Answers

**Problem**: Answer doesn't reference Australian tax law  
**Solution**: Check FAISS index loaded correctly:
```powershell
curl http://localhost:8000/api/chat/stats
```

### OpenAI API Errors

**Problem**: "Invalid API key" or "Rate limit exceeded"  
**Solution**: 
1. Verify API key in `.env`
2. Check OpenAI account credits
3. Check API usage limits

### Slow Response Times

**Problem**: Queries take > 5 seconds  
**Solution**: 
- Reduce `top_k` parameter (try 3 instead of 5)
- Check internet connection to OpenAI
- Consider using reranking for better quality: `use_reranking=true`

### No Sources Returned

**Problem**: `sources` array is empty  
**Solution**: Check metadata file exists:
```powershell
Test-Path app/db/faiss_index/metadata.parquet
```
