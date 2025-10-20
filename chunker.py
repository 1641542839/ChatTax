"""
Chunk documents into smaller pieces for embedding.
Outputs chunks in JSONL format for efficient processing.
"""

import os
import json
from pathlib import Path
from tqdm import tqdm
import tiktoken


class DocumentChunker:
    """Chunk documents into smaller pieces suitable for embeddings."""
    
    def __init__(self, input_dir="./data/parsed", output_file="./data/chunks.jsonl"):
        self.input_dir = input_dir
        self.output_file = output_file
        self.tokenizer = tiktoken.get_encoding("cl100k_base")  # OpenAI encoding
        
    def count_tokens(self, text):
        """
        Count tokens in text.
        
        Args:
            text: Input text
            
        Returns:
            Number of tokens
        """
        return len(self.tokenizer.encode(text))
    
    def chunk_by_tokens(self, text, chunk_size=512, overlap=50):
        """
        Chunk text by token count with overlap.
        
        Args:
            text: Text to chunk
            chunk_size: Maximum tokens per chunk
            overlap: Number of overlapping tokens between chunks
            
        Returns:
            List of text chunks
        """
        tokens = self.tokenizer.encode(text)
        chunks = []
        
        start = 0
        while start < len(tokens):
            end = start + chunk_size
            chunk_tokens = tokens[start:end]
            chunk_text = self.tokenizer.decode(chunk_tokens)
            chunks.append(chunk_text)
            
            # Move start position with overlap
            start = end - overlap
            
            # Prevent infinite loop
            if start >= len(tokens) or end >= len(tokens):
                break
        
        return chunks
    
    def chunk_by_paragraphs(self, text, max_chunk_size=512, overlap=50):
        """
        Chunk text by paragraphs, respecting token limits.
        
        Args:
            text: Text to chunk
            max_chunk_size: Maximum tokens per chunk
            overlap: Number of overlapping tokens between chunks
            
        Returns:
            List of text chunks
        """
        # Split into paragraphs
        paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
        
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for para in paragraphs:
            para_tokens = self.count_tokens(para)
            
            # If single paragraph exceeds limit, split it further
            if para_tokens > max_chunk_size:
                # Save current chunk if it exists
                if current_chunk:
                    chunks.append('\n'.join(current_chunk))
                    current_chunk = []
                    current_tokens = 0
                
                # Split large paragraph by tokens
                sub_chunks = self.chunk_by_tokens(para, max_chunk_size, overlap)
                chunks.extend(sub_chunks)
                continue
            
            # Check if adding this paragraph exceeds the limit
            if current_tokens + para_tokens > max_chunk_size and current_chunk:
                chunks.append('\n'.join(current_chunk))
                
                # Add overlap from last paragraph if possible
                if overlap > 0 and current_chunk:
                    current_chunk = [current_chunk[-1]]
                    current_tokens = self.count_tokens(current_chunk[0])
                else:
                    current_chunk = []
                    current_tokens = 0
            
            current_chunk.append(para)
            current_tokens += para_tokens
        
        # Add remaining chunk
        if current_chunk:
            chunks.append('\n'.join(current_chunk))
        
        return chunks
    
    def process_document(self, json_path, chunk_size=512, overlap=50):
        """
        Process a single JSON document and create chunks.
        
        Args:
            json_path: Path to JSON file
            chunk_size: Maximum tokens per chunk
            overlap: Overlap between chunks
            
        Returns:
            List of chunk dictionaries
        """
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        content = data.get('content', '')
        metadata = data.get('metadata', {})
        
        if not content:
            return []
        
        # Create chunks
        chunks = self.chunk_by_paragraphs(content, chunk_size, overlap)
        
        # Create chunk objects with metadata
        chunk_objects = []
        for idx, chunk_text in enumerate(chunks):
            chunk_obj = {
                'chunk_id': f"{Path(json_path).stem}_{idx}",
                'source_document': metadata.get('source_file', str(json_path)),
                'chunk_index': idx,
                'total_chunks': len(chunks),
                'text': chunk_text,
                'token_count': self.count_tokens(chunk_text),
                'metadata': {
                    'title': metadata.get('title', ''),
                    'file_type': metadata.get('file_type', data.get('content_type', 'unknown'))
                }
            }
            chunk_objects.append(chunk_obj)
        
        return chunk_objects
    
    def process_all_documents(self, chunk_size=512, overlap=50):
        """
        Process all documents in the input directory.
        
        Args:
            chunk_size: Maximum tokens per chunk
            overlap: Overlap between chunks
        """
        if not os.path.exists(self.input_dir):
            print(f"Input directory does not exist: {self.input_dir}")
            return
        
        # Find all JSON files
        json_files = list(Path(self.input_dir).glob('*.json'))
        
        if not json_files:
            print("No JSON files found")
            return
        
        print(f"Processing {len(json_files)} documents...")
        
        # Open output file
        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)
        
        total_chunks = 0
        with open(self.output_file, 'w', encoding='utf-8') as out_f:
            for json_path in tqdm(json_files, desc="Chunking documents"):
                try:
                    chunks = self.process_document(json_path, chunk_size, overlap)
                    
                    # Write each chunk as a JSON line
                    for chunk in chunks:
                        out_f.write(json.dumps(chunk, ensure_ascii=False) + '\n')
                        total_chunks += 1
                        
                except Exception as e:
                    print(f"Error processing {json_path}: {str(e)}")
        
        print(f"Created {total_chunks} chunks from {len(json_files)} documents")
        print(f"Chunks saved to: {self.output_file}")


def main():
    """Main function to chunk documents."""
    chunker = DocumentChunker()
    
    print("Starting document chunking...")
    chunker.process_all_documents(chunk_size=512, overlap=50)
    print("Chunking completed!")


if __name__ == "__main__":
    main()
