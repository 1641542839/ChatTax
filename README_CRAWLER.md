# ChatTax Web Crawler

A robust web crawler for the ChatTax project that recursively crawls websites while respecting robots.txt and other best practices.

## Features

- **Recursive Crawling**: Crawls websites up to a specified depth
- **Robots.txt Compliance**: Respects robots.txt directives for each domain
- **Path Restriction**: Only follows links within the same hostname and path prefix as the seed URL
- **Retry Logic**: Automatically retries failed requests up to 3 times with exponential backoff
- **Rate Limiting**: Random delays between requests to be polite to servers
- **File Downloads**: Downloads PDF, DOC, and DOCX files
- **Structured Storage**: Saves HTML and files with organized directory structure
- **Metadata Tracking**: Records comprehensive metadata in JSON Lines format
- **Progress Tracking**: Shows progress bar using tqdm (when available)
- **Configurable**: Multiple CLI flags for customization

## Installation

Install required dependencies:

```bash
pip install -r requirements.txt
```

Dependencies:
- `requests` - HTTP library for fetching pages
- `beautifulsoup4` - HTML parsing
- `tqdm` - Progress bar (optional but recommended)

## Usage

### Basic Usage

1. Create or edit `seeds.txt` with your seed URLs (one per line):

```
# seeds.txt
https://www.ato.gov.au/individuals
https://www.ato.gov.au/business
```

2. Run the crawler:

```bash
python3 crawler.py
```

### Advanced Usage

```bash
python3 crawler.py \
  --seeds my_seeds.txt \
  --depth 5 \
  --delay-min 2.0 \
  --delay-max 5.0 \
  --max-pages 1000 \
  --verbose
```

### Command Line Options

- `--seeds FILE` - Path to seeds file (default: `seeds.txt`)
- `--depth N` - Maximum crawl depth (default: 3)
- `--delay-min SECONDS` - Minimum delay between requests (default: 1.0)
- `--delay-max SECONDS` - Maximum delay between requests (default: 3.0)
- `--max-pages N` - Maximum pages to crawl, 0 for unlimited (default: 0)
- `--user-agent STRING` - Custom user agent string
- `--verbose` - Enable verbose logging

## Seeds File Format

The seeds file should contain one URL per line. Lines starting with `#` are treated as comments and ignored.

```
# Tax information for individuals
https://www.ato.gov.au/individuals

# Business tax information
https://www.ato.gov.au/business

# Empty lines are also ignored
```

## Output Structure

### Directory Layout

```
data/
├── raw/
│   ├── index.jsonl           # Metadata index
│   └── YYYYMMDD/              # Daily directory
│       ├── hostname_sha1.html # Saved HTML files
│       └── ...
└── raw_files/
    ├── sha1.pdf               # Downloaded PDF files
    ├── sha1.doc               # Downloaded DOC files
    └── sha1.docx              # Downloaded DOCX files
```

### Metadata Format

Each line in `index.jsonl` contains JSON metadata for one crawled page:

```json
{
  "url": "https://example.com/page.html",
  "status_code": 200,
  "content_type": "text/html; charset=utf-8",
  "saved_path": "data/raw/20251020/example.com_a1b2c3d4.html",
  "crawl_date": "2025-10-20T03:22:10.123456",
  "depth": 1,
  "parent_url": "https://example.com/",
  "content_length": 12345
}
```

## How It Works

### Crawling Algorithm

1. **Load Seeds**: Read seed URLs from the specified seeds file
2. **Initialize Queue**: Add each seed URL to the crawl queue at depth 0
3. **Process Queue**: For each URL in the queue:
   - Check if already visited (skip if yes)
   - Check depth limit (skip if exceeded)
   - Check robots.txt (skip if disallowed)
   - Fetch page with retry logic
   - Save raw content and metadata
   - Parse links from HTML
   - Add valid links to queue (same hostname, path prefix)
4. **Repeat**: Continue until queue is empty or max pages reached

### Link Following Rules

A link is followed only if:
- It has not been visited before
- The hostname matches the seed URL's hostname
- The path starts with the seed URL's path prefix
- The protocol is HTTP or HTTPS
- Robots.txt allows crawling

### File Type Handling

- **HTML pages**: Saved to `data/raw/YYYYMMDD/hostname_sha1.html`
- **PDF files**: Saved to `data/raw_files/sha1.pdf`
- **DOC files**: Saved to `data/raw_files/sha1.doc`
- **DOCX files**: Saved to `data/raw_files/sha1.docx`

File types are detected by:
1. Content-Type header
2. URL extension (fallback)

## Examples

### Example 1: Crawl ATO Website

```bash
# Create seeds file
cat > ato_seeds.txt << EOF
https://www.ato.gov.au/individuals/income-and-deductions
EOF

# Run crawler
python3 crawler.py --seeds ato_seeds.txt --depth 2 --verbose
```

### Example 2: Quick Test Crawl

```bash
# Shallow crawl with small page limit
python3 crawler.py --depth 1 --max-pages 10
```

### Example 3: Polite Crawling

```bash
# Longer delays for production crawling
python3 crawler.py --delay-min 5.0 --delay-max 10.0
```

## Best Practices

1. **Be Polite**: Use appropriate delays between requests
2. **Respect robots.txt**: The crawler automatically respects robots.txt
3. **Use Descriptive User Agent**: Include contact information in your user agent
4. **Monitor Progress**: Use `--verbose` to see what's being crawled
5. **Start Small**: Test with `--depth 1` and `--max-pages 10` first
6. **Check Disk Space**: Crawling can generate many files

## Troubleshooting

### Network Errors

If you see frequent network errors:
- Check your internet connection
- Increase delay between requests
- Verify the target website is accessible

### Blocked by robots.txt

If pages are being skipped:
- Check if the site's robots.txt blocks your user agent
- Some sites may block all automated access

### Memory Issues

For very large crawls:
- Use `--max-pages` to limit crawl size
- Process data in batches
- Monitor system resources

## Code Structure

The crawler is organized into a main `Crawler` class with these key methods:

- `fetch_page()` - Fetch a URL with retry logic
- `parse_links()` - Extract links from HTML
- `should_follow()` - Determine if a link should be followed
- `save_raw()` - Save content and metadata to disk
- `crawl_seed()` - Main crawling loop for a seed URL

## Testing

A test script is provided to verify the crawler functions:

```bash
python3 test_crawler.py
```

This tests:
- Link parsing from HTML
- URL filtering logic
- Seeds file reading

## License

Part of the ChatTax project.
