# Common Issues and Solutions

Comprehensive troubleshooting guide for ChatTax Backend.

## Quick Diagnostic Checklist

Before diving into specific issues, run these quick checks:

```powershell
# 1. Check Python version
python --version  # Should be 3.8+

# 2. Check virtual environment
Get-Command python  # Should point to venv\Scripts\python.exe

# 3. Verify dependencies
pip list | Select-String "fastapi|openai|faiss"

# 4. Check environment variables
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('SECRET_KEY:', os.getenv('SECRET_KEY')[:10] if os.getenv('SECRET_KEY') else 'MISSING'); print('OPENAI_API_KEY:', os.getenv('OPENAI_API_KEY')[:10] if os.getenv('OPENAI_API_KEY') else 'MISSING')"

# 5. Test FAISS index
python -c "import faiss; idx = faiss.read_index('app/db/faiss_index/index.faiss'); print(f'Vectors: {idx.ntotal}')"
```

---

## Installation Issues

### PyArrow Installation Failure

**Error**:
```
error: Microsoft Visual C++ 14.0 or greater is required
Failed to build installable wheels for pyarrow
```

**Cause**: PyArrow requires compilation on Windows, especially with Python 3.13

**Solutions**:

1. **Use precompiled wheel**:
```powershell
pip install pyarrow --prefer-binary --only-binary=:all:
```

2. **Try older pyarrow version**:
```powershell
pip install pyarrow==12.0.1
```

3. **Downgrade Python** (recommended):
```powershell
# Uninstall Python 3.13
# Install Python 3.11 or 3.12 from python.org
python --version  # Verify version
```

4. **Install Microsoft C++ Build Tools**:
   - Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Install "Desktop development with C++"

5. **Use CSV fallback**:
```python
# Modify app/services/vector_store_service.py
# Replace:
self.metadata = pd.read_parquet(metadata_file)
# With:
self.metadata = pd.read_csv(metadata_file.replace('.parquet', '.csv'))

# Convert metadata.parquet to CSV:
python -c "import pandas as pd; df = pd.read_parquet('app/db/faiss_index/metadata.parquet'); df.to_csv('app/db/faiss_index/metadata.csv', index=False)"
```

### FAISS-CPU Installation Issues

**Error**: `No module named 'faiss'`

**Solution**:
```powershell
# Install CPU version
pip install faiss-cpu

# If error persists, try specific version
pip install faiss-cpu==1.9.0
```

### Dependency Conflicts

**Error**: `ERROR: pip's dependency resolver does not currently take into account all the packages that are installed`

**Solution**:
```powershell
# Create fresh virtual environment
Remove-Item -Recurse venv
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies one by one
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Server Startup Issues

### Port Already in Use

**Error**: `[ERROR] [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)`

**Solution**:
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port
uvicorn main:app --reload --port 8001
```

### Import Errors

**Error**: `ModuleNotFoundError: No module named 'app'`

**Solution**:
```powershell
# Ensure you're in Backend directory
cd Backend

# Add current directory to PYTHONPATH
$env:PYTHONPATH = "$PWD;$env:PYTHONPATH"

# Run server
uvicorn main:app --reload
```

### FAISS Index Not Found

**Error**: `FileNotFoundError: [Errno 2] No such file or directory: 'app/db/faiss_index/index.faiss'`

**Diagnosis**:
```powershell
# Check if files exist
Test-Path app/db/faiss_index/index.faiss
Test-Path app/db/faiss_index/metadata.parquet
```

**Solutions**:

1. **Files missing**: Restore from backup or rebuild index
2. **Wrong working directory**:
```powershell
# Ensure you're in Backend directory when running
cd Backend
uvicorn main:app --reload
```

3. **Path issue**:
```python
# Check in vector_store_service.py
import os
print(os.getcwd())  # Should be Backend/
```

### Database Connection Errors

**Error**: `sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) unable to open database file`

