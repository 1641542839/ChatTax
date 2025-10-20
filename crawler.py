#!/usr/bin/env python3
"""
Web Crawler for ChatTax
Crawls websites recursively and saves raw HTML and files.
"""

import argparse
import hashlib
import json
import os
import random
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Set, Tuple
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

# Optional progress bar
try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    

class Crawler:
    """Main crawler class handling website crawling and data storage."""
    
    def __init__(self, args):
        """Initialize crawler with command line arguments."""
        self.args = args
        self.visited_urls: Set[str] = set()
        self.robots_parsers = {}  # Cache robots.txt parsers by domain
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': args.user_agent})
        self.pages_crawled = 0
        
        # Create output directories
        today = datetime.now().strftime('%Y%m%d')
        self.raw_dir = Path('./data/raw') / today
        self.raw_files_dir = Path('./data/raw_files')
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.raw_files_dir.mkdir(parents=True, exist_ok=True)
        
        # Index file path
        self.index_file = Path('./data/raw/index.jsonl')
        self.index_file.parent.mkdir(parents=True, exist_ok=True)
        
    def log(self, message: str, verbose_only: bool = False):
        """Log message to console if verbose mode is enabled."""
        if not verbose_only or self.args.verbose:
            print(message)
            
    def get_robots_parser(self, url: str) -> Optional[RobotFileParser]:
        """Get or create a robots.txt parser for the given URL's domain."""
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        if base_url not in self.robots_parsers:
            parser = RobotFileParser()
            robots_url = urljoin(base_url, '/robots.txt')
            try:
                parser.set_url(robots_url)
                parser.read()
                self.robots_parsers[base_url] = parser
                self.log(f"Loaded robots.txt from {robots_url}", verbose_only=True)
            except (IOError, OSError, ValueError) as e:
                # Handle network errors, file errors, and parsing errors
                self.log(f"Could not load robots.txt from {robots_url}: {e}", verbose_only=True)
                # Create permissive parser if robots.txt fails
                self.robots_parsers[base_url] = None
                
        return self.robots_parsers[base_url]
        
    def can_fetch(self, url: str) -> bool:
        """Check if URL can be fetched according to robots.txt."""
        parser = self.get_robots_parser(url)
        if parser is None:
            return True  # If no robots.txt, allow crawling
        return parser.can_fetch(self.args.user_agent, url)
        
    def fetch_page(self, url: str) -> Optional[Tuple[requests.Response, bytes]]:
        """
        Fetch a page with retry logic.
        Returns tuple of (response, content_bytes) or None on failure.
        """
        # Check robots.txt
        if not self.can_fetch(url):
            self.log(f"Blocked by robots.txt: {url}", verbose_only=True)
            return None
            
        for attempt in range(3):  # Retry up to 3 times
            try:
                # Random delay between requests
                if self.pages_crawled > 0:  # Don't delay on first request
                    delay = random.uniform(self.args.delay_min, self.args.delay_max)
                    time.sleep(delay)
                    
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                return response, response.content
                
            except (requests.RequestException, IOError, OSError) as e:
                # Handle network errors, timeouts, connection issues
                self.log(f"Attempt {attempt + 1}/3 failed for {url}: {e}", verbose_only=True)
                if attempt < 2:  # Don't sleep after last attempt
                    time.sleep(2 ** attempt)  # Exponential backoff
                    
        self.log(f"Failed to fetch {url} after 3 attempts")
        return None
        
    def parse_links(self, html_content: bytes, base_url: str) -> Set[str]:
        """
        Parse HTML content and extract all links.
        Returns set of absolute URLs.
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            links = set()
            
            for tag in soup.find_all(['a', 'link']):
                href = tag.get('href')
                if href:
                    # Convert relative URLs to absolute
                    absolute_url = urljoin(base_url, href)
                    # Remove fragment
                    absolute_url = absolute_url.split('#')[0]
                    if absolute_url:
                        links.add(absolute_url)
                        
            return links
            
        except (AttributeError, ValueError, TypeError) as e:
            # Handle HTML parsing errors and attribute access issues
            self.log(f"Error parsing links from {base_url}: {e}", verbose_only=True)
            return set()
            
    def should_follow(self, url: str, seed_url: str) -> bool:
        """
        Check if URL should be followed based on:
        - Same hostname as seed
        - URL path starts with seed path prefix
        - Is HTTP/HTTPS protocol
        """
        seed_parsed = urlparse(seed_url)
        url_parsed = urlparse(url)
        
        # Check protocol
        if url_parsed.scheme not in ('http', 'https'):
            return False
            
        # Check hostname
        if url_parsed.netloc != seed_parsed.netloc:
            return False
            
        # Check path prefix
        seed_path = seed_parsed.path.rstrip('/')
        url_path = url_parsed.path
        
        if not url_path.startswith(seed_path):
            return False
            
        return True
        
    def save_raw(self, url: str, response: requests.Response, content: bytes, 
                 depth: int, parent_url: Optional[str]) -> Optional[str]:
        """
        Save raw content to disk and append metadata to index.
        Returns saved file path or None on failure.
        """
        try:
            # Generate SHA1 hash of URL for filename
            url_hash = hashlib.sha1(url.encode()).hexdigest()
            parsed = urlparse(url)
            hostname = parsed.netloc.replace(':', '_')
            
            content_type = response.headers.get('content-type', '').lower()
            
            # Determine if this is a file download (PDF, DOC, DOCX)
            is_file = False
            file_ext = None
            
            # Check content type and URL extension
            if 'application/pdf' in content_type or url.lower().endswith('.pdf'):
                is_file = True
                file_ext = 'pdf'
            elif 'application/msword' in content_type or url.lower().endswith('.doc'):
                is_file = True
                file_ext = 'doc'
            elif 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in content_type or url.lower().endswith('.docx'):
                is_file = True
                file_ext = 'docx'
                
            # Save file
            if is_file:
                # Save to raw_files directory
                filename = f"{url_hash}.{file_ext}"
                save_path = self.raw_files_dir / filename
            else:
                # Save HTML to raw directory
                filename = f"{hostname}_{url_hash}.html"
                save_path = self.raw_dir / filename
                
            # Write content
            save_path.write_bytes(content)
            
            # Prepare metadata
            metadata = {
                'url': url,
                'status_code': response.status_code,
                'content_type': content_type,
                'saved_path': str(save_path),
                'crawl_date': datetime.now().isoformat(),
                'depth': depth,
                'parent_url': parent_url,
                'content_length': len(content)
            }
            
            # Append to index file
            with open(self.index_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(metadata) + '\n')
                
            self.log(f"Saved: {save_path} ({len(content)} bytes)", verbose_only=True)
            return str(save_path)
            
        except (IOError, OSError, TypeError) as e:
            # Handle file I/O errors and JSON serialization issues
            self.log(f"Error saving {url}: {e}")
            return None
            
    def crawl_seed(self, seed_url: str):
        """
        Crawl a single seed URL recursively up to max depth.
        """
        self.log(f"\n{'='*60}")
        self.log(f"Starting crawl for: {seed_url}")
        self.log(f"Max depth: {self.args.depth}")
        self.log(f"{'='*60}\n")
        
        # Queue: (url, depth, parent_url)
        queue = [(seed_url, 0, None)]
        
        # Progress bar
        pbar = None
        if HAS_TQDM and not self.args.verbose:
            pbar = tqdm(desc=f"Crawling {urlparse(seed_url).netloc}", unit="pages")
            
        while queue and (self.args.max_pages == 0 or self.pages_crawled < self.args.max_pages):
            url, depth, parent_url = queue.pop(0)
            
            # Skip if already visited
            if url in self.visited_urls:
                continue
                
            # Skip if exceeds max depth
            if depth > self.args.depth:
                continue
                
            self.visited_urls.add(url)
            
            # Fetch page
            result = self.fetch_page(url)
            if result is None:
                continue
                
            response, content = result
            self.pages_crawled += 1
            
            # Update progress bar
            if pbar:
                pbar.update(1)
                pbar.set_postfix({'depth': depth, 'queue': len(queue)})
                
            # Save content
            self.save_raw(url, response, content, depth, parent_url)
            
            # Parse links if HTML content and not at max depth
            content_type = response.headers.get('content-type', '').lower()
            if 'text/html' in content_type and depth < self.args.depth:
                links = self.parse_links(content, url)
                
                # Filter and add to queue
                for link in links:
                    if link not in self.visited_urls and self.should_follow(link, seed_url):
                        queue.append((link, depth + 1, url))
                        
                self.log(f"Found {len(links)} links, {len([l for l in links if self.should_follow(l, seed_url)])} valid", 
                        verbose_only=True)
                        
        if pbar:
            pbar.close()
            
        self.log(f"\nCompleted crawl for {seed_url}")
        self.log(f"Pages crawled: {self.pages_crawled}")
        

def read_seeds(seeds_file: str) -> list:
    """
    Read seed URLs from file.
    Each line is a URL, lines starting with '#' are comments.
    """
    seeds = []
    try:
        with open(seeds_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip empty lines and comments
                if line and not line.startswith('#'):
                    seeds.append(line)
    except FileNotFoundError:
        print(f"Error: Seeds file '{seeds_file}' not found")
        return []
        
    return seeds


def main():
    """Main entry point for the crawler."""
    parser = argparse.ArgumentParser(
        description='Web crawler for ChatTax - crawl websites and save HTML/files',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    parser.add_argument('--seeds', type=str, default='seeds.txt',
                        help='Path to seeds file (one URL per line)')
    parser.add_argument('--depth', type=int, default=3,
                        help='Maximum crawl depth')
    parser.add_argument('--delay-min', type=float, default=1.0,
                        help='Minimum delay between requests (seconds)')
    parser.add_argument('--delay-max', type=float, default=3.0,
                        help='Maximum delay between requests (seconds)')
    parser.add_argument('--max-pages', type=int, default=0,
                        help='Maximum pages to crawl (0 = unlimited)')
    parser.add_argument('--user-agent', type=str, 
                        default='ChatTaxBot/1.0 (+https://github.com/1641542839/ChatTax)',
                        help='User agent string')
    parser.add_argument('--verbose', action='store_true',
                        help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Read seeds
    seeds = read_seeds(args.seeds)
    if not seeds:
        print(f"No valid seeds found in {args.seeds}")
        return 1
        
    print(f"Loaded {len(seeds)} seed URL(s)")
    
    # Create crawler
    crawler = Crawler(args)
    
    # Crawl each seed
    for seed in seeds:
        crawler.crawl_seed(seed)
        
    print(f"\n{'='*60}")
    print(f"Crawling completed!")
    print(f"Total pages crawled: {crawler.pages_crawled}")
    print(f"Unique URLs visited: {len(crawler.visited_urls)}")
    print(f"Output directory: {crawler.raw_dir}")
    print(f"Files directory: {crawler.raw_files_dir}")
    print(f"Index file: {crawler.index_file}")
    print(f"{'='*60}")
    
    return 0


if __name__ == '__main__':
    exit(main())
