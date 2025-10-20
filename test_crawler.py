#!/usr/bin/env python3
"""
Simple test script to validate crawler functions
"""
import sys
sys.path.insert(0, '.')

from crawler import Crawler, read_seeds
import argparse
from bs4 import BeautifulSoup

# Test HTML content
TEST_HTML = b"""
<html>
<head><title>Test Page</title></head>
<body>
<a href="/page1.html">Page 1</a>
<a href="/page2.html">Page 2</a>
<a href="http://external.com/page3.html">External Page</a>
<a href="document.pdf">PDF Document</a>
</body>
</html>
"""

def test_parse_links():
    """Test parse_links function"""
    print("Testing parse_links...")
    args = argparse.Namespace(
        seeds='seeds.txt',
        depth=3,
        delay_min=1.0,
        delay_max=3.0,
        max_pages=0,
        user_agent='TestBot/1.0',
        verbose=False
    )
    crawler = Crawler(args)
    
    base_url = "http://example.com/test/"
    links = crawler.parse_links(TEST_HTML, base_url)
    
    print(f"  Found {len(links)} links")
    for link in sorted(links):
        print(f"    - {link}")
    
    assert len(links) > 0, "Should find at least one link"
    print("  ✓ parse_links test passed\n")

def test_should_follow():
    """Test should_follow function"""
    print("Testing should_follow...")
    args = argparse.Namespace(
        seeds='seeds.txt',
        depth=3,
        delay_min=1.0,
        delay_max=3.0,
        max_pages=0,
        user_agent='TestBot/1.0',
        verbose=False
    )
    crawler = Crawler(args)
    
    seed_url = "http://example.com/docs/"
    
    test_cases = [
        ("http://example.com/docs/page1.html", True, "Same hostname and path prefix"),
        ("http://example.com/docs/subdir/page2.html", True, "Same hostname and subdirectory"),
        ("http://example.com/other/page3.html", False, "Different path prefix"),
        ("http://other.com/docs/page4.html", False, "Different hostname"),
        ("https://example.com/docs/page5.html", True, "HTTPS is allowed (scheme flexibility)"),
        ("ftp://example.com/docs/file.txt", False, "Non-HTTP protocol"),
    ]
    
    for url, expected, description in test_cases:
        result = crawler.should_follow(url, seed_url)
        status = "✓" if result == expected else "✗"
        print(f"  {status} {description}: {url} -> {result}")
        assert result == expected, f"Failed: {description}"
    
    print("  ✓ should_follow test passed\n")

def test_read_seeds():
    """Test read_seeds function"""
    print("Testing read_seeds...")
    
    # Create a temporary seeds file
    import tempfile
    import os
    
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("# Comment line\n")
            f.write("http://example.com/\n")
            f.write("\n")  # Empty line
            f.write("http://test.com/\n")
            temp_file = f.name
        
        seeds = read_seeds(temp_file)
        print(f"  Found {len(seeds)} seeds")
        for seed in seeds:
            print(f"    - {seed}")
        
        assert len(seeds) == 2, "Should find 2 seeds"
        assert "http://example.com/" in seeds, "Should contain example.com"
        assert "http://test.com/" in seeds, "Should contain test.com"
        
        print("  ✓ read_seeds test passed\n")
    finally:
        # Clean up temporary file
        if temp_file and os.path.exists(temp_file):
            os.unlink(temp_file)

if __name__ == '__main__':
    print("=" * 60)
    print("Running Crawler Tests")
    print("=" * 60 + "\n")
    
    try:
        test_parse_links()
        test_should_follow()
        test_read_seeds()
        
        print("=" * 60)
        print("All tests passed! ✓")
        print("=" * 60)
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
