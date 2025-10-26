"""
LLM service for generating answers using OpenAI with crawled tax document data.
"""
from typing import List, Dict, Tuple
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.core.config import settings
from app.schemas.schemas import DocumentSource


class LLMService:
    """Service for generating answers using OpenAI LLM with real tax documents."""

    def __init__(self):
        """Initialize LLM service with OpenAI."""
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",  # Cost-effective model
            temperature=0.3,  # Lower temperature for more factual answers
            openai_api_key=settings.openai_api_key,
            streaming=True,  # Enable streaming
        )
        
        # Create prompt template for tax Q&A
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a professional tax advisor AI assistant specializing in Australian tax law and regulations from the Australian Taxation Office (ATO). 
Your role is to provide accurate, clear, and helpful answers to Australian tax-related questions.

Guidelines:
1. Base your answers ONLY on the provided source documents from the ATO
2. All information pertains to AUSTRALIAN tax law, NOT U.S. or other countries
3. DO NOT include any [Source X] citations or links in your answer text
4. DO NOT add URLs or hyperlinks in your answer
5. Write your answer in a natural, conversational style without reference markers
6. If information is not in the sources, clearly state that
7. Use clear, simple language appropriate for the user type
8. Include relevant dates, amounts, and limitations specific to Australian tax system
9. Mention if professional consultation is recommended for complex cases
10. Use Australian terminology (e.g., "tax return" not "tax filing", "ATO" not "IRS")
11. Reference Australian financial years (e.g., 2023-24) when relevant

User Type: {user_type}
- individual: Use simple, practical language for personal Australian taxpayers
- business: Include business-specific considerations and Australian business regulations
- professional: Provide detailed technical information for Australian tax professionals

CRITICAL: 
- Only use information from the SOURCE DOCUMENTS provided below
- Do NOT include [Source 1], [Source 2] or any citation markers in your answer
- Do NOT include any URLs or links in your answer text
- Write naturally without reference marks
- The source citations will be added separately after your answer"""),
            ("human", """Question: {question}

SOURCE DOCUMENTS:
{context}

Based on the source documents above, provide a comprehensive answer to the question.

FORMATTING REQUIREMENTS:
1. Write in a natural, flowing style WITHOUT any [Source X] citations or links
2. Do NOT include reference markers like [Source 1], [Source 2] in your answer
3. Use proper paragraph breaks between main points
4. When listing steps or points:
   - Use numbered lists (1., 2., 3., etc.)
   - Add a blank line before each numbered point
   - Keep each point concise and clear
5. Use bullet points (with - or •) for sub-items
6. Add blank lines between different sections for readability
7. Write in short, digestible paragraphs (2-3 sentences each)

Example format:
To [answer the question], you need to follow these steps:

1. First step name
This is the explanation of the first step. Keep it clear and concise.

2. Second step name  
This is the explanation of the second step. Add relevant details here.

3. Third step name
This is the explanation of the third step.