**Solution**:
```powershell
# Ensure database directory is writable
New-Item -ItemType Directory -Force -Path .

# Check file permissions
Get-Acl chattax.db

# Delete and recreate
Remove-Item chattax.db
# Restart server - will recreate database
```

---

## Runtime Errors

### OpenAI API Errors

#### Invalid API Key

**Error**: `openai.error.AuthenticationError: Incorrect API key provided`

**Solution**:
```powershell
# Verify API key in .env
Get-Content .env | Select-String "OPENAI_API_KEY"

# Test API key
python -c "import openai; openai.api_key='your-key'; print(openai.Model.list())"

# Regenerate key at: https://platform.openai.com/api-keys
```

#### Rate Limit Exceeded

**Error**: `openai.error.RateLimitError: Rate limit reached`

**Solutions**:

1. **Add retry logic**:
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def call_openai():
    return llm.invoke(prompt)
```

2. **Reduce request rate**: Add delay between requests
3. **Upgrade OpenAI plan**: Check limits at https://platform.openai.com/account/limits

#### Insufficient Credits

**Error**: `openai.error.RateLimitError: You exceeded your current quota`

**Solution**: Add credits to your OpenAI account at https://platform.openai.com/account/billing

### FAISS Search Errors

#### Empty Results

**Symptom**: `sources` array is empty in response

**Diagnosis**:
```python
# Test FAISS search directly
from app.services.vector_store_service import get_vector_store_service

