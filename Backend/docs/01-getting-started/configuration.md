# Configuration Guide

Complete configuration reference for ChatTax Backend.

## Environment Variables

### Required Configuration

```env
# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# OpenAI API
OPENAI_API_KEY=sk-proj-your-key-here

# Database
DATABASE_URL=sqlite:///./chattax.db

# CORS
CORS_ORIGINS=http://localhost:3000
```

### Optional Configuration

```env
# Server
HOST=0.0.0.0
PORT=8000

# Logging
LOG_LEVEL=INFO

# RAG Settings
DEFAULT_TOP_K=3
USE_RERANKING=true
INITIAL_RETRIEVAL_SIZE=20

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

## Security Configuration

### Generate Secret Key

```powershell
# Generate a secure random secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Example output**: `X9sK3mP2nQ7vR8tY1uZ4wA5bC6dE7fG8hI9jK0lM1nO2pQ3r`

Use this value for `SECRET_KEY` in `.env`.

### Token Expiration

```env
# Access token expires after 30 minutes (default)
ACCESS_TOKEN_EXPIRE_MINUTES=30

# For development, you can extend this:
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours
```

### Password Hashing

Uses `bcrypt` with automatic salt generation. No additional configuration needed.

## Database Configuration

### SQLite (Default - Development)

```env
DATABASE_URL=sqlite:///./chattax.db
```

- ✅ Simple setup
- ✅ No external dependencies
- ❌ Not suitable for production with multiple workers

### PostgreSQL (Recommended - Production)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chattax
```

**Setup PostgreSQL**:
```powershell
# Install PostgreSQL
# Create database
createdb chattax

# Update .env
DATABASE_URL=postgresql://chattax_user:secure_password@localhost:5432/chattax
```

### MySQL

```env
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/chattax
```

**Install MySQL driver**:
```powershell
pip install pymysql
```

## CORS Configuration

### Development (Single Frontend)

```env
CORS_ORIGINS=http://localhost:3000
```

### Multiple Origins

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://staging.chattax.com
```

### Production

```env
CORS_ORIGINS=https://chattax.com,https://www.chattax.com
```

**Security Note**: Never use `*` (all origins) in production!

## OpenAI Configuration

### API Key

Get your API key from https://platform.openai.com/api-keys

```env
OPENAI_API_KEY=sk-proj-abcd1234...
```

### Model Selection

Edit `app/services/llm_service.py`:

```python
# Default: GPT-4o-mini (fast, cost-effective)
self.llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3
)

# For better quality, use GPT-4:
self.llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3
)

# For faster responses, use GPT-3.5:
self.llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0.3
)
```

### Temperature Settings

- `0.0-0.3`: More deterministic, factual (recommended for tax advice)
- `0.4-0.7`: Balanced creativity
- `0.8-1.0`: More creative, less predictable (not recommended)

## RAG Configuration

### Vector Store Settings

Edit `app/services/vector_store_service.py`:

```python
# Default retrieval size
DEFAULT_TOP_K = 3  # Return top 3 documents

# With reranking
INITIAL_RETRIEVAL_SIZE = 20  # Retrieve 20, rerank to top 3
```

### Reranking Configuration

Enable/disable two-stage retrieval:

```python
# In API request
{
  "question": "...",
  "use_reranking": true,  // Enable reranking
  "initial_candidates": 20  // Retrieve 20 for reranking
}
```

**Performance Trade-offs**:
- **With reranking**: Higher accuracy, ~200ms slower
- **Without reranking**: Faster responses, slightly lower accuracy

### Embedding Model

Default: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)

To change the model, edit `app/services/vector_store_service.py`:

```python
from sentence_transformers import SentenceTransformer

# Option 1: Faster, smaller model
self.embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Option 2: Better accuracy, larger model
self.embedder = SentenceTransformer('all-mpnet-base-v2')

# Option 3: Multilingual support
self.embedder = SentenceTransformer('distiluse-base-multilingual-cased-v2')
```

