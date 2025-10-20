# Contributing to ChatTax

Thank you for your interest in contributing to ChatTax! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ChatTax.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Run the quick start: `./quickstart.sh`

## Development Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies (optional)
pip install pytest black flake8 mypy
```

## Project Structure

- `crawler.py` - Web crawler for ATO documents
- `html_to_md.py` - HTML to Markdown converter
- `pdf_docx_parser.py` - PDF/DOCX parser
- `chunker.py` - Document chunker for embeddings
- `table_summary.py` - Table extraction and summarization
- `embedder.py` - Embedding creation and FAISS indexing
- `app.py` - Flask web application
- `data/` - Data directory (excluded from git)
- `scripts/` - Custom scripts

## Coding Standards

- Follow PEP 8 style guidelines
- Write docstrings for all functions and classes
- Add type hints where appropriate
- Keep functions focused and single-purpose
- Comment complex logic

## Testing

Before submitting a PR, test your changes:

```bash
# Test individual components
python crawler.py --help
python embedder.py --help

# Test the full app
python app.py
```

## Submitting Changes

1. Ensure your code follows the coding standards
2. Update documentation if needed
3. Test your changes thoroughly
4. Commit with clear, descriptive messages
5. Push to your fork
6. Create a Pull Request

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Keep PRs focused on a single feature/fix

## Areas for Contribution

- Add support for more document formats
- Improve text extraction accuracy
- Add more sophisticated table parsing
- Enhance the web UI
- Add authentication and user management
- Implement caching for faster searches
- Add support for more embedding models
- Improve error handling and logging
- Add comprehensive tests
- Improve documentation

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the code
- Documentation improvements

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
