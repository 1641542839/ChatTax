# ChatTax
Australian Smart Tax Assistant

A RAG (Retrieval Augmented Generation) system for searching and querying Australian tax documents from the ATO (Australian Taxation Office).

## Features

- **Web Crawler**: Automatically crawls and downloads tax documents from ATO website
- **Document Parsing**: Extracts text and tables from HTML, PDF, and DOCX files
- **Smart Chunking**: Intelligently chunks documents for optimal retrieval
- **Table Extraction**: Extracts and summarizes tabular data
- **Vector Search**: Uses FAISS for fast semantic search
- **Web Interface**: Flask-based web UI for easy querying

## Project Structure

```
project/
├─ data/
│  ├─ raw/                 # raw html files: ./data/raw/YYYYMMDD/...
│  ├─ raw_files/           # raw pdf/docx/attachments
│  ├─ parsed/              # parsed JSON per doc
│  ├─ tables/              # csvs from tables
│  ├─ chunks.jsonl         # chunk lines (ready for embedding)
│  └─ faiss_index/         # faiss index + metadata
├─ scripts/
├─ crawler.py              # Web crawler for ATO documents
├─ html_to_md.py          # HTML to Markdown converter
├─ pdf_docx_parser.py     # PDF/DOCX parser
├─ chunker.py             # Document chunker
├─ table_summary.py       # Table summarizer
├─ embedder.py            # Embedding and FAISS index builder
├─ app.py                 # Main Flask application
└─ requirements.txt       # Python dependencies
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/1641542839/ChatTax.git
cd ChatTax
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. (Optional) Set up OpenAI API key for embeddings:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

## Usage

### Full Pipeline

Run the complete data processing pipeline:

```bash
# 1. Crawl tax documents
python crawler.py

# 2. Convert HTML to Markdown
python html_to_md.py

# 3. Parse PDF/DOCX files (if any)
python pdf_docx_parser.py

# 4. Chunk documents
python chunker.py

# 5. Summarize tables
python table_summary.py

# 6. Create embeddings and build FAISS index
python embedder.py --model sentence-transformers

# 7. Start the web application
python app.py
```

### Individual Components

**Crawler:**
```bash
python crawler.py
```

**HTML to Markdown Conversion:**
```bash
python html_to_md.py
```

**Document Parsing:**
```bash
python pdf_docx_parser.py
```

**Chunking:**
```bash
python chunker.py
```

**Table Summarization:**
```bash
python table_summary.py
```

**Embeddings:**
```bash
# Using sentence transformers (free, local)
python embedder.py --model sentence-transformers

# Using OpenAI (requires API key)
python embedder.py --model openai
```

**Search (CLI):**
```bash
python embedder.py --search "What are the tax rates for 2024?"
```

**Web Application:**
```bash
python app.py
# Then open http://localhost:5000 in your browser
```

## API Endpoints

- `GET /` - Web interface
- `GET /health` - Health check
- `POST /search` - Search documents
  ```json
  {
    "query": "your question",
    "k": 5
  }
  ```
- `GET /stats` - Index statistics

## Configuration

Create a `.env` file for configuration:

```env
# OpenAI API Key (optional, for OpenAI embeddings)
OPENAI_API_KEY=your-key-here

# Flask configuration
PORT=5000
DEBUG=False
```

## Development

The project uses:
- **Flask** for the web framework
- **BeautifulSoup** for HTML parsing
- **FAISS** for vector search
- **Sentence Transformers** for embeddings (default)
- **OpenAI API** for embeddings (optional)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Disclaimer

This tool is for informational purposes only. Always consult with a qualified tax professional for official tax advice.
