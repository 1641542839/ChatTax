"""
Create embeddings for document chunks and build FAISS index.
Supports both OpenAI embeddings and sentence transformers.
"""

import os
import json
from pathlib import Path
from tqdm import tqdm
import pickle

try:
    import numpy as np
except ImportError:
    print("Warning: numpy not installed. Install with: pip install numpy")
    np = None

try:
    import faiss
except ImportError:
    print("Warning: faiss not installed. Install with: pip install faiss-cpu")
    faiss = None


class DocumentEmbedder:
    """Create embeddings and build FAISS index for semantic search."""
    
    def __init__(self, chunks_file="./data/chunks.jsonl", 
                 index_dir="./data/faiss_index",
                 embedding_model="sentence-transformers"):
        self.chunks_file = chunks_file
        self.index_dir = index_dir
        self.embedding_model_type = embedding_model
        self.embeddings = []
        self.metadata = []
        
        # Initialize embedding model
        if embedding_model == "openai":
            self._init_openai_embedder()
        else:
            self._init_sentence_transformer()
    
    def _init_openai_embedder(self):
        """Initialize OpenAI embeddings."""
        try:
            from openai import OpenAI
            self.client = OpenAI()  # Expects OPENAI_API_KEY env variable
            self.embedding_dim = 1536  # text-embedding-ada-002 dimension
            self.embedding_model = "text-embedding-ada-002"
            print("Using OpenAI embeddings")
        except Exception as e:
            print(f"Error initializing OpenAI: {str(e)}")
            print("Falling back to sentence transformers")
            self._init_sentence_transformer()
    
    def _init_sentence_transformer(self):
        """Initialize sentence transformer embeddings."""
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.embedding_dim = 384  # all-MiniLM-L6-v2 dimension
            self.embedding_model_type = "sentence-transformers"
            print("Using Sentence Transformers (all-MiniLM-L6-v2)")
        except Exception as e:
            print(f"Error initializing Sentence Transformers: {str(e)}")
            raise
    
    def embed_text_openai(self, text):
        """
        Create embedding using OpenAI API.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector (list of floats)
        """
        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error creating OpenAI embedding: {str(e)}")
            return None
    
    def embed_text_sentence_transformer(self, text):
        """
        Create embedding using sentence transformer.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector (numpy array)
        """
        try:
            return self.model.encode(text, convert_to_numpy=True)
        except Exception as e:
            print(f"Error creating embedding: {str(e)}")
            return None
    
    def embed_text(self, text):
        """
        Create embedding for text using configured model.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector
        """
        if self.embedding_model_type == "openai":
            return self.embed_text_openai(text)
        else:
            return self.embed_text_sentence_transformer(text)
    
    def embed_batch(self, texts, batch_size=32):
        """
        Embed multiple texts in batches.
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process at once
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        
        if self.embedding_model_type == "sentence-transformers":
            # Sentence transformers can batch efficiently
            for i in tqdm(range(0, len(texts), batch_size), desc="Creating embeddings"):
                batch = texts[i:i + batch_size]
                batch_embeddings = self.model.encode(batch, convert_to_numpy=True)
                embeddings.extend(batch_embeddings)
        else:
            # OpenAI - process one at a time with rate limiting
            for text in tqdm(texts, desc="Creating embeddings"):
                embedding = self.embed_text(text)
                if embedding:
                    embeddings.append(embedding)
        
        return embeddings
    
    def load_chunks(self):
        """
        Load chunks from JSONL file.
        
        Returns:
            List of chunk dictionaries
        """
        if not os.path.exists(self.chunks_file):
            print(f"Chunks file not found: {self.chunks_file}")
            return []
        
        chunks = []
        with open(self.chunks_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    chunk = json.loads(line)
                    chunks.append(chunk)
        
        return chunks
    
    def build_index(self):
        """Build FAISS index from chunks."""
        if not np or not faiss:
            print("Error: numpy and faiss are required to build index")
            print("Install with: pip install numpy faiss-cpu")
            return
        
        # Load chunks
        chunks = self.load_chunks()
        
        if not chunks:
            print("No chunks to embed")
            return
        
        print(f"Loaded {len(chunks)} chunks")
        
        # Extract texts
        texts = [chunk['text'] for chunk in chunks]
        
        # Create embeddings
        print("Creating embeddings...")
        embeddings = self.embed_batch(texts)
        
        if not embeddings:
            print("No embeddings created")
            return
        
        # Convert to numpy array
        embeddings_array = np.array(embeddings).astype('float32')
        
        print(f"Created {len(embeddings)} embeddings with dimension {embeddings_array.shape[1]}")
        
        # Build FAISS index
        print("Building FAISS index...")
        
        # Use IndexFlatL2 for exact search (good for smaller datasets)
        # For larger datasets, consider IndexIVFFlat or IndexHNSWFlat
        index = faiss.IndexFlatL2(embeddings_array.shape[1])
        index.add(embeddings_array)
        
        print(f"Index built with {index.ntotal} vectors")
        
        # Save index and metadata
        os.makedirs(self.index_dir, exist_ok=True)
        
        index_path = os.path.join(self.index_dir, 'faiss.index')
        faiss.write_index(index, index_path)
        print(f"Saved FAISS index to: {index_path}")
        
        # Save metadata (chunks without text to save space)
        metadata = []
        for chunk in chunks:
            meta = {
                'chunk_id': chunk['chunk_id'],
                'source_document': chunk['source_document'],
                'chunk_index': chunk['chunk_index'],
                'metadata': chunk.get('metadata', {})
            }
            metadata.append(meta)
        
        metadata_path = os.path.join(self.index_dir, 'metadata.pkl')
        with open(metadata_path, 'wb') as f:
            pickle.dump(metadata, f)
        print(f"Saved metadata to: {metadata_path}")
        
        # Save chunks for reference
        chunks_path = os.path.join(self.index_dir, 'chunks.jsonl')
        with open(chunks_path, 'w', encoding='utf-8') as f:
            for chunk in chunks:
                f.write(json.dumps(chunk, ensure_ascii=False) + '\n')
        print(f"Saved chunks to: {chunks_path}")
    
    def search(self, query, k=5):
        """
        Search for similar chunks.
        
        Args:
            query: Query text
            k: Number of results to return
            
        Returns:
            List of (chunk, distance) tuples
        """
        # Load index
        index_path = os.path.join(self.index_dir, 'faiss.index')
        if not os.path.exists(index_path):
            print("Index not found. Please build the index first.")
            return []
        
        index = faiss.read_index(index_path)
        
        # Load metadata
        metadata_path = os.path.join(self.index_dir, 'metadata.pkl')
        with open(metadata_path, 'rb') as f:
            metadata = pickle.load(f)
        
        # Load chunks
        chunks_path = os.path.join(self.index_dir, 'chunks.jsonl')
        chunks = []
        with open(chunks_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    chunks.append(json.loads(line))
        
        # Create query embedding
        query_embedding = self.embed_text(query)
        if query_embedding is None:
            return []
        
        query_vector = np.array([query_embedding]).astype('float32')
        
        # Search
        distances, indices = index.search(query_vector, k)
        
        # Return results
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(chunks):
                results.append((chunks[idx], float(distance)))
        
        return results


def main():
    """Main function to create embeddings and build index."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Create embeddings and build FAISS index")
    parser.add_argument("--model", choices=["openai", "sentence-transformers"], 
                       default="sentence-transformers",
                       help="Embedding model to use")
    parser.add_argument("--search", type=str, help="Search query for testing")
    
    args = parser.parse_args()
    
    embedder = DocumentEmbedder(embedding_model=args.model)
    
    if args.search:
        print(f"Searching for: {args.search}")
        results = embedder.search(args.search, k=5)
        
        for i, (chunk, distance) in enumerate(results):
            print(f"\nResult {i+1} (distance: {distance:.4f}):")
            print(f"Source: {chunk['source_document']}")
            print(f"Text: {chunk['text'][:200]}...")
    else:
        print("Building FAISS index...")
        embedder.build_index()
        print("Index building completed!")


if __name__ == "__main__":
    main()
