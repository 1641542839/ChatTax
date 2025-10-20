# ChatTax
Australian Smart Tax Assistant

## Project Overview
This is a local-first RAG (Retrieval-Augmented Generation) pipeline project for intelligent tax assistance.

## Directory Layout
```
./data/raw          - Raw input documents and files
./data/raw_files    - Additional raw file storage
./data/parsed       - Parsed document content
./data/tables       - Extracted table data
./data/chunks.jsonl - Document chunks for retrieval
./data/faiss_index  - FAISS vector index for similarity search
```

## Quick Start

### 1. Create a Virtual Environment
```bash
python -m venv venv
```

### 2. Activate the Virtual Environment
**On Linux/macOS:**
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

### 4. Create Data Directories
**On Linux/macOS:**
```bash
mkdir -p data/raw data/raw_files data/parsed data/tables data/faiss_index
touch data/chunks.jsonl
```

**On Windows:**
```bash
mkdir data\raw data\raw_files data\parsed data\tables data\faiss_index 2>nul
type nul > data\chunks.jsonl
```
