"""
Identity Extractor Service for extracting tax identity information from conversations.

Uses LLM to analyze conversation history and extract structured identity information
that can be used for checklist generation.
"""
from typing import Dict, List, Optional
import json
import openai
from app.core.config import settings


class IdentityExtractorService:
    """Service for extracting identity information from conversations."""
    
    # Required fields for complete identity
    REQUIRED_FIELDS = {
        "filing_status": ["single", "married_filing_jointly", "married_filing_separately", "head_of_household"],
        "employment_type": ["W2_employee", "self_employed", "business_owner", "freelancer", "retired", "student"],
        "state": str,  # Two-letter state code
        "has_dependents": bool,
    }
    
    # Optional but valuable fields
    OPTIONAL_FIELDS = {
        "num_dependents": int,
        "annual_income_range": str,
        "owns_home": bool,
        "has_investments": bool,
        "has_business": bool,
        "has_rental_property": bool,
        "has_foreign_income": bool,
        "has_retirement_contributions": bool,
        "has_education_expenses": bool,
        "has_medical_expenses": bool,
        "has_charitable_donations": bool,
    }
    
    @staticmethod
    def extract_identity_from_conversation(conversation_history: List[Dict]) -> Dict:
        """
        Extract identity information from conversation history using LLM.
        
        Args:
            conversation_history: List of message dicts with 'role' and 'content'
            
        Returns:
            Dictionary with extracted identity fields and completion percentage
        """
        if not conversation_history:
            return {
                "extracted_info": {},
                "completion_percentage": 0,
                "missing_fields": list(IdentityExtractorService.REQUIRED_FIELDS.keys()),
                "is_complete": False
            }
        
        # Build conversation text
        conversation_text = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in conversation_history
        ])
        
        # Create extraction prompt
        extraction_prompt = f"""
Analyze the following conversation and extract tax-related identity information.

CONVERSATION:
{conversation_text}

INSTRUCTIONS:
Extract the following information if mentioned in the conversation:

REQUIRED FIELDS:
- filing_status: single, married_filing_jointly, married_filing_separately, or head_of_household
- employment_type: W2_employee, self_employed, business_owner, freelancer, retired, or student
- state: Two-letter US state code (e.g., CA, NY, TX)
- has_dependents: true or false

OPTIONAL FIELDS:
- num_dependents: number (if has_dependents is true)
- annual_income_range: e.g., "50k-75k", "75k-100k", "100k-150k", "150k+"
- owns_home: true or false
- has_investments: true or false (stocks, bonds, crypto, etc.)
- has_business: true or false
- has_rental_property: true or false
- has_foreign_income: true or false
- has_retirement_contributions: true or false (401k, IRA, etc.)
- has_education_expenses: true or false
- has_medical_expenses: true or false (significant medical costs)
- has_charitable_donations: true or false

IMPORTANT:
- Only include fields that are explicitly mentioned or clearly implied
- Do not guess or make assumptions
- Return valid JSON only
- Use null for unknown required fields

Return a JSON object with the extracted fields:
"""
        
        try:
            # Call OpenAI to extract information
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a tax information extraction assistant. Extract structured data from conversations."},
                    {"role": "user", "content": extraction_prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            extracted_info = json.loads(response.choices[0].message.content)
            
            # Calculate completion
            completion_data = IdentityExtractorService._calculate_completion(extracted_info)
            
            return {
                "extracted_info": extracted_info,
                **completion_data
            }
            
        except Exception as e:
            print(f"Error extracting identity: {e}")
            return {
                "extracted_info": {},
                "completion_percentage": 0,
                "missing_fields": list(IdentityExtractorService.REQUIRED_FIELDS.keys()),
                "is_complete": False,
                "error": str(e)
            }
    
    @staticmethod
    def _calculate_completion(extracted_info: Dict) -> Dict:
        """
        Calculate completion percentage and identify missing fields.
        
        Args:
            extracted_info: Extracted identity dictionary
            
        Returns:
            Dictionary with completion metrics
        """
        required_fields = list(IdentityExtractorService.REQUIRED_FIELDS.keys())
        
        # Count filled required fields
        filled_required = sum(
            1 for field in required_fields 
            if field in extracted_info and extracted_info[field] is not None
        )
        
        # Identify missing fields
        missing_fields = [
            field for field in required_fields
            if field not in extracted_info or extracted_info[field] is None
        ]
        
        # Calculate percentage (required fields only)
        completion_percentage = (filled_required / len(required_fields)) * 100
        
        # Is complete?
        is_complete = len(missing_fields) == 0
        
        return {
            "completion_percentage": round(completion_percentage, 1),
            "missing_fields": missing_fields,
            "is_complete": is_complete,
            "filled_required_count": filled_required,
            "total_required_count": len(required_fields)
        }
    
    @staticmethod
    def merge_identity_info(existing: Dict, new_info: Dict) -> Dict:
        """
        Merge new identity information with existing, preferring new values.
        
        Args:
            existing: Existing identity dictionary
            new_info: New identity dictionary
            
        Returns:
            Merged identity dictionary
        """
        merged = existing.copy()
        
        # Update with new non-null values
        for key, value in new_info.items():
            if value is not None:
                merged[key] = value
        
        return merged
    
    @staticmethod
    def format_for_checklist(extracted_info: Dict) -> Dict:
        """
        Format extracted info into ChecklistIdentityInfo schema.
        
        Args:
            extracted_info: Raw extracted identity
            
        Returns:
            Formatted identity info for checklist generation
        """
        # Map to checklist schema
        formatted = {
            "filing_status": extracted_info.get("filing_status"),
            "employment_type": extracted_info.get("employment_type"),
            "state": extracted_info.get("state"),
            "has_dependents": extracted_info.get("has_dependents", False),
        }
        
        # Add optional fields if present
        optional_mapping = {
            "num_dependents": "num_dependents",
            "annual_income_range": "annual_income_range",
            "owns_home": "owns_home",
            "has_investments": "has_investments",
            "has_business": "has_business",
            "has_rental_property": "has_rental_property",
            "has_foreign_income": "has_foreign_income",
            "has_retirement_contributions": "has_retirement_contributions",
            "has_education_expenses": "has_education_expenses",
            "has_medical_expenses": "has_medical_expenses",
            "has_charitable_donations": "has_charitable_donations",
        }
        
        for key, mapped_key in optional_mapping.items():
            if key in extracted_info:
                formatted[mapped_key] = extracted_info[key]
        
        return formatted
