# ChatTax Backend

FastAPI backend for ChatTax - an AI-powered tax assistant application.

## Features

- **JWT Authentication**: Secure user authentication with access and refresh tokens
- **SSE Streaming**: Real-time chat responses using Server-Sent Events
- **RAG (Retrieval-Augmented Generation)**: AI-powered tax question answering with citations
- **FAISS Vector Database**: Fast similarity search using pre-crawled tax documents
- **Real Tax Document Data**: Metadata includes source URLs, crawl dates, and provenance
- **Modular Architecture**: Clean separation of concerns (routers, models, schemas, services)
- **SQLAlchemy ORM**: Database management with support for SQLite, PostgreSQL, MySQL
- **CORS Enabled**: Configured for Next.js frontend integration

## Project Structure

```
Backend/
├── app/
│   ├── api/
│   │   └── routers/
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── chat.py          # Chat streaming endpoints
│   │       └── query.py         # RAG query endpoints
│   ├── core/
│   │   ├── config.py            # Application configuration
│   │   └── security.py          # JWT and password utilities
│   ├── db/
│   │   ├── database.py          # Database setup and session management
│   │   └── faiss_index/         # FAISS vector database index
│   ├── models/
│   │   └── user.py              # SQLAlchemy User model
│   ├── schemas/
│   │   └── schemas.py           # Pydantic validation schemas
│   └── services/
│       ├── auth_service.py      # Authentication business logic
│       ├── chat_service.py      # Chat business logic
│       ├── vector_store_service.py  # FAISS vector store management
│       └── llm_service.py       # OpenAI LLM integration
├── main.py                      # FastAPI application entry point
├── requirements.txt             # Python dependencies
├── README.md                    # This file
└── RAG_TESTING.md              # RAG endpoint testing guide

## Installation

### 1. Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### 2. Clone and Setup

```powershell
# Navigate to backend directory
cd Backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env file with your configuration
# IMPORTANT: 
# 1. Change SECRET_KEY in production!
# 2. Add your OpenAI API key for RAG features
```

**Required Environment Variables**:
- `SECRET_KEY`: JWT secret key (generate a secure random string)
- `OPENAI_API_KEY`: OpenAI API key from https://platform.openai.com/api-keys

### 4. Database Initialization

```powershell
# The FAISS index and metadata are pre-loaded from crawled data
# Located in: app/db/faiss_index/
#   - index.faiss: Vector embeddings
#   - metadata.parquet: Document metadata with URLs, dates, provenance

# User database will be created automatically on first run
# By default, uses SQLite (chattax.db)

# For PostgreSQL or MySQL, update DATABASE_URL in .env
```

### 5. Run the Server

```powershell
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication

- **POST** `/api/auth/register` - Register a new user
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "full_name": "John Doe"
  }
  ```

- **POST** `/api/auth/login` - Login and get tokens
  ```
  Form Data:
  - username: your_username
  - password: your_password
  ```

- **GET** `/api/auth/me` - Get current user info (requires JWT)

### Chat

- **POST** `/api/chat/stream` - Stream chat responses via SSE
  ```json
  {
    "content": "What are the tax deductions for 2024?"
  }
  ```

### Query (RAG)

- **POST** `/api/chat/query` - Answer tax questions with citations
  ```json
  {
    "question": "What is the standard deduction for 2024?",
    "user_type": "individual",
    "top_k": 3
  }
  ```
  
  Response includes:
  - `answer`: AI-generated answer with citations [Source 1], [Source 2]
  - `sources`: List of source documents with:
    - `chunk_id`: Unique chunk identifier
    - `doc_id`: Document ID
    - `source_url`: Original IRS/tax authority URL
    - `section_heading`: Section name from source
    - `text`: Relevant text excerpt
    - `crawl_date`: When document was crawled
    - `last_updated_on_page`: Last update date from source
    - `is_table_summary`: Boolean for table summaries
    - `provenance`: Data source information
    - `relevance_score`: 0-1 similarity score
  - `confidence`: Overall confidence score (0-1)
  - `timestamp`: Response timestamp

- **GET** `/api/chat/stats` - Get vector store statistics

## Next.js Integration

### 1. Update Frontend API Base URL

In your Next.js project, update the API base URL:

```typescript
// src/hooks/useStreamChat.ts or similar
const API_BASE_URL = 'http://localhost:8000/api';
```

### 2. Authentication Flow

```typescript
// Login
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    username: 'your_username',
    password: 'your_password',
  }),
});
const { access_token } = await response.json();

// Use token for authenticated requests
const chatResponse = await fetch('http://localhost:8000/api/chat/stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ content: 'Your question' }),
});
```

### 3. SSE Streaming Example

```typescript
const eventSource = new EventSource(
  'http://localhost:8000/api/chat/stream',
  { withCredentials: true }
);

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Chunk:', data.content);
});

eventSource.addEventListener('done', () => {
  console.log('Stream completed');
  eventSource.close();
});
```

## Development

### Add New Endpoint

1. Create router in `app/api/routers/`
2. Create service in `app/services/`
3. Define schemas in `app/schemas/schemas.py`
4. Include router in `main.py`

### Database Migration

For production, consider using Alembic for database migrations:

```powershell
pip install alembic
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Security Notes

- **Change SECRET_KEY**: Generate a secure random key for production
  ```powershell
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
- **Use HTTPS**: Always use HTTPS in production
- **Database**: Use PostgreSQL or MySQL for production (not SQLite)
- **Environment Variables**: Never commit `.env` file to version control

## Troubleshooting

### CORS Errors

If you see CORS errors, verify:
1. `CORS_ORIGINS` in `.env` includes your Next.js URL
2. Frontend is running on the correct port (default: 3000)

### Database Errors

```powershell
# Reset database (development only)
Remove-Item chattax.db
# Restart server to recreate
```

### Import Errors

```powershell
# Ensure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

## License

MIT License - See LICENSE file for details
