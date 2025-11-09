"""
Context Classifier Service for analyzing user intent in conversations.

Classifies messages into different intent types to enable context-aware responses:
- EXPLAIN_ITEM: User asking about a specific checklist item
- NEW_INFO: User providing new tax-related information
- UPDATE_REQUEST: User wants to modify/regenerate checklist
- GENERAL: General tax question or conversation
"""
from typing import Dict, List, Optional
from enum import Enum
import openai
import json
from app.core.config import settings


class IntentType(str, Enum):
    """Types of user intents in tax conversations."""
    EXPLAIN_ITEM = "explain_item"  # Asking about a checklist item
    NEW_INFO = "new_info"  # Providing new tax information
    UPDATE_REQUEST = "update_request"  # Wants to update/regenerate checklist
    GENERAL = "general"  # General tax question


class ContextClassifierService:
    """Service for classifying user intent in conversations."""
    
    @staticmethod
    def classify_intent(
        message: str,
        conversation_history: List[Dict],
        has_checklist: bool = False,
        checklist_items: Optional[List[str]] = None
    ) -> Dict:
        """
        Classify the intent of a user message using LLM.
        
        Args:
            message: User's current message
            conversation_history: Previous messages
            has_checklist: Whether user has a generated checklist
            checklist_items: List of checklist item titles (if available)
            
        Returns:
            Dictionary with:
                - intent: IntentType
                - confidence: float (0-1)
                - reasoning: str
                - referenced_item: str (if EXPLAIN_ITEM)
                - should_regenerate: bool (if UPDATE_REQUEST)
        """
        # Build context
        recent_history = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
        history_text = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in recent_history
        ])
        
        checklist_context = ""
        if has_checklist and checklist_items:
            checklist_context = f"\n\nUSER'S CURRENT CHECKLIST ITEMS:\n" + "\n".join([
                f"- {item}" for item in checklist_items[:15]  # Limit to prevent token overflow
            ])
        
        # Create classification prompt
        classification_prompt = f"""
Analyze the user's message and classify their intent.

RECENT CONVERSATION:
{history_text}

CURRENT USER MESSAGE:
{message}
{checklist_context}

INTENT TYPES:
1. EXPLAIN_ITEM: User is asking about a specific checklist item (what it means, why it's needed, how to complete it)
2. NEW_INFO: User is providing NEW tax-related information that might change their checklist (e.g., "I also have rental income", "I got married", "I moved to another state")
3. UPDATE_REQUEST: User explicitly wants to update or regenerate their checklist
4. GENERAL: General tax question, casual conversation, or clarification

INSTRUCTIONS:
- Analyze the intent based on the current message and context
- If user mentions "I also have...", "I forgot to mention...", "What about..." with new tax info, classify as NEW_INFO
- If user asks "What is..." or "Why do I need..." about a checklist item, classify as EXPLAIN_ITEM
- If user says "update", "regenerate", "create new", classify as UPDATE_REQUEST
- Otherwise, classify as GENERAL

Return a JSON object with:
{{
    "intent": "explain_item" | "new_info" | "update_request" | "general",
    "confidence": 0.0 to 1.0,
    "reasoning": "brief explanation",
    "referenced_item": "item name if EXPLAIN_ITEM, null otherwise",
    "should_regenerate": true if checklist should be regenerated, false otherwise,
    "new_information_summary": "summary of new info if NEW_INFO, null otherwise"
}}
"""
        
        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a tax conversation intent classifier. Analyze user messages and determine their intent accurately."},
                    {"role": "user", "content": classification_prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                "intent": result.get("intent", "general"),
                "confidence": result.get("confidence", 0.5),
                "reasoning": result.get("reasoning", ""),
                "referenced_item": result.get("referenced_item"),
                "should_regenerate": result.get("should_regenerate", False),
                "new_information_summary": result.get("new_information_summary")
            }
            
        except Exception as e:
            print(f"Error classifying intent: {e}")
            # Fallback to heuristic classification
            return ContextClassifierService._fallback_classification(
                message, has_checklist, checklist_items
            )
    
    @staticmethod
    def _fallback_classification(
        message: str,
        has_checklist: bool,
        checklist_items: Optional[List[str]]
    ) -> Dict:
        """
        Simple heuristic-based classification when LLM fails.
        
        Args:
            message: User message
            has_checklist: Whether user has checklist
            checklist_items: Checklist items
            
        Returns:
            Classification dictionary
        """
        message_lower = message.lower()
        
        # Check for update/regenerate keywords
        update_keywords = ["update", "regenerate", "create new", "start over", "change checklist"]
        if any(keyword in message_lower for keyword in update_keywords):
            return {
                "intent": "update_request",
                "confidence": 0.7,
                "reasoning": "Detected update keywords",
                "referenced_item": None,
                "should_regenerate": True,
                "new_information_summary": None
            }
        
        # Check for new info indicators
        new_info_keywords = ["i also", "i have", "what about", "i forgot", "additionally", "i own"]
        if any(keyword in message_lower for keyword in new_info_keywords):
            return {
                "intent": "new_info",
                "confidence": 0.6,
                "reasoning": "Detected new information pattern",
                "referenced_item": None,
                "should_regenerate": False,
                "new_information_summary": message[:100]
            }
        
        # Check for explain keywords
        explain_keywords = ["what is", "why", "how do i", "what does", "explain", "tell me about"]
        if any(keyword in message_lower for keyword in explain_keywords) and has_checklist:
            return {
                "intent": "explain_item",
                "confidence": 0.6,
                "reasoning": "Detected explanation question",
                "referenced_item": None,
                "should_regenerate": False,
                "new_information_summary": None
            }
        
        # Default to general
        return {
            "intent": "general",
            "confidence": 0.5,
            "reasoning": "No specific pattern detected",
            "referenced_item": None,
            "should_regenerate": False,
            "new_information_summary": None
        }
    
    @staticmethod
    def should_trigger_regeneration(
        intent: str,
        confidence: float,
        has_existing_checklist: bool,
        new_info_threshold: float = 0.7
    ) -> bool:
        """
        Determine if a checklist should be regenerated based on intent.
        
        Args:
            intent: Classified intent type
            confidence: Classification confidence
            has_existing_checklist: Whether user has existing checklist
            new_info_threshold: Confidence threshold for NEW_INFO regeneration
            
        Returns:
            Boolean indicating whether to regenerate
        """
        # Always regenerate on explicit UPDATE_REQUEST
        if intent == "update_request":
            return True
        
        # Regenerate on high-confidence NEW_INFO if checklist exists
        if intent == "new_info" and has_existing_checklist and confidence >= new_info_threshold:
            return True
        
        return False
