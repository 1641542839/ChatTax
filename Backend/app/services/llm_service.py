"""
LLM service for generating answers using OpenAI with crawled tax document data.
"""
from typing import List, Dict, Tuple, AsyncGenerator
import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.core.config import settings
from app.schemas.schemas import DocumentSource, ChecklistIdentityInfo


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
Your role is to provide accurate, clear, and helpful answers to Australian PERSONAL tax-related questions for INDIVIDUAL taxpayers only.

Guidelines:
1. Base your answers ONLY on the provided source documents from the ATO
2. All information pertains to AUSTRALIAN tax law for INDIVIDUAL PERSONAL taxpayers, NOT U.S. or other countries, NOT business tax
3. DO NOT include any [Source X] citations or links in your answer text
4. DO NOT add URLs or hyperlinks in your answer
5. Write your answer in a natural, conversational style without reference markers
6. If information is not in the sources, clearly state that
7. Use clear, simple language appropriate for personal Australian taxpayers
8. Include relevant dates, amounts, and limitations specific to Australian individual tax system
9. Mention if professional consultation is recommended for complex cases
10. Use Australian terminology (e.g., "tax return" not "tax filing", "ATO" not "IRS", "myGov" not "online account")
11. Reference Australian financial years (e.g., 2023-24) when relevant

