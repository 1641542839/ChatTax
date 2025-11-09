# Testing Guide

Comprehensive testing guide for ChatTax Backend.

## Test Categories

### 1. Manual Testing
### 2. Unit Testing
### 3. Integration Testing
### 4. API Testing
### 5. Performance Testing

---

## Manual Testing

### Quick Health Check

```powershell
# 1. Start server
cd Backend
uvicorn main:app --reload

# 2. Test health endpoint
curl http://localhost:8000/health

# Expected: {"status": "healthy"}
```

### RAG Query Test

```powershell
curl -X POST "http://localhost:8000/api/chat/query" `
  -H "Content-Type: application/json" `
  -d '{
    "question": "What is the tax-free threshold in Australia?",
    "user_type": "individual",
    "top_k": 3
  }'
```

**Expected Response**:
- `answer` field contains Australian tax information
- `sources` array has 3 documents
- Each source has `source_url` pointing to ATO website
- `confidence` score between 0.7-1.0

### Authentication Flow Test

```powershell
# 1. Register user
curl -X POST "http://localhost:8000/api/auth/register" `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123!",
    "full_name": "Test User"
  }'

# 2. Login
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
  -Method Post `
  -Body @{username="testuser"; password="TestPassword123!"}

$token = $response.access_token

# 3. Get user info
curl "http://localhost:8000/api/auth/me" `
  -H "Authorization: Bearer $token"
```

### Checklist Generation Test

```powershell
curl -X POST "http://localhost:8000/api/checklist/generate" `
  -H "Content-Type: application/json" `
  -d '{
    "user_id": 1,
    "identity_info": {
      "employment_status": "employed",
      "income_sources": ["salary", "investment"],
      "has_dependents": true,
      "location": "NSW"
    }
  }'
```

**Expected Response**:
- Returns 8-12 items (moderate complexity)
- Items have Australian tax context
- Categories include "documents", "accounts", "records"

---

## Unit Testing

### Setup

```powershell
pip install pytest pytest-cov pytest-mock
```

### Test Structure

```
Backend/tests/
├── __init__.py
├── test_auth_service.py
├── test_vector_store_service.py
├── test_llm_service.py
└── test_reranker_service.py
```

### Example Unit Test

Create `tests/test_vector_store_service.py`:

```python
import pytest
from app.services.vector_store_service import VectorStoreService

@pytest.fixture
def vector_service():
    return VectorStoreService()

def test_search_returns_results(vector_service):
    """Test that search returns non-empty results"""
    results = vector_service.search("tax deductions", top_k=3)
    
    assert len(results) == 3
    assert all('text' in r for r in results)
    assert all('relevance_score' in r for r in results)

def test_search_relevance_scores(vector_service):
    """Test that relevance scores are sorted"""
    results = vector_service.search("home office", top_k=5)
    
    scores = [r['relevance_score'] for r in results]
    assert scores == sorted(scores, reverse=True)

def test_invalid_top_k(vector_service):
    """Test that invalid top_k raises error"""
    with pytest.raises(ValueError):
        vector_service.search("query", top_k=0)
```

### Run Unit Tests

```powershell
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_vector_store_service.py

# Run specific test function
pytest tests/test_vector_store_service.py::test_search_returns_results

# Verbose output
pytest -v

# Show print statements
pytest -s
```

### Mock External Services

```python
import pytest
from unittest.mock import Mock, patch
from app.services.llm_service import LLMService

@patch('app.services.llm_service.ChatOpenAI')
def test_generate_answer_with_mock(mock_openai):
    """Test answer generation with mocked OpenAI"""
    # Setup mock
    mock_llm = Mock()
    mock_llm.invoke.return_value.content = "Mocked answer"
    mock_openai.return_value = mock_llm
    
    # Test
    service = LLMService()
    answer = service.generate_answer("test question", [])
    
    assert answer == "Mocked answer"
    mock_llm.invoke.assert_called_once()
```

---

## Integration Testing

### Database Integration

Create `tests/test_database_integration.py`:

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.models.user import User

@pytest.fixture
def db_session():
    """Create test database session"""
    engine = create_engine('sqlite:///./test.db')
    Base.metadata.create_all(engine)
    
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(engine)

def test_user_creation(db_session):
    """Test creating user in database"""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="hashed",
        full_name="Test User"
    )
    
    db_session.add(user)
    db_session.commit()
    
    retrieved = db_session.query(User).filter_by(username="testuser").first()
    assert retrieved.email == "test@example.com"
```

### FAISS Integration

```python
def test_faiss_index_loaded():
    """Test that FAISS index loads correctly"""
    from app.services.vector_store_service import get_vector_store_service
    
    service = get_vector_store_service()
    
    assert service.faiss_index is not None
    assert service.metadata is not None
    assert len(service.metadata) > 0
```

---

