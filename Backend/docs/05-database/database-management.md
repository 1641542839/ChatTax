# Database Management

Complete guide to database management in ChatTax Backend.

## Overview

ChatTax uses two types of data storage:

1. **Relational Database (SQLAlchemy)**: User accounts, chat sessions, checklists
2. **Vector Database (FAISS)**: Tax document embeddings for semantic search

---

## Relational Database

### Supported Databases

- **SQLite** (default): Development, single-user scenarios
- **PostgreSQL**: Production, recommended for multi-user
- **MySQL**: Production, alternative to PostgreSQL

### Database Configuration

**SQLite (Development)**:
```env
DATABASE_URL=sqlite:///./chattax.db
```

**PostgreSQL (Production)**:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/chattax
```

**MySQL**:
```env
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/chattax
```

### Database Schema

#### User Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**SQLAlchemy Model**:
```python
# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### Chat Sessions (Future Enhancement)

```sql
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id),
    role VARCHAR(20) CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT,
    timestamp TIMESTAMP
);
```

#### Checklists

```sql
CREATE TABLE checklists (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    identity_info JSON,
    items JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## Database Initialization

### Automatic Initialization

Database tables are created automatically on first run:

```python
# main.py
from app.db.database import engine, Base
from app.models.user import User  # Import models

# Create tables
Base.metadata.create_all(bind=engine)
```

### Manual Initialization

```powershell
# Using Python shell
cd Backend
python

>>> from app.db.database import engine, Base
>>> from app.models.user import User
>>> Base.metadata.create_all(bind=engine)
>>> exit()
```

---

## Database Migrations with Alembic

### Setup Alembic

```powershell
# Install Alembic
pip install alembic

# Initialize Alembic
cd Backend
alembic init alembic
```

### Configure Alembic

Edit `alembic/env.py`:

```python
from app.db.database import Base
from app.models.user import User  # Import all models

target_metadata = Base.metadata
```

Edit `alembic.ini`:

```ini
# Update sqlalchemy.url to use your DATABASE_URL
sqlalchemy.url = sqlite:///./chattax.db
```

### Create Migration

```powershell
# Auto-generate migration from models
alembic revision --autogenerate -m "Initial migration"

# Review migration in alembic/versions/xxxxx_initial_migration.py

# Apply migration
alembic upgrade head
```

### Common Migration Commands

```powershell
# Create new migration
alembic revision -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history
```

---

## Vector Database (FAISS)

### Index Structure

**Location**: `app/db/faiss_index/`

**Files**:
- `index.faiss` - FAISS vector index (3,246 documents, 384 dimensions)
- `metadata.parquet` - Document metadata (Pandas DataFrame)

### FAISS Index Details

```python
import faiss

# Load index
index = faiss.read_index('app/db/faiss_index/index.faiss')

# Index properties
print(f"Index type: {type(index).__name__}")  # IndexFlatL2
print(f"Dimensions: {index.d}")                # 384
print(f"Total vectors: {index.ntotal}")        # 3246
```

### Metadata Schema

**File Format**: Parquet (compressed columnar format)

**Schema**:
```python
import pandas as pd

metadata = pd.read_parquet('app/db/faiss_index/metadata.parquet')

# Columns:
# - chunk_id (string): Unique chunk identifier
# - doc_id (string): Parent document ID
# - source_url (string): Original ATO URL
# - section_heading (string): Document section name
# - text (string): Chunk content
# - tokens_est (int): Estimated token count
# - is_table_summary (bool): Whether chunk is table summary
# - provenance (string): Data source
# - crawl_date (string): When document was indexed
# - last_updated_on_page (string): Source update date
```

### Index-Metadata Correspondence

**Position-Based Mapping**:
```python
# FAISS returns indices: [245, 1089, 2341]
distances, indices = index.search(query_vector, k=3)

# Direct O(1) metadata access
for idx in indices[0]:
    meta_row = metadata.iloc[idx]  # Position-based lookup
    print(meta_row['source_url'])
    print(meta_row['text'])
```

**Key Properties**:
- FAISS index position == metadata DataFrame row index
- No separate mapping table needed
- Guaranteed 1:1 correspondence
- O(1) lookup complexity

---

## Database Maintenance

### Backup

**SQLite Backup**:
```powershell
# Simple file copy
Copy-Item chattax.db chattax.db.backup

# With timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item chattax.db "chattax.db.$timestamp.backup"
```

**PostgreSQL Backup**:
```powershell
# Dump database
pg_dump -U username chattax > backup.sql

# With compression
pg_dump -U username chattax | gzip > backup.sql.gz

# Restore
psql -U username chattax < backup.sql
```

**FAISS Index Backup**:
```powershell
# Backup entire directory
Copy-Item -Recurse app/db/faiss_index app/db/faiss_index.backup
```

### Reset Database (Development)

**SQLite**:
```powershell
# Stop server first
# Delete database
Remove-Item chattax.db

# Restart server - tables will be recreated
uvicorn main:app --reload
```

**PostgreSQL**:
```powershell
# Drop and recreate database
dropdb chattax
createdb chattax

# Run migrations
alembic upgrade head
```

### Vacuum Database (SQLite)

```powershell
# Using SQLite CLI
sqlite3 chattax.db "VACUUM;"

# Or in Python
python -c "import sqlite3; conn = sqlite3.connect('chattax.db'); conn.execute('VACUUM'); conn.close()"
```

---

## Performance Optimization

### Database Indexing

**Add Indexes for Frequent Queries**:
```python
# In SQLAlchemy model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)  # Already indexed
    username = Column(String, unique=True, index=True)  # Already indexed
    created_at = Column(DateTime, index=True)  # Add if querying by date