**Note**: Changing the embedding model requires rebuilding the FAISS index!

## Checklist Generation Settings

### Dynamic Complexity Levels

Edit `app/services/llm_service.py`:

```python
# Current settings
complexity_guide = """
- Simple cases: 5-8 items
- Moderate cases: 8-12 items
- Complex cases: 12-15 items
"""

# Custom settings
complexity_guide = """
- Simple cases: 3-5 items
- Moderate cases: 6-10 items
- Complex cases: 10-20 items
"""
```

### Checklist Categories

Modify prompt template in `llm_service.py`:

```python
categories = [
    "documents",      # Documents to gather
    "accounts",       # Online account setup
    "records",        # Record preparation
    "calculations",   # Pre-filing calculations
    "review"          # Final review steps
]
```

## Logging Configuration

### Log Level

```env
LOG_LEVEL=INFO  # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### Log Format

Edit `main.py`:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),  # Log to file
        logging.StreamHandler()          # Log to console
    ]
)
```

## Production Configuration

### Recommended Settings

```env
# Security
SECRET_KEY=<generate-strong-key>
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/chattax

# CORS (specific origins only)
CORS_ORIGINS=https://chattax.com

# OpenAI
OPENAI_API_KEY=sk-proj-production-key

# Logging
LOG_LEVEL=WARNING

# Server
HOST=0.0.0.0
PORT=8000
```

### Run with Multiple Workers

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Note**: SQLite doesn't support multiple workers! Use PostgreSQL or MySQL.

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.chattax.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL/TLS Configuration

Use Let's Encrypt with Certbot:

```powershell
certbot --nginx -d api.chattax.com
```

## Environment-Specific Configuration

### Development (.env.development)

```env
DEBUG=true
LOG_LEVEL=DEBUG
DATABASE_URL=sqlite:///./chattax_dev.db
CORS_ORIGINS=http://localhost:3000
```

### Staging (.env.staging)

```env
DEBUG=false
LOG_LEVEL=INFO
DATABASE_URL=postgresql://user:password@staging-db:5432/chattax
CORS_ORIGINS=https://staging.chattax.com
```

### Production (.env.production)

```env
DEBUG=false
LOG_LEVEL=WARNING
DATABASE_URL=postgresql://user:password@prod-db:5432/chattax
CORS_ORIGINS=https://chattax.com,https://www.chattax.com
```

### Load Environment

```python
from dotenv import load_dotenv
import os

# Load specific environment
env = os.getenv('ENVIRONMENT', 'development')
load_dotenv(f'.env.{env}')
```

## Configuration Validation

Create `validate_config.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()

required_vars = [
    'SECRET_KEY',
    'OPENAI_API_KEY',
    'DATABASE_URL'
]

print("Configuration Validation")
print("=" * 50)

for var in required_vars:
    value = os.getenv(var)
    if value:
        masked = value[:10] + '...' if len(value) > 10 else value
        print(f"✅ {var}: {masked}")
    else:
        print(f"❌ {var}: MISSING")
        
print("\nOptional Variables:")
print(f"CORS_ORIGINS: {os.getenv('CORS_ORIGINS', 'http://localhost:3000')}")
print(f"LOG_LEVEL: {os.getenv('LOG_LEVEL', 'INFO')}")
```

Run it:
```powershell
python validate_config.py
```

## Troubleshooting

### Configuration Not Loading

```powershell
# Check .env file exists
Test-Path .env

# Check file encoding (should be UTF-8)
Get-Content .env -Encoding UTF8
```

### Database Connection Errors

```powershell
# Test database connection
python -c "from app.db.database import engine; engine.connect()"
```

### CORS Errors

Ensure frontend origin matches exactly:
- `http://localhost:3000` ≠ `http://127.0.0.1:3000`
- `http://localhost:3000` ≠ `https://localhost:3000`

## Next Steps

- [Architecture Overview](../02-architecture/overview.md)
- [API Reference](../03-api/endpoints.md)
- [Development Guide](../04-development/testing.md)
