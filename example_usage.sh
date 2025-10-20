#!/bin/bash
# Example usage of the ChatTax crawler

echo "=== Example 1: Basic usage with default settings ==="
echo "python3 crawler.py"
echo ""

echo "=== Example 2: Custom seeds file and depth ==="
echo "python3 crawler.py --seeds my_seeds.txt --depth 5"
echo ""

echo "=== Example 3: Polite crawling with longer delays ==="
echo "python3 crawler.py --delay-min 5.0 --delay-max 10.0 --verbose"
echo ""

echo "=== Example 4: Limited crawl for testing ==="
echo "python3 crawler.py --depth 1 --max-pages 10"
echo ""

echo "=== Example 5: Full featured crawl ==="
echo "python3 crawler.py \\"
echo "  --seeds ato_seeds.txt \\"
echo "  --depth 3 \\"
echo "  --delay-min 2.0 \\"
echo "  --delay-max 5.0 \\"
echo "  --max-pages 1000 \\"
echo "  --user-agent 'ChatTaxBot/1.0 (contact@example.com)' \\"
echo "  --verbose"

