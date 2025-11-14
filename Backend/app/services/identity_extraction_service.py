"""
Identity Extraction Service for extracting tax-related user information from conversations.

Uses LLM to analyze conversation history and extract ChecklistIdentityInfo.
Follows Single Responsibility Principle - only handles identity extraction logic.
"""
import json
import logging
from typing import List, Dict, Tuple, Optional
from app.schemas.schemas import ChecklistIdentityInfo
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)


class IdentityExtractionService:
    """
    Service for extracting user identity information from conversation history.
    
    Uses LLM to analyze natural language conversations and extract structured
    tax-related identity information needed for checklist generation.
    """
    
    def __init__(self):
        """Initialize the service with LLM service dependency."""
        self.llm_service = get_llm_service()
    
    async def extract_identity(
        self, 
        conversation_history: List[Dict[str, str]]
    ) -> Tuple[Optional[ChecklistIdentityInfo], int]:
        """
        Extract identity information from conversation history.
        
        Analyzes the entire conversation using LLM to identify tax-related
        information such as employment status, income sources, dependents, etc.
        
        Args:
            conversation_history: List of message dicts with 'role' and 'content'
            
        Returns:
            Tuple of (identity_info, completion_percentage)
            - identity_info: Extracted ChecklistIdentityInfo or None if extraction fails
            - completion_percentage: 0-100 indicating how complete the information is
            
        Example:
            >>> service = IdentityExtractionService()
            >>> history = [
            ...     {"role": "user", "content": "I'm married with 2 kids"},
            ...     {"role": "assistant", "content": "Great! Tell me more..."}
            ... ]
            >>> identity, completion = await service.extract_identity(history)
            >>> print(f"Completion: {completion}%")
        """
        if not conversation_history:
            logger.warning("[IdentityExtraction] Empty conversation history")
            return None, 0
        
        try:
            # Build conversation text from history
            messages_text = "\n".join([
                f"{msg.get('role', 'unknown')}: {msg.get('content', '')}" 
                for msg in conversation_history
            ])
            
            print(f"\n[IdentityExtraction] ========== EXTRACTION DEBUG ==========")
            print(f"[IdentityExtraction] Messages count: {len(conversation_history)}")
            print(f"[IdentityExtraction] Conversation text length: {len(messages_text)} chars")
            print(f"[IdentityExtraction] First 200 chars: {messages_text[:200]}...")
            
            # Construct extraction prompt
            prompt = self._build_extraction_prompt(messages_text)
            print(f"[IdentityExtraction] Prompt length: {len(prompt)} chars")
            
            # Call LLM for extraction
            logger.info("[IdentityExtraction] Calling LLM for identity extraction...")
            print(f"[IdentityExtraction] Calling LLM with temperature=0.3, max_tokens=800...")
            
            response = await self.llm_service.generate_response(
                prompt=prompt,
                temperature=0.3,  # Lower temperature for more consistent extraction
                max_tokens=800
            )
            
            print(f"[IdentityExtraction] LLM response received, length: {len(response)} chars")
            print(f"[IdentityExtraction] Response preview: {response[:300]}...")
            
            # Parse JSON response
            logger.debug(f"[IdentityExtraction] LLM response: {response[:200]}...")
            data = self._parse_llm_response(response)
            
            print(f"[IdentityExtraction] Parsed data: {data is not None}")
            
            if not data:
                logger.error("[IdentityExtraction] Failed to parse LLM response")
                return None, 0
            
            # Extract confidence score
            confidence = data.pop("confidence", 0)
            
            # Convert to ChecklistIdentityInfo
            identity_info = ChecklistIdentityInfo(**data)
            
            # Calculate completion percentage
            completion_percentage = self._calculate_completion(identity_info)
            
            print(f"[IdentityExtraction] Final completion: {completion_percentage}%")
            print(f"[IdentityExtraction] Identity object: {identity_info.model_dump()}")
            print(f"[IdentityExtraction] ========== EXTRACTION DEBUG END ==========\n")
            
            logger.info(f"[IdentityExtraction] Extracted identity with {completion_percentage}% completion (confidence: {confidence}%)")
            
            return identity_info, completion_percentage
            
        except Exception as e:
            logger.error(f"[IdentityExtraction] Error extracting identity: {str(e)}")
            return None, 0
    
    def _build_extraction_prompt(self, conversation_text: str) -> str:
        """
        Build the prompt for LLM identity extraction.
        
        Args:
            conversation_text: Formatted conversation history
            
        Returns:
            Structured prompt for the LLM
        """
        return f"""Analyze the following conversation and extract tax-related identity information.

Conversation:
{conversation_text}

Extract the following information from the conversation:

1. **employment_status**: Choose ONE from [employed, self-employed, unemployed, retired, unknown]
2. **income_sources**: List of income types from [salary, investment, rental, business, pension, other]
3. **has_dependents**: true if user has children or dependents, false otherwise
4. **has_investment**: true if user has stocks, bonds, or investment income
5. **has_rental_property**: true if user owns rental properties
6. **is_first_time_filer**: true if this is their first time filing taxes
7. **additional_info**: Any other relevant context (location, industry, special circumstances)

IMPORTANT RULES:
- Only extract information that is EXPLICITLY mentioned in the conversation
- If information is not mentioned, use these defaults:
  * employment_status: "unknown"
  * income_sources: [] (empty array)
  * has_dependents: null (NOT false - null means not asked)
  * has_investment: null (NOT false - null means not asked)
  * has_rental_property: null (NOT false - null means not asked)
  * is_first_time_filer: null (NOT false - null means not asked)
- Be conservative - don't make assumptions
- CRITICAL: Use null (not false) for boolean fields when information is not explicitly mentioned
- Only use true/false when user explicitly states the information
- For confidence, rate 0-100 how certain you are about the extracted information

Respond ONLY with valid JSON in this exact format:
{{
    "employment_status": "employed",
    "income_sources": ["salary", "investment"],
    "has_dependents": true,
    "has_investment": null,
    "has_rental_property": false,
    "is_first_time_filer": null,
    "additional_info": {{"location": "California", "notes": "Has stock portfolio"}},
    "confidence": 85
}}

JSON response:"""
    
    def _parse_llm_response(self, response: str) -> Optional[Dict]:
        """
        Parse LLM JSON response with error handling.
        
        Args:
            response: Raw LLM response string
            
        Returns:
            Parsed dict or None if parsing fails
        """
        try:
            # Remove markdown code blocks if present
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            # Parse JSON
            data = json.loads(response)
            
            # Validate required fields
            required_fields = [
                "employment_status", "income_sources", "has_dependents",
                "has_investment", "has_rental_property", "is_first_time_filer"
            ]
            
            for field in required_fields:
                if field not in data:
                    logger.warning(f"[IdentityExtraction] Missing required field: {field}")
                    return None
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"[IdentityExtraction] JSON parse error: {str(e)}")
            logger.error(f"[IdentityExtraction] Response was: {response[:500]}")
            return None
        except Exception as e:
            logger.error(f"[IdentityExtraction] Unexpected error parsing response: {str(e)}")
            return None
    
    def _calculate_completion(self, identity: ChecklistIdentityInfo) -> int:
        """
        Calculate information completion percentage (0-100).
        
        Scoring breakdown:
        - employment_status: 20% (only if not "unknown")
        - income_sources: 20% (only if non-empty list)
        - has_dependents: 15% (only if explicitly True or False, not None)
        - has_investment: 15% (only if explicitly True or False, not None)
        - has_rental_property: 15% (only if explicitly True or False, not None)
        - is_first_time_filer: 15% (only if explicitly True or False, not None)
        
        Args:
            identity: ChecklistIdentityInfo object
            
        Returns:
            Completion percentage (0-100)
        """
        score = 0
        details = []
        
        # Employment status (20%)
        if identity.employment_status and identity.employment_status != "unknown":
            score += 20
            details.append(f"employment_status={identity.employment_status} (+20%)")
        else:
            details.append(f"employment_status={identity.employment_status} (no score)")
        
        # Income sources (20%)
        if identity.income_sources and len(identity.income_sources) > 0:
            score += 20
            details.append(f"income_sources={identity.income_sources} (+20%)")
        else:
            details.append(f"income_sources={identity.income_sources} (no score)")
        
        # Has dependents (15%)
        if identity.has_dependents is not None:
            score += 15
            details.append(f"has_dependents={identity.has_dependents} (+15%)")
        else:
            details.append(f"has_dependents=None (no score)")
        
        # Has investment (15%)
        if identity.has_investment is not None:
            score += 15
            details.append(f"has_investment={identity.has_investment} (+15%)")
        else:
            details.append(f"has_investment=None (no score)")
        
        # Has rental property (15%)
        if identity.has_rental_property is not None:
            score += 15
            details.append(f"has_rental_property={identity.has_rental_property} (+15%)")
        else:
            details.append(f"has_rental_property=None (no score)")
        
        # Is first time filer (15%)
        if identity.is_first_time_filer is not None:
            score += 15
            details.append(f"is_first_time_filer={identity.is_first_time_filer} (+15%)")
        else:
            details.append(f"is_first_time_filer=None (no score)")
        
        logger.info(f"[IdentityExtraction] Completion calculation details:")
        for detail in details:
            logger.info(f"  - {detail}")
        logger.info(f"[IdentityExtraction] Total score: {score}%")
        
        return score
    
    def should_suggest_generation(self, completion_percentage: int) -> bool:
        """
        Determine if we should suggest checklist generation.
        
        Args:
            completion_percentage: Current completion percentage
            
        Returns:
            True if completion >= 60%, False otherwise
        """
        return completion_percentage >= 60


# Singleton instance
_identity_extraction_service_instance = None


def get_identity_extraction_service() -> IdentityExtractionService:
    """
    Get singleton instance of IdentityExtractionService.
    
    Returns:
        IdentityExtractionService instance
    """
    global _identity_extraction_service_instance
    if _identity_extraction_service_instance is None:
        _identity_extraction_service_instance = IdentityExtractionService()
    return _identity_extraction_service_instance