## API Testing

### Using FastAPI TestClient

Create `tests/test_api.py`:

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_query_endpoint():
    """Test RAG query endpoint"""
    response = client.post("/api/chat/query", json={
        "question": "What is the tax-free threshold?",
        "user_type": "individual",
        "top_k": 3
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
    assert len(data["sources"]) <= 3

def test_query_invalid_input():
    """Test query with invalid input"""
    response = client.post("/api/chat/query", json={
        "question": "",  # Empty question
        "top_k": 3
    })
    
    assert response.status_code == 422  # Validation error

def test_register_user():
    """Test user registration"""
    response = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "Password123!",
        "full_name": "New User"
    })
    
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"

def test_login_user():
    """Test user login"""
    # First register
    client.post("/api/auth/register", json={
        "email": "login@example.com",
        "username": "loginuser",
        "password": "Password123!",
        "full_name": "Login User"
    })
    
    # Then login
    response = client.post("/api/auth/login", data={
        "username": "loginuser",
        "password": "Password123!"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
```

### Run API Tests

```powershell
pytest tests/test_api.py -v
```

---

## Performance Testing

### Load Testing with Locust

Install Locust:
```powershell
pip install locust
```

Create `locustfile.py`:

```python
from locust import HttpUser, task, between

class ChatTaxUser(HttpUser):
    wait_time = between(1, 3)  # Wait 1-3s between requests
    
    @task(3)
    def query_endpoint(self):
        """Test RAG query endpoint (weight: 3)"""
        self.client.post("/api/chat/query", json={
            "question": "What are tax deductions?",
            "user_type": "individual",
            "top_k": 3
        })
    
    @task(1)
    def health_check(self):
        """Test health endpoint (weight: 1)"""
        self.client.get("/health")
    
    @task(1)
    def stats_endpoint(self):
        """Test stats endpoint (weight: 1)"""
        self.client.get("/api/chat/stats")
```

Run load test:
```powershell
locust -f locustfile.py --host=http://localhost:8000
```

Open browser: http://localhost:8089

**Test Scenarios**:
- **Light Load**: 10 users, 2 spawn rate
- **Moderate Load**: 50 users, 5 spawn rate
- **Heavy Load**: 100 users, 10 spawn rate

**Metrics to Monitor**:
- Response time (P50, P95, P99)
- Requests per second (RPS)
- Failure rate
- CPU/memory usage

### Benchmark FAISS Search

Create `benchmark_faiss.py`:

```python
import time
import numpy as np
from app.services.vector_store_service import get_vector_store_service

def benchmark_search():
    service = get_vector_store_service()
    
    queries = [
        "tax deductions",
        "home office expenses",
        "capital gains tax",
        "superannuation contributions",
        "rental property income"
    ]
    
    times = []
    for query in queries:
        start = time.time()
        results = service.search(query, top_k=5)
        elapsed = time.time() - start
        times.append(elapsed)
        print(f"{query}: {elapsed*1000:.2f}ms")
    
    print(f"\nAverage: {np.mean(times)*1000:.2f}ms")
    print(f"P95: {np.percentile(times, 95)*1000:.2f}ms")
    print(f"P99: {np.percentile(times, 99)*1000:.2f}ms")

if __name__ == "__main__":
    benchmark_search()
```

Run benchmark:
```powershell
python benchmark_faiss.py
```

---

## Troubleshooting Tests

### Import Errors

```powershell
# Add Backend to PYTHONPATH
$env:PYTHONPATH = "$PWD;$env:PYTHONPATH"

# Or use pytest with src layout
pytest --import-mode=importlib
```

### Database Conflicts

```python
# Use separate test database
@pytest.fixture
def db_session():
    engine = create_engine('sqlite:///./test.db')  # Not chattax.db
    # ... rest of fixture
```

### OpenAI API Costs

```python
# Mock OpenAI calls in tests
@pytest.fixture(autouse=True)
def mock_openai():
    with patch('app.services.llm_service.ChatOpenAI') as mock:
        mock_llm = Mock()
        mock_llm.invoke.return_value.content = "Test answer"
        mock.return_value = mock_llm
        yield mock
```

### Slow Tests

```python
# Mark slow tests
@pytest.mark.slow
def test_expensive_operation():
    # ...

# Run without slow tests
# pytest -m "not slow"
```

---

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r Backend/requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        SECRET_KEY: test-secret-key
      run: |
        cd Backend
        pytest --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

---

## Test Coverage

### Generate Coverage Report

```powershell
pytest --cov=app --cov-report=html
```

Open `htmlcov/index.html` in browser.

**Target Coverage**:
- Overall: > 80%
- Services: > 90%
- Routers: > 75%
- Models: > 95%

---

## Next Steps

- [Deployment Guide](./deployment.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Contributing Guidelines](./contributing.md)
