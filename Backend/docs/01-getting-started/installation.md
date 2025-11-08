# Installation Guide

Complete setup instructions for ChatTax Backend.

## Prerequisites

- **Python**: 3.8 or higher (3.11 or 3.12 recommended)
- **pip**: Python package manager
- **OpenAI API Key**: Required for AI features

## Installation Steps

### 1. Clone Repository

```powershell
cd d:\Projects\project
git clone <repository-url>
cd ChatTax\Backend
```

### 2. Create Virtual Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows Command Prompt:
.\venv\Scripts\activate.bat
```

### 3. Install Dependencies

```powershell
# Upgrade pip first
python -m pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt
```

**Note**: If you encounter PyArrow installation issues on Python 3.13:
```powershell
# Try older Python version (3.11 or 3.12) or install manually
pip install pyarrow --prefer-binary
```

### 4. Configure Environment

```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env file with your settings
notepad .env
```

**Required Environment Variables**:

```env
# Security
SECRET_KEY=your-secret-key-here  # Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI API
OPENAI_API_KEY=sk-proj-your-key-here  # Get from https://platform.openai.com/api-keys

# Database (optional - defaults to SQLite)
DATABASE_URL=sqlite:///./chattax.db

# CORS (optional - defaults to localhost:3000)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 5. Verify Installation

```powershell
# Check Python version
python --version

# Verify dependencies installed
pip list

# Check FAISS index exists
Test-Path app/db/faiss_index/index.faiss
Test-Path app/db/faiss_index/metadata.parquet
```

### 6. Start Server

```powershell
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Expected Output**:
```
✅ Loaded existing FAISS index from app/db/faiss_index
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

## Access Points

Once running, you can access:

- **API**: http://localhost:8000
- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Next Steps

1. [Quick Start Guide](./quickstart.md) - Test basic functionality
2. [Configuration Guide](./configuration.md) - Advanced settings
3. [API Documentation](../03-api/endpoints.md) - Explore API endpoints

## Troubleshooting

### FAISS Index Not Found

```powershell
# Verify files exist
ls app/db/faiss_index/

# Should show:
# - index.faiss
# - metadata.parquet
```

### Import Errors

```powershell
# Ensure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### OpenAI API Errors

Check your API key in `.env`:
```powershell
# Test API key
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('OPENAI_API_KEY')[:10])"
```

### Port Already in Use

```powershell
# Use different port
uvicorn main:app --reload --port 8001

# Or kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <process-id> /F
```
