"""
ChatTax - Australian Smart Tax Assistant
Main application with Flask API and query interface.
"""

import os
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from embedder import DocumentEmbedder
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize embedder
embedder = DocumentEmbedder()

# HTML template for web interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>ChatTax - Australian Tax Assistant</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
        }
        .search-box {
            margin: 20px 0;
        }
        input[type="text"] {
            width: 70%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 5px;
        }
        button {
            padding: 12px 30px;
            font-size: 16px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
        }
        button:hover {
            background-color: #2980b9;
        }
        .results {
            margin-top: 30px;
        }
        .result-item {
            background-color: #f9f9f9;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #3498db;
            border-radius: 5px;
        }
        .result-meta {
            color: #7f8c8d;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .result-text {
            line-height: 1.6;
        }
        .loading {
            text-align: center;
            color: #7f8c8d;
            display: none;
        }
        .error {
            color: #e74c3c;
            padding: 10px;
            background-color: #fadbd8;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧾 ChatTax - Australian Tax Assistant</h1>
        <p style="text-align: center; color: #7f8c8d;">
            Search Australian tax documents and get instant answers
        </p>
        
        <div class="search-box">
            <input type="text" id="query" placeholder="Ask a tax question..." 
                   onkeypress="if(event.key === 'Enter') search()">
            <button onclick="search()">Search</button>
        </div>
        
        <div class="loading" id="loading">Searching...</div>
        <div id="error"></div>
        <div class="results" id="results"></div>
    </div>
    
    <script>
        async function search() {
            const query = document.getElementById('query').value;
            const resultsDiv = document.getElementById('results');
            const loadingDiv = document.getElementById('loading');
            const errorDiv = document.getElementById('error');
            
            if (!query.trim()) {
                return;
            }
            
            // Show loading
            loadingDiv.style.display = 'block';
            resultsDiv.innerHTML = '';
            errorDiv.innerHTML = '';
            
            try {
                const response = await fetch('/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: query, k: 5 })
                });
                
                const data = await response.json();
                
                loadingDiv.style.display = 'none';
                
                if (data.error) {
                    errorDiv.innerHTML = `<div class="error">${data.error}</div>`;
                    return;
                }
                
                if (data.results.length === 0) {
                    resultsDiv.innerHTML = '<p>No results found.</p>';
                    return;
                }
                
                // Display results
                let html = '<h2>Search Results</h2>';
                data.results.forEach((result, index) => {
                    html += `
                        <div class="result-item">
                            <div class="result-meta">
                                <strong>Result ${index + 1}</strong> | 
                                Relevance Score: ${result.relevance.toFixed(4)} |
                                Source: ${result.source}
                            </div>
                            <div class="result-text">${escapeHtml(result.text)}</div>
                        </div>
                    `;
                });
                
                resultsDiv.innerHTML = html;
                
            } catch (error) {
                loadingDiv.style.display = 'none';
                errorDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML.replace(/\\n/g, '<br>');
        }
    </script>
</body>
</html>
"""


@app.route('/')
def index():
    """Serve the main web interface."""
    return render_template_string(HTML_TEMPLATE)


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'ChatTax API'
    })


@app.route('/search', methods=['POST'])
def search():
    """
    Search for relevant documents.
    
    Request body:
        {
            "query": "tax question",
            "k": 5  // number of results
        }
    
    Returns:
        {
            "query": "...",
            "results": [
                {
                    "text": "...",
                    "source": "...",
                    "relevance": 0.95
                }
            ]
        }
    """
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400
        
        query = data['query']
        k = data.get('k', 5)
        
        # Search using embedder
        results = embedder.search(query, k=k)
        
        # Format results
        formatted_results = []
        for chunk, distance in results:
            formatted_results.append({
                'text': chunk['text'],
                'source': chunk.get('source_document', 'Unknown'),
                'relevance': 1 / (1 + distance),  # Convert distance to relevance score
                'metadata': chunk.get('metadata', {})
            })
        
        return jsonify({
            'query': query,
            'results': formatted_results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/pipeline/run', methods=['POST'])
def run_pipeline():
    """
    Run the full data pipeline.
    
    Request body:
        {
            "steps": ["crawl", "parse", "chunk", "embed"]  // optional, runs all if not specified
        }
    """
    try:
        data = request.get_json() or {}
        steps = data.get('steps', ['crawl', 'parse', 'chunk', 'embed'])
        
        results = {}
        
        if 'crawl' in steps:
            results['crawl'] = 'Crawling not implemented in API mode'
        
        if 'parse' in steps:
            results['parse'] = 'Parsing not implemented in API mode'
        
        if 'chunk' in steps:
            results['chunk'] = 'Chunking not implemented in API mode'
        
        if 'embed' in steps:
            results['embed'] = 'Embedding not implemented in API mode'
        
        return jsonify({
            'status': 'completed',
            'steps': results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/stats')
def stats():
    """Get statistics about the indexed documents."""
    try:
        index_dir = "./data/faiss_index"
        
        # Check if index exists
        index_path = os.path.join(index_dir, 'faiss.index')
        chunks_path = os.path.join(index_dir, 'chunks.jsonl')
        
        if not os.path.exists(index_path):
            return jsonify({
                'status': 'no_index',
                'message': 'No index found. Please build the index first.'
            })
        
        # Count chunks
        num_chunks = 0
        if os.path.exists(chunks_path):
            with open(chunks_path, 'r', encoding='utf-8') as f:
                num_chunks = sum(1 for line in f if line.strip())
        
        return jsonify({
            'status': 'indexed',
            'num_chunks': num_chunks,
            'index_location': index_path
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def main():
    """Run the Flask application."""
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    print(f"""
    ╔═══════════════════════════════════════╗
    ║   ChatTax - Australian Tax Assistant  ║
    ╚═══════════════════════════════════════╝
    
    Server running on: http://localhost:{port}
    
    API Endpoints:
    - GET  /           - Web interface
    - GET  /health     - Health check
    - POST /search     - Search documents
    - GET  /stats      - Index statistics
    
    Press Ctrl+C to stop
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)


if __name__ == "__main__":
    main()
