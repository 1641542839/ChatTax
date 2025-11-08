# ChatTax Backend

FastAPI backend for ChatTax - an AI-powered Australian tax assistant application.

## Overview

ChatTax Backend provides intelligent tax assistance through:

- **RAG (Retrieval-Augmented Generation)**: AI answers grounded in 3,246 official Australian tax documents
- **FAISS Vector Search**: Fast semantic search (~5ms) through tax documents  
- **OpenAI GPT-4o-mini**: Generates accurate answers with citations
- **Dynamic Checklists**: Personalized tax prep tasks (5-15 items based on complexity)
- **JWT Authentication**: Secure user management
- **SSE Streaming**: Real-time chat responses

**Target Users**: Australian individual taxpayers only

## Quick Start

### Prerequisites

- Python 3.8+ (3.11 or 3.12 recommended)
- OpenAI API key from https://platform.openai.com/api-keys

### Installation (5 minutes)

```powershell
# 1. Navigate to backend
cd Backend

# 2. Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
Copy-Item .env.example .env
# Edit .env and add:
#   SECRET_KEY=<generate-with-secrets.token_urlsafe(32)>
#   OPENAI_API_KEY=sk-proj-your-key-here

# 5. Start server
uvicorn main:app --reload
```

### Test the System

```powershell
# Health check
curl http://localhost:8000/health

# Test RAG query
curl -X POST "http://localhost:8000/api/chat/query" `
  -H "Content-Type: application/json" `
  -d '{
    "question": "What is the tax-free threshold in Australia?",
    "top_k": 3
  }'
```

**Access Points**:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
Backend/
├── app/
│   ├── api/routers/         # HTTP endpoints (auth, chat, query, checklist)
│   ├── services/            # Business logic (llm, vector_store, auth)
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic validation schemas
│   ├── core/                # Config, security utilities
│   └── db/
│       ├── database.py      # Database connection
│       └── faiss_index/     # Pre-built vector store (3,246 docs)
├── docs/                    # 📚 Comprehensive documentation
│   ├── 01-getting-started/  # Installation, quickstart, configuration
│   ├── 02-architecture/     # System design, RAG, FAISS
│   ├── 03-api/              # API endpoints reference
│   └── 04-development/      # Testing, deployment, contributing
├── main.py                  # FastAPI application entry
└── requirements.txt         # Python dependencies
```

## Documentation

### 📖 Getting Started
- **[Installation Guide](./docs/01-getting-started/installation.md)** - Complete setup instructions
- **[Quick Start](./docs/01-getting-started/quickstart.md)** - 5-minute getting started guide
- **[Configuration](./docs/01-getting-started/configuration.md)** - Environment variables and settings

### 🏗️ Architecture
- **[System Overview](./docs/02-architecture/overview.md)** - High-level architecture and design patterns
- **[RAG System](./docs/02-architecture/rag-system.md)** - Retrieval-Augmented Generation pipeline
- **[FAISS Integration](./docs/02-architecture/faiss-integration.md)** - Vector store architecture (coming soon)

### 🔌 API Reference
- **[Endpoints](./docs/03-api/endpoints.md)** - Complete API reference with examples
- **[Authentication](./docs/03-api/authentication.md)** - JWT auth flow (coming soon)
- **[RAG Query](./docs/03-api/query-endpoint.md)** - Query endpoint details (coming soon)

### 🛠️ Development
- **[Testing Guide](./docs/04-development/testing.md)** - Unit, integration, and API testing
- **[Deployment](./docs/04-development/deployment.md)** - Production deployment guide (coming soon)
- **[Troubleshooting](./docs/04-development/troubleshooting.md)** - Common issues and solutions (coming soon)

## Key Features

### RAG Query System
Answer Australian tax questions with AI, grounded in official ATO documents:

```json
{
  "question": "What are home office deductions in Australia?",
  "top_k": 3
}
→ 
{
  "answer": "You can claim deductions for... [Source 1]",
  "sources": [
    {
      "source_url": "https://www.ato.gov.au/...",
      "section_heading": "Home office expenses",
      "relevance_score": 0.89
    }
  ],
  "confidence": 0.85
}
```

### Dynamic Checklist Generation
Generate personalized tax preparation checklists:

```json
{
  "employment_status": "employed",
  "income_sources": ["salary", "investment"],
  "has_dependents": true
}
→ 8-12 personalized tasks
```

### Two-Stage Retrieval
- **Stage 1**: FAISS bi-encoder (fast, top 20 candidates)
- **Stage 2**: Cross-encoder reranking (accurate, top 5 results)

## Tech Stack

- **Framework**: FastAPI 0.104.1
- **AI/LLM**: OpenAI GPT-4o-mini via LangChain
- **Vector Store**: FAISS-CPU 1.9.0 (3,246 documents, 384-dim)
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2)
- **Database**: SQLAlchemy (SQLite/PostgreSQL/MySQL)
- **Authentication**: JWT with bcrypt password hashing

## For GitHub Copilot

This backend implements a **RAG (Retrieval-Augmented Generation)** system for Australian tax assistance:

**Core Architecture**:
1. User asks question → Embed query (384-dim vector)
2. FAISS searches 3,246 tax documents → Top 20 candidates
3. Cross-encoder reranks → Top 5 most relevant
4. Metadata lookup → Get source URLs, text, dates
5. GPT-4o-mini generates answer with citations

**Key Design Patterns**:
- Repository pattern (vector store abstraction)
- Strategy pattern (reranking algorithms)
- Dependency injection (FastAPI dependencies)
- Factory pattern (database sessions)

**Critical Files**:
- `app/services/vector_store_service.py` - FAISS search, metadata retrieval
- `app/services/llm_service.py` - OpenAI integration, prompt engineering
- `app/services/reranker_service.py` - Two-stage retrieval
- `app/api/routers/query.py` - RAG query endpoint

**FAISS-Metadata Correspondence**: Position-based mapping (O(1) access)
```python
# FAISS returns: indices = [245, 1089, 2341]
for idx in indices:
    meta_row = metadata.iloc[idx]  # Direct row access
```

**Focus**: Australian individual taxpayers only (NOT U.S., NOT business tax)

## Contributing

Contributions are welcome! Please see our [Contributing Guide](./docs/04-development/contributing.md) (coming soon).

## License

MIT License - See LICENSE file for details

---

**Need Help?** 
- Check [Troubleshooting Guide](./docs/04-development/troubleshooting.md)
- Review [API Documentation](./docs/03-api/endpoints.md)
- See [Architecture Overview](./docs/02-architecture/overview.md)
