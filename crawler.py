"""
Web crawler for Australian tax documents from ATO website.
Saves raw HTML files organized by date.
"""

import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin, urlparse
import time
from tqdm import tqdm


class TaxDocumentCrawler:
    """Crawler for Australian Tax Office (ATO) documents."""
    
    def __init__(self, base_url="https://www.ato.gov.au", output_dir="./data/raw"):
        self.base_url = base_url
        self.output_dir = output_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.visited_urls = set()
        
    def crawl(self, start_urls, max_depth=2, delay=1.0):
        """
        Crawl starting from given URLs.
        
        Args:
            start_urls: List of URLs to start crawling from
            max_depth: Maximum depth to crawl
            delay: Delay between requests in seconds
        """
        today = datetime.now().strftime("%Y%m%d")
        output_path = os.path.join(self.output_dir, today)
        os.makedirs(output_path, exist_ok=True)
        
        for url in tqdm(start_urls, desc="Crawling URLs"):
            self._crawl_recursive(url, output_path, depth=0, max_depth=max_depth, delay=delay)
    
    def _crawl_recursive(self, url, output_path, depth, max_depth, delay):
        """Recursively crawl pages."""
        if depth > max_depth or url in self.visited_urls:
            return
            
        self.visited_urls.add(url)
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Save HTML content
            filename = self._url_to_filename(url)
            filepath = os.path.join(output_path, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            # Parse and find links
            soup = BeautifulSoup(response.text, 'html.parser')
            links = soup.find_all('a', href=True)
            
            # Follow relevant links
            for link in links:
                href = link['href']
                full_url = urljoin(url, href)
                
                # Only follow links within the same domain
                if urlparse(full_url).netloc == urlparse(self.base_url).netloc:
                    if self._is_relevant_link(full_url):
                        time.sleep(delay)
                        self._crawl_recursive(full_url, output_path, depth + 1, max_depth, delay)
                        
        except Exception as e:
            print(f"Error crawling {url}: {str(e)}")
    
    def _url_to_filename(self, url):
        """Convert URL to safe filename."""
        parsed = urlparse(url)
        path = parsed.path.strip('/').replace('/', '_')
        if not path:
            path = 'index'
        return f"{path}.html"
    
    def _is_relevant_link(self, url):
        """Check if link is relevant (e.g., contains tax-related keywords)."""
        keywords = ['tax', 'ruling', 'determination', 'guide', 'law', 'regulation']
        url_lower = url.lower()
        return any(keyword in url_lower for keyword in keywords)
    
    def download_file(self, url, output_dir="./data/raw_files"):
        """
        Download a PDF or DOCX file.
        
        Args:
            url: URL of the file to download
            output_dir: Directory to save the file
        """
        os.makedirs(output_dir, exist_ok=True)
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            filename = os.path.basename(urlparse(url).path)
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"Downloaded: {filename}")
            return filepath
            
        except Exception as e:
            print(f"Error downloading {url}: {str(e)}")
            return None


def main():
    """Main function to run the crawler."""
    crawler = TaxDocumentCrawler()
    
    # Example starting URLs for ATO tax documents
    start_urls = [
        "https://www.ato.gov.au/law/view/menu.htm?menuid=0%3A1%3A2%3A3%3A4",
        "https://www.ato.gov.au/General/ATO-advice-and-guidance/",
    ]
    
    print("Starting crawler...")
    crawler.crawl(start_urls, max_depth=1, delay=1.0)
    print("Crawling completed!")


if __name__ == "__main__":
    main()