CRITICAL: 
- This system is ONLY for INDIVIDUAL PERSONAL tax returns
- Do NOT provide business tax advice
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
        user_type: str = "individual"  # Kept for backward compatibility, always individual
    ):
        """
        Generate answer using LLM with streaming for real-time response.
        
        This system only supports INDIVIDUAL PERSONAL taxpayers.
        
        Args:
            question: User's question
            retrieved_docs: List of document dictionaries with metadata and scores
            user_type: Deprecated - always "individual" (for personal Australian taxpayers only)
            
        Yields:
            str: Chunks of the generated answer
        """
        if not retrieved_docs:
            yield "I don't have enough information in my knowledge base to answer this question accurately. Please consult with a tax professional."
            return
        
        # Format context from retrieved documents
        context = self._format_context(retrieved_docs)
        
        # Generate prompt (user_type is now ignored, always individual)
        messages = self.prompt_template.format_messages(
            question=question,
            context=context
        )
        
        # Stream LLM response directly
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content

    def generate_answer(
        self,
        question: str,
        retrieved_docs: List[Dict],
        user_type: str = "individual"  # Kept for backward compatibility, always individual
    ) -> Tuple[str, List[DocumentSource], float]:
        """
        Generate answer using LLM with retrieved documents from FAISS.
        
        This system only supports INDIVIDUAL PERSONAL taxpayers.
        
        Args:
            question: User's question
            retrieved_docs: List of document dictionaries with metadata and scores
            user_type: Deprecated - always "individual" (for personal Australian taxpayers only)
            
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
        
        # Generate prompt (user_type is now ignored, always individual)
        messages = self.prompt_template.format_messages(
            question=question,
            context=context
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
    
    async def generate_tax_checklist(self, identity_info: ChecklistIdentityInfo) -> List[Dict]:
        """
        Generate a personalized tax checklist based on user's identity information.
        
        Follows Single Responsibility Principle - only handles LLM interaction for checklist generation.
        
        Args:
            identity_info: User's identity and tax situation information
            
        Returns:
            List of checklist items as dictionaries
        """
        # Create a prompt for checklist generation
        checklist_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert Australian tax advisor who helps INDIVIDUAL PERSONAL taxpayers prepare their tax returns.
Your task is to generate a personalized, actionable checklist for preparing an Australian PERSONAL tax return.

IMPORTANT: This is ONLY for INDIVIDUAL taxpayers, NOT businesses or companies.

The checklist should:
1. Be tailored to the user's specific situation (employment, income sources, dependents, etc.)
2. Include only relevant items based on their identity information
3. Be organized by priority (high, medium, low)
4. Have clear, actionable titles and descriptions
5. Use Australian tax terminology and regulations (ATO, myGov, Payment Summary, etc.)
6. Include estimated time for each task
7. Cover these categories: documents, deductions, forms, deadlines, record_keeping

Return ONLY a valid JSON array of checklist items with this exact structure:
[
  {{
    "id": "unique_id",
    "title": "Short actionable title",
    "description": "Detailed description of what to do and why",
    "category": "documents|deductions|forms|deadlines|record_keeping",
    "priority": "high|medium|low",
    "status": "todo",
    "estimated_time": "X minutes|hours"
  }}
]

Important:
- Generate DYNAMIC number of items based on complexity:
  * Simple situation (employed, no investments): 5-8 items
  * Moderate situation (multiple income sources OR dependents): 8-12 items
  * Complex situation (multiple income sources AND investments AND rental): 12-15 items
- Use unique IDs like "doc_001", "ded_001", etc.
- All items should start with status "todo"
- Be specific to Australian PERSONAL tax law and ATO requirements
- Consider the financial year 2023-24
- Focus on INDIVIDUAL taxpayer tasks (no business tax, no company returns)
- Do NOT include any text before or after the JSON array"""),
            ("user", """Generate a personalized Australian PERSONAL tax return checklist for an INDIVIDUAL taxpayer with this profile:

Employment Status: {employment_status}
Income Sources: {income_sources}
Has Dependents: {has_dependents}
Has Investments: {has_investment}
Has Rental Property: {has_rental_property}
First Time Filer: {is_first_time_filer}
Additional Context: {additional_info}

Generate a checklist with the appropriate number of items based on complexity.
Return the checklist as a JSON array.""")
        ])
        
        # Format the prompt
        messages = checklist_prompt.format_messages(
            employment_status=identity_info.employment_status,
            income_sources=", ".join(identity_info.income_sources),
            has_dependents="Yes" if identity_info.has_dependents else "No",
            has_investment="Yes" if identity_info.has_investment else "No",
            has_rental_property="Yes" if identity_info.has_rental_property else "No",
            is_first_time_filer="Yes" if identity_info.is_first_time_filer else "No",
            additional_info=str(identity_info.additional_info) if identity_info.additional_info else "None"
        )
        
        # Generate checklist
        response = await self.llm.ainvoke(messages)
        checklist_text = response.content.strip()
        
        # Parse JSON response
        try:
            # Remove any markdown code blocks if present
            if checklist_text.startswith("```"):
                checklist_text = checklist_text.split("```")[1]
                if checklist_text.startswith("json"):
                    checklist_text = checklist_text[4:]
            
            checklist_items = json.loads(checklist_text)
            
            # Validate structure
            if not isinstance(checklist_items, list):
                raise ValueError("Response is not a list")
            
            # Ensure all items have required fields
            required_fields = {"id", "title", "description", "category", "priority", "status"}
            for item in checklist_items:
                if not all(field in item for field in required_fields):
                    raise ValueError(f"Item missing required fields: {item}")
            
            return checklist_items
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return a default checklist
            print(f"Failed to parse LLM response as JSON: {e}")
            print(f"Response was: {checklist_text}")
            return self._get_default_checklist()
        except Exception as e:
            print(f"Error processing checklist: {e}")
            return self._get_default_checklist()
    
    def _get_default_checklist(self) -> List[Dict]:
        """
        Return a default checklist if LLM generation fails.
        
        Follows Fail-Safe pattern - provides sensible defaults.
        """
        return [
            {
                "id": "doc_001",
                "title": "Gather payment summaries",
                "description": "Collect all payment summaries from your employers showing income and tax withheld for the financial year",
                "category": "documents",
                "priority": "high",
                "status": "todo",
                "estimated_time": "10 minutes"
            },
            {
                "id": "doc_002",
                "title": "Collect bank statements",
                "description": "Gather bank statements showing interest earned and any foreign income",
                "category": "documents",
                "priority": "high",
                "status": "todo",
                "estimated_time": "15 minutes"
            },
            {
                "id": "ded_001",
                "title": "Review work-related expenses",
                "description": "Compile receipts for work-related expenses such as home office costs, car expenses, and professional development",
                "category": "deductions",
                "priority": "medium",
                "status": "todo",
                "estimated_time": "30 minutes"
            },
            {
                "id": "form_001",
                "title": "Create myGov account",
                "description": "If you don't have one, create a myGov account and link it to the ATO",
                "category": "forms",
                "priority": "high",
                "status": "todo",
                "estimated_time": "20 minutes"
            },
            {
                "id": "dead_001",
                "title": "Note the lodgement deadline",
                "description": "Tax returns are due by 31 October. Lodge earlier to avoid last-minute stress",
                "category": "deadlines",
                "priority": "high",
                "status": "todo",
                "estimated_time": "2 minutes"
            }
        ]


# Singleton instance
_llm_service = None


def get_llm_service() -> LLMService:
    """Get singleton instance of LLMService."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
