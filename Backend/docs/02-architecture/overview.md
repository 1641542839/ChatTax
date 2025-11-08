# System Architecture Overview

Complete architectural overview of ChatTax Backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│                  (React 18 + TypeScript)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/SSE
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Routers    │  │   Services   │  │   Core/Utils    │  │
│  │              │  │              │  │                 │  │
│  │ - auth.py    │→ │ - auth       │  │ - security.py   │  │
│  │ - chat.py    │→ │ - chat       │  │ - config.py     │  │
│  │ - query.py   │→ │ - llm        │  │ - database.py   │  │
│  │ - checklist  │→ │ - vector     │  │                 │  │
│  └──────────────┘  │ - reranker   │  └─────────────────┘  │
│                     └──────┬───────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   SQLite/    │    │    FAISS     │    │   OpenAI     │
│  PostgreSQL  │    │Vector Store  │    │   GPT-4o     │
│              │    │              │    │              │
│ User/Chat    │    │ 3,246 docs   │    │  Chat/RAG    │
│ Sessions     │    │ 384-dim      │    │  Generation  │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Component Layers

### 1. API Layer (Routers)

**Location**: `app/api/routers/`

**Responsibilities**:
- HTTP request/response handling
- Input validation (Pydantic schemas)
- Authentication/authorization
- Error handling and status codes

**Key Files**:
- `auth.py`: User authentication (register, login, JWT)
- `chat.py`: Chat streaming and conversation management
- `query.py`: RAG query endpoint for tax questions
- `checklist.py`: Checklist generation and management

### 2. Business Logic Layer (Services)

**Location**: `app/services/`

**Responsibilities**:
- Core business logic
- External service integration
- Data processing and transformation
- Algorithm implementation

**Key Files**:
- `auth_service.py`: Password hashing, token generation
- `chat_service.py`: Chat session management, message storage
- `llm_service.py`: OpenAI integration, prompt engineering
- `vector_store_service.py`: FAISS search, metadata retrieval
- `reranker_service.py`: Two-stage retrieval with cross-encoder

### 3. Data Layer

**Location**: `app/db/`, `app/models/`

**Responsibilities**:
- Database connections
- ORM models
- Vector store management
- Data persistence

**Key Files**:
- `database.py`: SQLAlchemy engine and session management
- `user.py`: User ORM model
- `faiss_index/`: Pre-built vector index and metadata

### 4. Core Layer

**Location**: `app/core/`, `app/schemas/`

**Responsibilities**:
- Configuration management
- Security utilities
- Data validation schemas
- Shared utilities

**Key Files**:
- `config.py`: Environment configuration
- `security.py`: JWT, password hashing, authentication
- `schemas.py`: Pydantic models for request/response validation

## Request Flow

### RAG Query Flow

```
User Question: "What are home office deductions in Australia?"
    ↓
1. API Router (query.py)
   ├─ Validates request (Pydantic schema)
   ├─ Extracts: question, user_type, top_k
   └─ Calls vector_store_service
    ↓
2. Vector Store Service (vector_store_service.py)
   ├─ Embeds query → 384-dim vector
   ├─ FAISS search → top 20 candidates
   ├─ (Optional) Reranking → top 5 results
   └─ Retrieves metadata for each result
    ↓
3. Metadata Retrieval
   ├─ Loads metadata.parquet (Pandas DataFrame)
   ├─ Maps FAISS indices → metadata rows
   └─ Returns: source_url, text, section_heading, etc.
    ↓
4. LLM Service (llm_service.py)
   ├─ Formats context from top documents
   ├─ Constructs prompt with citations
   ├─ Calls OpenAI GPT-4o-mini
   └─ Generates answer with [Source 1], [Source 2]
    ↓
5. Response Assembly
   ├─ Combines answer + sources
   ├─ Calculates confidence score
   └─ Returns JSON response
    ↓
User receives: AI answer with authoritative tax sources
```

### Chat Streaming Flow (SSE)

```
User Message: "Help me with tax planning"
    ↓
1. API Router (chat.py)
   ├─ Validates JWT token
   ├─ Creates/retrieves chat session
   └─ Calls chat_service
    ↓
2. Chat Service (chat_service.py)
   ├─ Loads conversation history
   ├─ Formats messages for OpenAI
   └─ Calls LLM service for streaming
    ↓
3. LLM Service Streaming
   ├─ Calls OpenAI streaming API
   ├─ Yields tokens as they arrive
   └─ Sends via Server-Sent Events (SSE)
    ↓
4. SSE Response
   ├─ event: message → data: {"content": "token"}
   ├─ event: message → data: {"content": "next token"}
   └─ event: done → closes stream
    ↓
Frontend receives tokens in real-time
```

### Checklist Generation Flow

```
User Profile: {employed, has_investment, NSW}
    ↓
1. API Router (checklist.py)
   ├─ Validates identity_info
   └─ Calls llm_service.generate_checklist()
    ↓
2. LLM Service
   ├─ Analyzes complexity:
   │  - Simple (3 factors) → 5-8 items
   │  - Moderate (5 factors) → 8-12 items
   │  - Complex (7+ factors) → 12-15 items
   ├─ Constructs prompt:
   │  - Employment: employed
   │  - Income: salary + investment
   │  - Location: NSW
   ├─ Calls OpenAI GPT-4o-mini
   └─ Parses JSON response
    ↓
3. Response Processing
   ├─ Validates checklist items
   ├─ Assigns IDs and defaults
   └─ Saves to database
    ↓
User receives personalized checklist
```

## Design Patterns

### 1. Repository Pattern

**Vector Store Service** abstracts FAISS access:

