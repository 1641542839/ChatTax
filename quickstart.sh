#!/usr/bin/env bash
# Quick start script for ChatTax

set -e

echo "╔═══════════════════════════════════════╗"
echo "║   ChatTax Quick Start                 ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version || { echo "Error: Python 3 is required"; exit 1; }

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. To crawl documents:       python crawler.py"
echo "2. To parse HTML:            python html_to_md.py"
echo "3. To parse PDF/DOCX:        python pdf_docx_parser.py"
echo "4. To chunk documents:       python chunker.py"
echo "5. To summarize tables:      python table_summary.py"
echo "6. To create embeddings:     python embedder.py"
echo "7. To start the web app:     python app.py"
echo ""
echo "Or visit http://localhost:5000 after starting the app"
echo ""
