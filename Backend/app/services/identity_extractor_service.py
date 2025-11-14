"""
Identity Extractor Service for extracting tax identity information from conversations.

Uses LLM to analyze conversation history and extract structured identity information
for AUSTRALIAN INDIVIDUAL taxpayers that can be used for checklist generation.
"""
from typing import Dict, List, Optional
import json
import openai
from app.core.config import settings


class IdentityExtractorService:
    """Service for extracting identity information from conversations about Australian personal tax."""
    
    # Required fields for complete identity (Australian context)
    REQUIRED_FIELDS = {
        "residency_status": ["resident", "foreign_resident", "working_holiday_maker"],
        "employment_type": ["employed", "self_employed", "contractor", "retired", "student", "unemployed"],
        "has_dependents": bool,
        "annual_income_range": str,
    }
    
    # Optional but valuable fields
    OPTIONAL_FIELDS = {
        "num_dependents": int,
        "owns_home": bool,
        "has_investments": bool,
        "has_rental_property": bool,
        "has_foreign_income": bool,
        "has_super_contributions": bool,
        "has_work_expenses": bool,
        "has_hecs_debt": bool,
        "has_private_health_insurance": bool,
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
        
        # Create extraction prompt for Australian personal tax
        extraction_prompt = f"""
Analyze the following conversation and extract tax-related identity information for an AUSTRALIAN INDIVIDUAL taxpayer.

CONVERSATION:
{conversation_text}

INSTRUCTIONS:
Extract the following information if mentioned in the conversation:

REQUIRED FIELDS:
- residency_status: resident, foreign_resident, or working_holiday_maker (Australian tax residency)
- employment_type: employed, self_employed, contractor, retired, student, or unemployed
- has_dependents: true or false
- annual_income_range: e.g., "under_18200", "18200-45000", "45000-120000", "120000-180000", "over_180000"

OPTIONAL FIELDS:
- num_dependents: number (if has_dependents is true)
- owns_home: true or false
- has_investments: true or false (shares, managed funds, etc.)
- has_rental_property: true or false
- has_foreign_income: true or false
- has_super_contributions: true or false (personal superannuation contributions)
- has_work_expenses: true or false (work-related deductions)
- has_hecs_debt: true or false (HECS/HELP student loan)
- has_private_health_insurance: true or false
- has_charitable_donations: true or false (donations to DGRs)

IMPORTANT:
- This is for AUSTRALIAN PERSONAL tax returns only
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
        Format extracted info into ChecklistIdentityInfo schema (Australian context).
        
        Args:
            extracted_info: Raw extracted identity
            
        Returns:
            Formatted identity info for Australian tax checklist generation
        """
        # Map to checklist schema (Australian fields)
        formatted = {
            "residency_status": extracted_info.get("residency_status"),
            "employment_type": extracted_info.get("employment_type"),
            "has_dependents": extracted_info.get("has_dependents", False),
            "annual_income_range": extracted_info.get("annual_income_range"),
        }
        
        # Add optional fields if present
        optional_mapping = {
            "num_dependents": "num_dependents",
            "owns_home": "owns_home",
            "has_investments": "has_investments",
            "has_rental_property": "has_rental_property",
            "has_foreign_income": "has_foreign_income",
            "has_super_contributions": "has_super_contributions",
            "has_work_expenses": "has_work_expenses",
            "has_hecs_debt": "has_hecs_debt",
            "has_private_health_insurance": "has_private_health_insurance",
            "has_charitable_donations": "has_charitable_donations",
        }
        
        for key, mapped_key in optional_mapping.items():
            if key in extracted_info:
                formatted[mapped_key] = extracted_info[key]
        
        return formatted
