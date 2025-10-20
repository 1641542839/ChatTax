"""
Convert HTML files to Markdown format.
Processes raw HTML files and saves as parsed JSON with markdown content.
"""

import os
import json
from bs4 import BeautifulSoup
import html2text
from pathlib import Path
from tqdm import tqdm


class HTMLToMarkdownConverter:
    """Convert HTML documents to clean Markdown format."""
    
    def __init__(self, input_dir="./data/raw", output_dir="./data/parsed"):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.html2text_converter = html2text.HTML2Text()
        self.html2text_converter.ignore_links = False
        self.html2text_converter.ignore_images = True
        self.html2text_converter.body_width = 0  # Don't wrap lines
        
    def convert_html_to_markdown(self, html_content):
        """
        Convert HTML content to Markdown.
        
        Args:
            html_content: Raw HTML string
            
        Returns:
            Markdown string
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Extract main content (customize based on ATO website structure)
        main_content = soup.find('main') or soup.find('article') or soup.find('body')
        
        if main_content:
            html_content = str(main_content)
        else:
            html_content = str(soup)
        
        # Convert to markdown
        markdown = self.html2text_converter.handle(html_content)
        
        # Clean up markdown
        markdown = self._clean_markdown(markdown)
        
        return markdown
    
    def _clean_markdown(self, markdown):
        """Clean up markdown text."""
        lines = markdown.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Remove excessive whitespace
            line = ' '.join(line.split())
            
            # Skip empty lines (but keep one for paragraph breaks)
            if line or (cleaned_lines and cleaned_lines[-1]):
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def extract_metadata(self, soup, filepath):
        """
        Extract metadata from HTML.
        
        Args:
            soup: BeautifulSoup object
            filepath: Path to the HTML file
            
        Returns:
            Dictionary of metadata
        """
        metadata = {
            'source_file': str(filepath),
            'title': '',
            'description': '',
            'keywords': []
        }
        
        # Extract title
        title_tag = soup.find('title')
        if title_tag:
            metadata['title'] = title_tag.get_text().strip()
        
        # Extract meta description
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if desc_tag and desc_tag.get('content'):
            metadata['description'] = desc_tag['content'].strip()
        
        # Extract keywords
        keywords_tag = soup.find('meta', attrs={'name': 'keywords'})
        if keywords_tag and keywords_tag.get('content'):
            metadata['keywords'] = [k.strip() for k in keywords_tag['content'].split(',')]
        
        return metadata
    
    def process_file(self, html_filepath):
        """
        Process a single HTML file.
        
        Args:
            html_filepath: Path to HTML file
            
        Returns:
            Dictionary with parsed content and metadata
        """
        with open(html_filepath, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extract metadata
        metadata = self.extract_metadata(soup, html_filepath)
        
        # Convert to markdown
        markdown_content = self.convert_html_to_markdown(html_content)
        
        return {
            'metadata': metadata,
            'content': markdown_content,
            'content_type': 'markdown'
        }
    
    def process_directory(self, date_folder=None):
        """
        Process all HTML files in a directory.
        
        Args:
            date_folder: Specific date folder to process (e.g., "20231120")
                        If None, processes the most recent folder
        """
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Find input directory
        if date_folder:
            input_path = os.path.join(self.input_dir, date_folder)
        else:
            # Find most recent date folder
            date_folders = [d for d in os.listdir(self.input_dir) 
                          if os.path.isdir(os.path.join(self.input_dir, d))]
            if not date_folders:
                print("No date folders found in input directory")
                return
            date_folders.sort(reverse=True)
            input_path = os.path.join(self.input_dir, date_folders[0])
        
        if not os.path.exists(input_path):
            print(f"Input path does not exist: {input_path}")
            return
        
        # Process all HTML files
        html_files = list(Path(input_path).glob('*.html'))
        
        print(f"Processing {len(html_files)} HTML files...")
        
        for html_file in tqdm(html_files, desc="Converting to Markdown"):
            try:
                parsed_data = self.process_file(html_file)
                
                # Save as JSON
                output_filename = html_file.stem + '.json'
                output_path = os.path.join(self.output_dir, output_filename)
                
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(parsed_data, f, indent=2, ensure_ascii=False)
                    
            except Exception as e:
                print(f"Error processing {html_file}: {str(e)}")


def main():
    """Main function to convert HTML to Markdown."""
    converter = HTMLToMarkdownConverter()
    
    print("Starting HTML to Markdown conversion...")
    converter.process_directory()
    print("Conversion completed!")


if __name__ == "__main__":
    main()