service = get_vector_store_service()
results = service.search("test query", top_k=5)
print(len(results))  # Should be 5
```

**Solutions**:

1. **Index not loaded properly**:
```python
# Check index stats
print(f"Total vectors: {service.faiss_index.ntotal}")  # Should be 3246
```

2. **Embedding model mismatch**:
```python
# Verify same embedding model used for indexing and querying
print(service.embedder.get_sentence_embedding_dimension())  # Should be 384
```

#### Low Relevance Scores

**Symptom**: All relevance scores < 0.5

**Solutions**:

1. **Query too vague**: Make query more specific
2. **Check normalization**:
```python
# Ensure vectors are L2 normalized
import faiss
faiss.normalize_L2(query_vector)
```

3. **Increase top_k**: Retrieve more candidates

### Memory Errors

**Error**: `MemoryError: Unable to allocate array`

**Solutions**:

1. **Reduce batch size**: Process fewer documents at once
2. **Use memory-efficient index**:
```python
# Instead of loading full index into memory
# Use memory-mapped index
index = faiss.read_index('index.faiss', faiss.IO_FLAG_MMAP)
```

3. **Increase system RAM** or use cloud instance with more memory

---

## API Errors

### 422 Validation Error

**Error**: `422 Unprocessable Entity`

**Cause**: Invalid request body

**Example Error**:
```json
{
  "detail": [
    {
      "loc": ["body", "question"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Solution**: Check request matches schema:
```json
{
  "question": "What are tax deductions?",  // Required
  "user_type": "individual",               // Optional, default "individual"
  "top_k": 3                                // Optional, default 3
}
```

### 401 Unauthorized

**Error**: `401 Unauthorized: Could not validate credentials`

**Solutions**:

1. **Missing token**:
```bash
# Include Authorization header
curl -H "Authorization: Bearer <your-token>" http://localhost:8000/api/auth/me
```

2. **Expired token**:
```powershell
# Login again to get new token
Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method Post -Body @{username="user"; password="pass"}
```

3. **Invalid token**: Check SECRET_KEY hasn't changed

### 500 Internal Server Error

**Error**: `500 Internal Server Error`

**Diagnosis**:
```powershell
# Check server logs in terminal
# Look for Python traceback
```

**Common Causes**:

1. **Database connection failure**: Check DATABASE_URL
2. **OpenAI API error**: Verify API key and credits
3. **FAISS index corrupted**: Restore from backup
4. **Unhandled exception**: Check logs for stack trace

### CORS Errors (Browser)

**Error**: `Access to fetch at 'http://localhost:8000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution**:
```env
# Add frontend URL to .env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Restart server after changing .env
```

**Verify CORS configuration**:
```python
# In main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Check this matches frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Performance Issues

### Slow Query Response

**Symptom**: RAG queries take > 5 seconds

**Diagnosis**:
```python
import time

start = time.time()
# Your query
elapsed = time.time() - start
print(f"Query took {elapsed:.2f}s")
```

**Solutions**:

1. **Disable reranking** for faster responses:
```json
{
  "question": "...",
  "use_reranking": false
}
```

2. **Reduce top_k**:
```json
{
  "question": "...",
  "top_k": 3  // Instead of 5 or 10
}
```

3. **Check OpenAI response time**: Most delay is from OpenAI API
4. **Use faster model**: Switch from gpt-4 to gpt-4o-mini (already default)

### High Memory Usage

**Symptom**: Python process using > 2GB RAM

**Diagnosis**:
```powershell
# Monitor memory
Get-Process python | Select-Object ProcessName, @{Name="Memory(MB)";Expression={$_.WS / 1MB}}
```

**Solutions**:

1. **FAISS index in memory**: Expected (~5MB for 3,246 vectors)
2. **Embedder model cached**: Expected (~80MB)
3. **Memory leak**: Restart server periodically
4. **Too many connections**: Reduce `pool_size` in database config

### Slow FAISS Search

**Symptom**: FAISS search takes > 100ms

**Diagnosis**:
```python
import time
start = time.time()
distances, indices = index.search(query_vector, k=5)
print(f"FAISS search: {(time.time() - start) * 1000:.2f}ms")
```

**Expected**: 5-10ms for 3,246 vectors

**Solutions**:

1. **Index not loaded**: Verify index loads on startup
2. **CPU throttling**: Check CPU usage
3. **Too many vectors**: Consider IVF index for larger datasets

---

## Data Issues

### Incorrect Answers

**Symptom**: AI provides wrong or irrelevant answers

**Diagnosis**:

1. **Check sources**:
```json
// In response, verify sources are relevant
{
  "sources": [
    {
      "source_url": "https://www.ato.gov.au/...",  // Should be ATO
      "relevance_score": 0.89  // Should be > 0.6
    }
  ]
}
```

2. **Test with known query**:
```json
{
  "question": "What is the tax-free threshold in Australia?"
}
// Expected: Answer about $18,200
```

**Solutions**:

1. **Low relevance scores**: Query may be too broad or outside tax domain
2. **Wrong context**: Check retrieved sources match question intent
3. **Model hallucination**: Increase temperature to 0.1 for more factual responses
4. **Outdated index**: Rebuild with latest tax documents

### Missing Sources

**Symptom**: `sources` array is empty

**Diagnosis**:
```python
# Test vector store directly
from app.services.vector_store_service import get_vector_store_service

service = get_vector_store_service()
print(f"Index loaded: {service.faiss_index is not None}")
print(f"Metadata loaded: {service.metadata is not None}")
print(f"Document count: {len(service.metadata) if service.metadata is not None else 0}")
```

**Solutions**:

1. **Index not initialized**: Check logs for FAISS load errors
2. **Metadata file missing**: Verify `metadata.parquet` exists
3. **PyArrow not installed**: Install with `pip install pyarrow`

### Checklist Too Generic

**Symptom**: Generated checklist doesn't match user profile

**Solutions**:

1. **Provide more detail in `identity_info`**:
```json
{
  "employment_status": "employed",
  "income_sources": ["salary", "investment", "rental"],
  "has_dependents": true,
  "has_investment": true,
  "has_rental_property": true,
  "additional_info": {
    "industry": "technology",
    "location": "NSW",
    "first_time_buyer": true
  }
}
```

2. **Adjust LLM temperature**: Edit `llm_service.py` temperature setting
3. **Refine prompt**: Update checklist generation prompt in `llm_service.py`

---

## Environment Issues

### .env File Not Loading

**Symptom**: Environment variables not found

**Diagnosis**:
```python
import os
from dotenv import load_dotenv

load_dotenv()
print(os.getenv('OPENAI_API_KEY'))  # Should print key
```

**Solutions**:

1. **File location**: Ensure `.env` is in Backend/ directory
2. **File name**: Check it's exactly `.env` (not `.env.txt`)
3. **File encoding**: Use UTF-8 encoding
4. **Manual load**:
```python
from dotenv import load_dotenv
load_dotenv('.env')  # Explicit path
```

### Wrong Python Version

**Symptom**: Syntax errors or import errors

**Diagnosis**:
```powershell
python --version
Get-Command python  # Should point to venv
```

**Solution**:
```powershell
# Deactivate current environment
deactivate

# Remove old venv
Remove-Item -Recurse venv

# Create new venv with correct Python
python3.11 -m venv venv  # Or python3.12
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Debugging Tips

### Enable Debug Logging

```python
# In main.py
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Test Individual Components

```python
# Test embedding
from app.services.vector_store_service import get_vector_store_service
service = get_vector_store_service()
embedding = service.embedder.encode(["test"])
print(embedding.shape)  # Should be (1, 384)

# Test FAISS search
distances, indices = service.faiss_index.search(embedding, k=3)
print(distances, indices)

# Test metadata lookup
meta = service.metadata.iloc[indices[0][0]]
print(meta['source_url'])

# Test OpenAI
from app.services.llm_service import LLMService
llm_service = LLMService()
response = llm_service.generate_answer("test question", [])
print(response)
```

### Use Interactive Docs

1. Open http://localhost:8000/docs
2. Test each endpoint individually
3. View request/response examples
4. Check validation errors

### Check Logs

```powershell
# Terminal logs show:
# - API requests
# - Errors with stack traces
# - FAISS load status
# - Database queries (if SQL logging enabled)
```

---

## Getting Help

### Before Asking for Help

Provide this information:

1. **Python version**: `python --version`
2. **Dependency versions**: `pip list`
3. **Error message**: Full traceback
4. **Steps to reproduce**: Exact commands run
5. **Environment**: Windows/Linux/Mac, development/production
6. **Logs**: Server logs from terminal

### Useful Resources

- [Installation Guide](../01-getting-started/installation.md)
- [Configuration Guide](../01-getting-started/configuration.md)
- [API Documentation](../03-api/endpoints.md)
- [Database Management](../05-database/database-management.md)

---

## Emergency Fixes

### Nuclear Option: Complete Reset

```powershell
# 1. Stop server (Ctrl+C)

# 2. Remove virtual environment
Remove-Item -Recurse venv

# 3. Remove database
Remove-Item chattax.db

# 4. Create fresh environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 5. Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 6. Verify FAISS index
python -c "import faiss; idx = faiss.read_index('app/db/faiss_index/index.faiss'); print(f'Vectors: {idx.ntotal}')"

# 7. Configure .env
Copy-Item .env.example .env
# Edit .env with your keys

# 8. Start server
uvicorn main:app --reload
```

### Quick Sanity Check

```powershell
# Run this to verify everything works
python -c "
from app.services.vector_store_service import get_vector_store_service
from app.services.llm_service import LLMService
import os
from dotenv import load_dotenv

load_dotenv()

print('1. Environment variables...')
assert os.getenv('SECRET_KEY'), 'SECRET_KEY missing'
assert os.getenv('OPENAI_API_KEY'), 'OPENAI_API_KEY missing'
print('   ✅ OK')

print('2. FAISS index...')
service = get_vector_store_service()
assert service.faiss_index.ntotal == 3246, f'Expected 3246 vectors, got {service.faiss_index.ntotal}'
print('   ✅ OK')

print('3. Metadata...')
assert len(service.metadata) == 3246, f'Expected 3246 rows, got {len(service.metadata)}'
print('   ✅ OK')

print('4. Embedder...')
test_emb = service.embedder.encode(['test'])
assert test_emb.shape == (1, 384), f'Expected (1, 384), got {test_emb.shape}'
print('   ✅ OK')

print('\n✅ All checks passed! Server should start successfully.')
"
```