```python
class VectorStoreService:
    def search(self, query: str, top_k: int):
        # Implementation details hidden
        pass
    
    def get_metadata(self, indices: List[int]):
        # Metadata access abstracted
        pass
```

**Benefits**:
- Easy to swap FAISS for other vector stores
- Testable with mock repositories
- Clean separation of concerns

### 2. Strategy Pattern

**Reranker Service** uses strategy pattern:

```python
class RerankerStrategy(ABC):
    @abstractmethod
    def rerank(self, query, documents, top_k):
        pass

class CrossEncoderReranker(RerankerStrategy):
    # Actual reranking logic
    pass

class NoOpReranker(RerankerStrategy):
    # Fallback when reranking disabled
    pass
```

**Benefits**:
- Switch reranking algorithms at runtime
- Easy to add new reranking strategies
- Follows Open/Closed Principle

### 3. Dependency Injection

**Services are injected via FastAPI dependencies**:

```python
@router.post("/query")
def query_endpoint(
    request: QueryRequest,
    vector_service: VectorStoreService = Depends(get_vector_store_service)
):
    # Service injected automatically
    results = vector_service.search(request.question)
```

**Benefits**:
- Loose coupling
- Easy to mock for testing
- Clear dependencies

### 4. Factory Pattern

**Session management**:

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Benefits**:
- Centralized session creation
- Automatic cleanup
- Connection pooling

## Database Schema

### User Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Chat Session (Future)

```sql
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER FOREIGN KEY,
    title VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    session_id INTEGER FOREIGN KEY,
    role VARCHAR CHECK(role IN ('user', 'assistant')),
    content TEXT,
    timestamp TIMESTAMP
);
```

## Vector Store Architecture

### FAISS Index Structure

- **Type**: Flat index (exact search)
- **Dimensions**: 384 (from all-MiniLM-L6-v2)
- **Documents**: 3,246 tax document chunks
- **Metric**: Cosine similarity (L2 normalized)

### Metadata Structure

**File**: `metadata.parquet` (Pandas DataFrame)

| Column | Type | Description |
|--------|------|-------------|
| chunk_id | string | Unique chunk identifier |
| doc_id | string | Parent document ID |
| source_url | string | Original ATO URL |
| section_heading | string | Document section |
| text | string | Chunk content |
| tokens_est | int | Estimated token count |
| is_table_summary | bool | Is table data |
| provenance | string | Data source |
| crawl_date | string | Indexing date |
| last_updated_on_page | string | Source update date |

### Index-Metadata Correspondence

**Position-based mapping** (O(1) access):

```python
# FAISS returns indices: [245, 1089, 2341]
distances, indices = faiss_index.search(query_vector, k=3)

# Direct metadata access
for idx in indices[0]:
    meta_row = metadata.iloc[idx]  # O(1) position lookup
    source = meta_row['source_url']
    text = meta_row['text']
```

**Key Properties**:
- FAISS index position = metadata row index
- No hash tables or lookups needed
- Guaranteed consistency

## Security Architecture

### Authentication Flow

```
1. User registers → Password hashed with bcrypt
2. User logs in → JWT token generated
3. Token includes: user_id, username, exp
4. Protected endpoints verify JWT signature
5. Token expires after 30 minutes
```

### Password Security

- **Algorithm**: bcrypt with automatic salt
- **Rounds**: 12 (adjustable)
- **Storage**: Only hashed passwords stored
- **Verification**: Constant-time comparison

### JWT Structure

```json
{
  "sub": "username",
  "user_id": 123,
  "exp": 1699456789
}
```

**Signed with**: HS256 + SECRET_KEY

## Scalability Considerations

### Current Limitations

1. **SQLite**: Not suitable for multiple workers
2. **In-Memory FAISS**: Requires RAM for full index
3. **Single OpenAI Key**: Rate limits per key

### Scaling Strategies

1. **Database**: Migrate to PostgreSQL with connection pooling
2. **Vector Store**: Use FAISS-IVF for larger indices (>1M docs)
3. **Caching**: Redis for frequent queries
4. **Load Balancing**: Multiple backend instances behind nginx
5. **API Gateway**: Rate limiting and request routing

## Performance Metrics

**Typical Request Latencies**:

| Operation | Latency | Notes |
|-----------|---------|-------|
| FAISS search (3 docs) | ~5ms | In-memory, exact search |
| FAISS search (20 docs) | ~8ms | For reranking |
| Reranking (20→5) | ~200ms | Cross-encoder inference |
| OpenAI API call | ~500-2000ms | Network + generation |
| Total RAG query | ~1-3s | With reranking |
| Token streaming | ~50-100ms/token | SSE streaming |

## Error Handling

### Error Flow

```
Exception Raised
    ↓
Service Layer catches specific exceptions
    ↓
Logs error with context
    ↓
Raises HTTPException with appropriate status code
    ↓
FastAPI exception handler
    ↓
JSON error response to client
```

### Standard Error Response

```json
{
  "detail": "Error message",
  "status_code": 400,
  "timestamp": "2024-11-08T10:30:00"
}
```

## Monitoring and Logging

### Log Levels

- **DEBUG**: Detailed diagnostic information
- **INFO**: General operational events
- **WARNING**: Unexpected but handled situations
- **ERROR**: Error events that might still allow operation
- **CRITICAL**: Serious errors requiring immediate attention

### Key Metrics to Monitor

1. **Request latency** (P50, P95, P99)
2. **Error rate** (4xx, 5xx)
3. **OpenAI API usage** (tokens, cost)
4. **FAISS search performance**
5. **Database connection pool utilization**

## Next Steps

- [RAG System Details](./rag-system.md)
- [FAISS Integration](./faiss-integration.md)
- [API Reference](../03-api/endpoints.md)