Remember: The sources will be listed separately after your answer, so do not include any citations.""")
        ])

    async def stream_answer(
        self,
        question: str,
        retrieved_docs: List[Dict],
        user_type: str = "individual"
    ):
        """
        Generate answer using LLM with streaming for real-time response.
        
        Args:
            question: User's question
            retrieved_docs: List of document dictionaries with metadata and scores
            user_type: Type of user (individual, business, professional)
            
        Yields:
            str: Chunks of the generated answer
        """
        if not retrieved_docs:
            yield "I don't have enough information in my knowledge base to answer this question accurately. Please consult with a tax professional."
            return
        
        # Format context from retrieved documents
        context = self._format_context(retrieved_docs)
        
        # Generate prompt
        messages = self.prompt_template.format_messages(
            question=question,
            context=context,
            user_type=user_type
        )
        
        # Stream LLM response directly
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content

    def generate_answer(
        self,
        question: str,
        retrieved_docs: List[Dict],
        user_type: str = "individual"
    ) -> Tuple[str, List[DocumentSource], float]:
        """
        Generate answer using LLM with retrieved documents from FAISS.
        
        Args:
            question: User's question
            retrieved_docs: List of document dictionaries with metadata and scores
            user_type: Type of user (individual, business, professional)
            
        Returns:
            Tuple of (answer, sources, confidence_score)
        """
        if not retrieved_docs:
            return (
                "I don't have enough information in my knowledge base to answer this question accurately. Please consult with a tax professional.",
                [],
                0.0
            )
        
        # Format context from retrieved documents
        context = self._format_context(retrieved_docs)
        
        # Generate prompt
        messages = self.prompt_template.format_messages(
            question=question,
            context=context,
            user_type=user_type
        )
        
        # Get LLM response
        response = self.llm.invoke(messages)
        answer = response.content
        
        # Prepare source documents
        sources = self._prepare_sources(retrieved_docs)
        
        # Calculate confidence score
        confidence = self._calculate_confidence(retrieved_docs)
        
        return answer, sources, confidence

    def _format_context(self, retrieved_docs: List[Dict]) -> str:
        """
        Format retrieved documents into context string for LLM.
        
        Includes both FAISS similarity scores and rerank scores (if available)
        to help the LLM prioritize information.
        
        Args:
            retrieved_docs: List of document dictionaries with metadata
            
        Returns:
            Formatted context string
        """
        context_parts = []
        for idx, doc in enumerate(retrieved_docs, 1):
            # Get scores - prioritize rerank score if available
            rerank_score = doc.get('rerank_score')
            faiss_score = doc.get('score', 0)
            
            score_display = f"Rerank Score: {rerank_score:.3f}" if rerank_score is not None else f"Similarity: {faiss_score:.3f}"
            
            # Format source information
            source_info = [
                f"[Source {idx}] ({score_display})",
                f"Document: {doc.get('doc_id', 'Unknown')}",
                f"Section: {doc.get('section_heading', 'N/A')}",
                f"URL: {doc.get('source_url', 'N/A')}",
                f"Last Updated: {doc.get('last_updated_on_page', doc.get('crawl_date', 'N/A'))}",
                f"Provenance: {doc.get('provenance', 'N/A')}",
                f"\nContent:\n{doc.get('text', '')}"
            ]
            
            # Add table information if applicable
            if doc.get('is_table_summary'):
                source_info.insert(3, f"Table Reference: {doc.get('table_ref', 'N/A')}")
            
            context_parts.append("\n".join(source_info))
        
        return "\n\n" + "\n\n---\n\n".join(context_parts)

    def _prepare_sources(self, retrieved_docs: List[Dict]) -> List[DocumentSource]:
        """
        Convert retrieved documents to DocumentSource schemas.
        
        Args:
            retrieved_docs: List of document dictionaries
            
        Returns:
            List of DocumentSource objects
        """
        sources = []
        for doc in retrieved_docs:
            # Truncate text if too long (keep first 500 chars)
            text = doc.get('text', '')
            truncated_text = text[:500] + "..." if len(text) > 500 else text
            
            sources.append(
                DocumentSource(
                    chunk_id=doc.get('chunk_id', ''),
                    doc_id=doc.get('doc_id', ''),
                    source_url=doc.get('source_url', ''),
                    section_heading=doc.get('section_heading', ''),
                    text=truncated_text,
                    tokens_est=doc.get('tokens_est', 0),
                    is_table_summary=doc.get('is_table_summary', False),
                    table_ref=doc.get('table_ref'),
                    provenance=doc.get('provenance', ''),
                    crawl_date=doc.get('crawl_date', ''),
                    last_updated_on_page=doc.get('last_updated_on_page'),
                    relevance_score=round(doc.get('score', 0.0), 3)
                )
            )
        
        return sources

    def _calculate_confidence(self, retrieved_docs: List[Dict]) -> float:
        """
        Calculate overall confidence score based on retrieved documents.
        
        Args:
            retrieved_docs: List of document dictionaries with scores
            
        Returns:
            Confidence score between 0 and 1
        """
        if not retrieved_docs:
            return 0.0
        
        # Average similarity score of retrieved documents
        scores = [doc.get('score', 0.0) for doc in retrieved_docs]
        avg_similarity = sum(scores) / len(scores)
        
        # Confidence is lower if we have few documents
        doc_count_factor = min(len(retrieved_docs) / 3, 1.0)
        
        # Boost confidence if top document has very high score
        top_score_boost = 1.0
        if scores and scores[0] > 0.8:
            top_score_boost = 1.1
        
        # Combined confidence
        confidence = min(avg_similarity * doc_count_factor * top_score_boost, 1.0)
        
        return round(confidence, 3)


# Singleton instance
_llm_service = None


def get_llm_service() -> LLMService:
    """Get singleton instance of LLMService."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
