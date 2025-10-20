# ChatTax
Australian Smart Tax Assistant

## Overview
A local-first RAG (Retrieval-Augmented Generation) pipeline for tax document processing and question answering.

## Directory Layout
```
./data/raw          # Raw data files (original documents)
./data/raw_files    # Intermediate raw files
./data/parsed       # Parsed document content
./data/tables       # Extracted tables from documents
./data/chunks.jsonl # Chunked text for indexing
./data/faiss_index  # FAISS vector index for similarity search
```

## Quick Start

### 1. Create Virtual Environment
```bash
python -m venv venv
```

### 2. Activate Virtual Environment
**On Linux/Mac:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

## Requirements
- Python 3.8 or higher
- See `requirements.txt` for full list of dependencies