```

**Create Index Manually**:
```sql
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_messages_session_id ON messages(session_id);
```

### Connection Pooling

**SQLAlchemy Connection Pool**:
```python
# app/db/database.py
from sqlalchemy import create_engine

engine = create_engine(
    DATABASE_URL,
    pool_size=5,           # Max 5 persistent connections
    max_overflow=10,       # Allow 10 additional connections
    pool_pre_ping=True,    # Verify connections before use
    pool_recycle=3600      # Recycle connections after 1 hour
)
```

**PostgreSQL Connection Pool (pgbouncer)**:
```ini
# Install pgbouncer for production
[databases]
chattax = host=localhost port=5432 dbname=chattax

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

### FAISS Index Optimization

**For Larger Datasets (>10K documents)**:
```python
import faiss
import numpy as np

# Use IVF (Inverted File) index for faster search
nlist = 100  # Number of clusters
quantizer = faiss.IndexFlatL2(384)
index = faiss.IndexIVFFlat(quantizer, 384, nlist)

# Train index
index.train(embeddings)
index.add(embeddings)

# Search with fewer clusters for speed
index.nprobe = 10  # Search 10 out of 100 clusters
distances, indices = index.search(query_vector, k=5)
```

---

## Data Integrity

### Foreign Key Constraints

**Enable in SQLite**:
```python
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
```

**PostgreSQL** (enabled by default):
```sql
ALTER TABLE messages
ADD CONSTRAINT fk_session
FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
ON DELETE CASCADE;
```

### Data Validation

**Pydantic Schemas**:
```python
from pydantic import BaseModel, EmailStr, validator

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    
    @validator('username')
    def username_alphanumeric(cls, v):
        assert v.isalnum(), 'must be alphanumeric'
        return v
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('must be at least 8 characters')
        return v
```

### Verify FAISS-Metadata Integrity

```python
def verify_index_metadata_correspondence():
    """Verify FAISS index and metadata are in sync"""
    import faiss
    import pandas as pd
    
    # Load index and metadata
    index = faiss.read_index('app/db/faiss_index/index.faiss')
    metadata = pd.read_parquet('app/db/faiss_index/metadata.parquet')
    
    # Check counts match
    assert index.ntotal == len(metadata), \
        f"Mismatch: FAISS has {index.ntotal} vectors, metadata has {len(metadata)} rows"
    
    print(f"✅ Verified: {index.ntotal} vectors matched with metadata")
    return True
```

---

## Monitoring

### Database Size

**SQLite**:
```powershell
# Get file size
(Get-Item chattax.db).Length / 1MB
```

**PostgreSQL**:
```sql
SELECT pg_size_pretty(pg_database_size('chattax'));
```

### Query Performance

**Log Slow Queries**:
```python
# app/db/database.py
import logging
from sqlalchemy import event

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Log queries taking > 1 second
@event.listens_for(engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(engine, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, params, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop()
    if total > 1.0:
        logging.warning(f"Slow query ({total:.2f}s): {statement}")
```

### FAISS Memory Usage

```python
import faiss
import sys

index = faiss.read_index('app/db/faiss_index/index.faiss')
size_bytes = sys.getsizeof(index)
print(f"FAISS index size: {size_bytes / 1024 / 1024:.2f} MB")
```

---

## Security

### Database Credentials

**Never commit credentials**:
```env
# .env (gitignored)
DATABASE_URL=postgresql://secure_user:secure_password@localhost/chattax
```

**Use environment variables**:
```python
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
```

### SQL Injection Prevention

**Use parameterized queries (SQLAlchemy ORM is safe)**:
```python
# ✅ Safe: SQLAlchemy ORM
user = db.query(User).filter(User.username == username).first()

# ✅ Safe: Parameterized query
result = db.execute("SELECT * FROM users WHERE username = :username", {"username": username})

# ❌ NEVER: String concatenation
# result = db.execute(f"SELECT * FROM users WHERE username = '{username}'")
```

### Backup Encryption

```powershell
# Encrypt backup with 7-Zip
7z a -p -mhe=on chattax_backup.7z chattax.db

# Or use GPG
gpg -c chattax.db  # Creates chattax.db.gpg
```

---

## Troubleshooting

### "database is locked" (SQLite)

**Cause**: Multiple processes accessing SQLite simultaneously

**Solution**:
```python
# Increase timeout
engine = create_engine(
    'sqlite:///./chattax.db',
    connect_args={'timeout': 30}  # Wait 30 seconds
)
```

### Connection Pool Exhausted

**Symptoms**: "TimeoutError: QueuePool limit exceeded"

**Solution**:
```python
# Increase pool size
engine = create_engine(
    DATABASE_URL,
    pool_size=10,      # Increase from default 5
    max_overflow=20    # Increase from default 10
)
```

### FAISS Index Not Found

**Error**: `FileNotFoundError: index.faiss`

**Solution**:
```powershell
# Verify files exist
Test-Path app/db/faiss_index/index.faiss
Test-Path app/db/faiss_index/metadata.parquet

# If missing, restore from backup or rebuild index
```

### Metadata Load Failure (PyArrow)

**Error**: `ModuleNotFoundError: No module named 'pyarrow'`

**Solution**:
```powershell
pip install pyarrow

# If wheel build fails on Windows, try:
pip install pyarrow --prefer-binary
```

---

## Next Steps

- [Configuration Guide](../01-getting-started/configuration.md)
- [Testing Database](../04-development/testing.md#database-integration)
- [Troubleshooting](../06-troubleshooting/common-issues.md)
