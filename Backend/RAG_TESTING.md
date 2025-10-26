# RAG Query Testing Guide

## Testing the `/api/chat/query` Endpoint

### Prerequisites

1. **Set OpenAI API Key**:
   ```bash
   # Edit Backend/.env file
   OPENAI_API_KEY=your-actual-openai-api-key-here
   ```

2. **Start the Backend Server**:
   ```powershell
   cd Backend
   uvicorn main:app --reload
   ```

3. **Access API Docs**: http://localhost:8000/docs

---

## Test Cases

### Test 1: Individual Taxpayer - Home Office Deduction

**Request**:
```bash
curl -X POST "http://localhost:8000/api/chat/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the tax deductions for home office expenses in 2024?",
    "user_type": "individual",
    "top_k": 3
  }'
```

**Expected Response**:
```json
{
  "answer": "For home office expenses in 2024, you can deduct... [Source 1]...",
  "sources": [
    {
      "title": "IRS Publication 587 - Home Office Deduction",
      "content": "Home office deduction allows taxpayers...",
      "publish_date": "2024-01-15",
      "page_number": 3,
      "relevance_score": 0.92
    }
  ],
  "confidence": 0.89,
  "timestamp": "2024-10-26T10:30:00",
  "user_type": "individual"
}
```

---

### Test 2: Business Owner - QBI Deduction

**Request**:
```bash
curl -X POST "http://localhost:8000/api/chat/query" \
  -H "Content-Type": application/json" \
  -d '{
    "question": "How does the Qualified Business Income deduction work for my LLC?",
    "user_type": "business",
    "top_k": 3
  }'
```

---

### Test 3: Check Vector Store Stats

**Request**:
```bash
curl -X GET "http://localhost:8000/api/chat/stats"
```

**Expected Response**:
```json
{
  "status": "initialized",
  "document_count": 6,
  "index_path": "app/db/faiss_index"
}
```

---

## Using Swagger UI (Interactive Docs)

1. Open: http://localhost:8000/docs
2. Find `/api/chat/query` endpoint
3. Click "Try it out"
4. Fill in the request body:
   ```json
   {
     "question": "What is the standard deduction for 2024?",
     "user_type": "individual",
     "top_k": 2
   }
   ```
5. Click "Execute"

---

## Python Test Script

```python
import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_query(question: str, user_type: str = "individual"):
    """Test the RAG query endpoint."""
    response = requests.post(
        f"{API_BASE_URL}/api/chat/query",
        json={
            "question": question,
            "user_type": user_type,
            "top_k": 3
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Question: {question}")
        print(f"📝 Answer: {data['answer'][:200]}...")
        print(f"🔍 Sources: {len(data['sources'])} documents")
        print(f"💯 Confidence: {data['confidence']}")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")

# Test questions
test_query("What is the standard deduction for single filers in 2024?")
test_query("Can I deduct my home office expenses?")
test_query("What are the estimated tax payment deadlines?", "business")
```

---

## Frontend Integration Example

```typescript
// Next.js API call example
async function askTaxQuestion(question: string, userType: string) {
  const response = await fetch('http://localhost:8000/api/chat/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      user_type: userType,
      top_k: 3
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to get answer');
  }
  
  const data = await response.json();
  return data; // { answer, sources, confidence, timestamp }
}

// Usage in React component
const { answer, sources, confidence } = await askTaxQuestion(
  "What tax credits are available for children?",
  "individual"
);
```

---

## Troubleshooting

### Error: "Vector store not initialized"
- Check that FAISS index was created successfully
- Look for "✅ Created and saved new FAISS index" in server logs
- Check `app/db/faiss_index/` directory exists

### Error: "No relevant documents found"
- Question may be too specific or outside tax domain
- Try rephrasing the question
- Check user_type matches available documents

### Error: "OpenAI API key not found"
- Verify `OPENAI_API_KEY` is set in `.env` file
- Restart the server after updating `.env`
- Check API key is valid at https://platform.openai.com

### Low Confidence Scores
- Add more relevant documents to vector store
- Increase `top_k` to retrieve more context
- Improve document metadata and categorization
