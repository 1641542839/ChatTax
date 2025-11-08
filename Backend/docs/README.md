# ChatTax Backend Documentation

Comprehensive documentation for ChatTax Backend - an AI-powered Australian tax assistant.

## 📚 Documentation Structure

### 01. Getting Started
Essential guides to get you up and running quickly.

- **[Installation Guide](./01-getting-started/installation.md)**  
  Complete setup instructions, prerequisites, and environment configuration

- **[Quick Start Guide](./01-getting-started/quickstart.md)**  
  5-minute guide to test the system with sample queries

- **[Configuration Guide](./01-getting-started/configuration.md)**  
  Environment variables, security settings, and production configuration

---

### 02. Architecture
Deep dive into system design and technical architecture.

- **[System Overview](./02-architecture/overview.md)**  
  High-level architecture, component layers, design patterns, and request flows

- **[RAG System](./02-architecture/rag-system.md)**  
  Detailed explanation of Retrieval-Augmented Generation pipeline, embeddings, and LLM integration

- **[FAISS Integration](./02-architecture/faiss-integration.md)** *(coming soon)*  
  Vector store implementation details and optimization strategies

---

### 03. API Reference
Complete API documentation with examples.

- **[API Endpoints](./03-api/endpoints.md)**  
  Complete reference for all endpoints: authentication, RAG query, chat streaming, checklist

- **[Authentication Flow](./03-api/authentication.md)** *(coming soon)*  
  JWT authentication, user registration, and token management

- **[Query Endpoint Details](./03-api/query-endpoint.md)** *(coming soon)*  
  In-depth RAG query endpoint usage and response structure

---

### 04. Development
Guides for developers contributing to or deploying the project.

- **[Testing Guide](./04-development/testing.md)**  
  Unit testing, integration testing, API testing, and performance testing

- **[Deployment Guide](./04-development/deployment.md)** *(coming soon)*  
  Production deployment strategies and best practices

- **[Contributing Guidelines](./04-development/contributing.md)** *(coming soon)*  
  How to contribute to the project

---

### 05. Database
Database management and vector store documentation.

- **[Database Management](./05-database/database-management.md)**  
  SQLAlchemy setup, FAISS vector store, migrations, backup, and optimization

---

### 06. Troubleshooting
Solutions to common problems and debugging guides.

- **[Common Issues](./06-troubleshooting/common-issues.md)**  
  Installation errors, runtime issues, API errors, and performance problems

- **[FAQ](./06-troubleshooting/faq.md)**  
  Frequently asked questions about ChatTax Backend

---

## 🚀 Quick Links

**First time here?**
1. Start with [Installation Guide](./01-getting-started/installation.md)
2. Follow the [Quick Start Guide](./01-getting-started/quickstart.md)
3. Explore [API Endpoints](./03-api/endpoints.md)

**Understanding the system?**
1. Read [System Overview](./02-architecture/overview.md)
2. Learn about [RAG System](./02-architecture/rag-system.md)
3. Review [API Reference](./03-api/endpoints.md)

**Developing or deploying?**
1. Check [Testing Guide](./04-development/testing.md)
2. Review [Configuration Guide](./01-getting-started/configuration.md)
3. Manage [Database](./05-database/database-management.md)
4. See [Troubleshooting](./06-troubleshooting/common-issues.md)

---

## 🎯 Key Concepts

### RAG (Retrieval-Augmented Generation)
ChatTax uses RAG to answer tax questions by:
1. **Retrieving** relevant documents from 3,246 indexed Australian tax documents
2. **Augmenting** the query with retrieved context
3. **Generating** accurate answers with citations using OpenAI GPT-4o-mini

### Two-Stage Retrieval
- **Stage 1 (FAISS)**: Fast bi-encoder retrieves top 20 candidates (~5ms)
- **Stage 2 (Reranking)**: Precise cross-encoder reranks to top 5 (~200ms)

### Dynamic Checklists
AI-generated tax preparation checklists adapt to user complexity:
- Simple cases: 5-8 items
- Moderate cases: 8-12 items  
- Complex cases: 12-15 items

---

## 🔍 For GitHub Copilot

**System Summary**:
ChatTax Backend is a FastAPI-based RAG system for Australian individual tax assistance. It uses FAISS for vector search across 3,246 tax documents, implements two-stage retrieval with reranking, and generates answers via OpenAI GPT-4o-mini with citations.

**Key Technologies**:
- FastAPI 0.104.1 (async web framework)
- FAISS-CPU 1.9.0 (vector similarity search)
- sentence-transformers (all-MiniLM-L6-v2, 384-dim embeddings)
- LangChain + OpenAI GPT-4o-mini (LLM integration)
- SQLAlchemy (ORM for user management)
- PyArrow + Pandas (metadata storage in Parquet format)

**Architecture Patterns**:
- Repository pattern for vector store
- Strategy pattern for reranking algorithms
- Dependency injection via FastAPI
- Factory pattern for database sessions

**Critical Components**:
1. `vector_store_service.py` - FAISS search and metadata retrieval
2. `llm_service.py` - OpenAI prompts and checklist generation
3. `reranker_service.py` - Two-stage retrieval implementation
4. `query.py` router - RAG endpoint orchestration

**Data Flow**:
```
User Query → Embedding (384-dim) → FAISS Search (top 20) → 
Reranking (top 5) → Metadata Lookup → Prompt Construction → 
GPT-4o-mini Generation → Response with Citations
```

---

## 📞 Support

- **Issues**: Report bugs or request features on GitHub Issues
- **Questions**: Review documentation or check [Common Issues](./06-troubleshooting/common-issues.md)
- **Database Problems**: See [Database Management](./05-database/database-management.md)
- **Contributing**: See [Contributing Guidelines](./04-development/contributing.md) *(coming soon)*

---

**Documentation Version**: 1.0  
**Last Updated**: November 8, 2024  
**Project**: ChatTax Backend
