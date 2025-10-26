# 🚀 Quick Start Guide - RAG Query System

## What is RAG?

**RAG (Retrieval-Augmented Generation)** combines:
1. **Vector Database** (FAISS) - Finds relevant tax documents
2. **LLM** (OpenAI GPT-4) - Generates accurate answers with citations

This ensures answers are based on authoritative tax documents, not hallucinated!

---

## Setup (5 minutes)

### 1. Install Dependencies

```powershell
cd Backend
pip install -r requirements.txt
```

### 2. Get OpenAI API Key

1. Visit: https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-proj-...`)

### 3. Configure Environment

```powershell
# Edit .env file
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### 4. Start Server

```powershell
uvicorn main:app --reload
```

You should see:
```
✅ Loaded existing FAISS index from app/db/faiss_index
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Test the RAG System

### Option 1: Run Test Script

```powershell
python test_rag.py
```

This will automatically test:
- Server health
- Vector store initialization
- 3 sample queries

### Option 2: Use Swagger UI

1. Open: http://localhost:8000/docs
2. Find **POST /api/chat/query**
3. Click "Try it out"
4. Enter:
   ```json
   {
     "question": "What is the standard deduction for 2024?",
     "user_type": "individual",
     "top_k": 3
   }
   ```
5. Click "Execute"

### Option 3: cURL

```bash
curl -X POST "http://localhost:8000/api/chat/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What tax deductions are available for home office?",
    "user_type": "individual",
    "top_k": 3
  }'
```

---

## Understanding the Response

```json
{
  "answer": "For home office expenses in 2024, you can deduct...",
  "sources": [
    {
      "title": "IRS Publication 587 - Home Office Deduction",
      "content": "Home office deduction allows...",
      "publish_date": "2024-01-15",
      "relevance_score": 0.92
    }
  ],
  "confidence": 0.89,
  "user_type": "individual"
}
```

### Fields:
- **answer**: AI-generated answer with citations like [Source 1]
- **sources**: Documents used to generate the answer
  - `relevance_score`: 0-1 (higher = more relevant)
  - `publish_date`: When document was published/updated
- **confidence**: 0-1 (higher = more confident in answer)
- **user_type**: Context used for answer generation

---

## Sample Questions

### For Individuals:
- "What is the standard deduction for 2024?"
- "Can I deduct home office expenses?"
- "What are the contribution limits for IRA in 2024?"

### For Businesses:
- "How does the QBI deduction work?"
- "When are estimated tax payments due?"
- "What expenses can I deduct for my LLC?"

### For Professionals:
- "What are the 401(k) contribution limits including catch-up?"
- "How do I calculate estimated quarterly taxes?"

---

## Troubleshooting

### Error: "OpenAI API key not found"

**Solution**:
1. Check `.env` file has `OPENAI_API_KEY=sk-proj-...`
2. Restart the server after editing `.env`
3. Verify key is valid at https://platform.openai.com

### Error: "Vector store not initialized"

**Solution**:
1. Check server logs for "✅ Created and saved new FAISS index"
2. Verify `app/db/faiss_index/` directory exists
3. Delete `app/db/faiss_index/` and restart (will recreate)

### Error: "No relevant documents found"

**Solution**:
1. Try rephrasing the question
2. Use tax-related questions (system has tax documents only)
3. Check `user_type` matches available documents

### Low Confidence Scores

**Tips**:
- More specific questions = higher confidence
- Increase `top_k` to 5-10 for more context
- Add more documents to vector store (see below)

---

## Adding Custom Documents

### Method 1: Via Code

```python
from app.services.vector_store_service import get_vector_store_service
from langchain.schema import Document

# Create documents
docs = [
    Document(
        page_content="Your tax document content here...",
        metadata={
            "title": "Document Title",
            "publish_date": "2024-01-01",
            "user_type": "individual",
            "category": "deductions"
        }
    )
]

# Add to vector store
vector_store = get_vector_store_service()
vector_store.add_documents(docs)
```

### Method 2: From PDF/TXT Files

```python
from langchain_community.document_loaders import PyPDFLoader
from app.services.vector_store_service import get_vector_store_service

# Load PDF
loader = PyPDFLoader("tax_document.pdf")
documents = loader.load()

# Add metadata
for doc in documents:
    doc.metadata["user_type"] = "individual"
    doc.metadata["publish_date"] = "2024-01-01"

# Add to vector store
vector_store = get_vector_store_service()
vector_store.add_documents(documents)
```

---

## Production Considerations

### 1. Security
- ✅ Never commit `.env` with real API keys
- ✅ Use environment variables in production
- ✅ Rotate API keys regularly

### 2. Performance
- Consider caching frequently asked questions
- Use `gpt-4o-mini` (current) for cost-effectiveness
- Upgrade to `gpt-4o` for better accuracy (higher cost)

### 3. Monitoring
- Track confidence scores
- Log user questions for improvement
- Monitor OpenAI API usage and costs

### 4. Scaling
- Use PostgreSQL instead of SQLite
- Deploy FAISS index to shared storage
- Add rate limiting for API calls

---

## Next Steps

1. ✅ **Test the system** with `python test_rag.py`
2. ✅ **Try different questions** in Swagger UI
3. ✅ **Add your own tax documents** to vector store
4. ✅ **Integrate with Frontend** (see Frontend Integration in README.md)
5. ✅ **Monitor and improve** based on user feedback

---

## Cost Estimation

**OpenAI API Costs** (as of 2024):
- `gpt-4o-mini`: ~$0.15 per 1M input tokens
- `text-embedding-3-small`: ~$0.02 per 1M tokens

**Example Monthly Costs**:
- 1,000 queries/month: ~$5-10
- 10,000 queries/month: ~$50-100
- 100,000 queries/month: ~$500-1000

Actual costs depend on:
- Question length
- Number of source documents
- Answer length

---

## Support

- 📖 Full Documentation: `Backend/README.md`
- 🧪 Testing Guide: `Backend/RAG_TESTING.md`
- 🐛 Issues: Check server logs for errors
- 💡 Tips: See CODING_RULES.md for best practices
