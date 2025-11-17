"""
Guided Checklist Service for Path 2: Guided Conversation.

Manages a structured question-answer flow to collect tax identity information
through natural conversation for Australian INDIVIDUAL taxpayers only.
"""
from typing import Dict, List, Optional
from enum import Enum


class QuestionPhase(str, Enum):
    """Phases of the guided conversation for Australian personal tax returns."""
    RESIDENCY = "residency"
    EMPLOYMENT = "employment"
    DEPENDENTS = "dependents"
    INCOME = "income"
    HOME = "home"
    INVESTMENTS = "investments"
    RENTAL = "rental"
    ADDITIONAL = "additional"
    COMPLETE = "complete"


class GuidedChecklistService:
    """Service for managing guided conversation flow for Australian personal tax returns."""
    
    # Question templates for each phase
    QUESTIONS = {
        QuestionPhase.RESIDENCY: {
            "question": "what is your residency status for tax purposes?",
            "field": "residency_status",
            "options": {
                "1": "resident",
                "resident": "resident",
                "australian": "resident",
                "2": "foreign_resident",
                "foreign": "foreign_resident",
                "non-resident": "foreign_resident",
                "3": "working_holiday_maker",
                "working holiday": "working_holiday_maker",
                "whm": "working_holiday_maker",
                "4": "unsure",
                "not sure": "unsure",
                "don't know": "unsure"
            }
        },
        QuestionPhase.EMPLOYMENT: {
            "question": "What is your primary employment type?",
            "field": "employment_type",
            "options": {
                "1": "employed",
                "employed": "employed",
                "employee": "employed",
                "payg": "employed",
                "2": "self_employed",
                "self-employed": "self_employed",
                "sole trader": "self_employed",
                "3": "contractor",
                "contractor": "contractor",
                "freelancer": "contractor",
                "4": "retired",
                "retired": "retired",
                "pensioner": "retired",
                "5": "student",
                "student": "student",
                "6": "unemployed",
                "unemployed": "unemployed",
                "job seeker": "unemployed"
            }
        },
        QuestionPhase.DEPENDENTS: {
            "question": "Do you have any dependents (such as children)?",
            "field": "has_dependents",
            "options": {
                "yes": True,
                "y": True,
                "no": False,
                "n": False
            },
            "follow_up": {
                "condition": True,
                "question": "How many dependents do you have?",
                "field": "num_dependents",
                "validation": "number"
            }
        },
        QuestionPhase.INCOME: {
            "question": "What is your approximate annual income for the 2023-24 financial year?",
            "field": "annual_income_range",
            "options": {
                "1": "under_18200",
                "2": "18200-45000",
                "3": "45000-120000",
                "4": "120000-180000",
                "5": "over_180000"
            }
        },
        QuestionPhase.HOME: {
            "question": "Do you own your home or are you renting?",
            "field": "owns_home",
            "options": {
                "own": True,
                "owner": True,
                "yes": True,
                "rent": False,
                "renting": False,
                "no": False,
                "tenant": False
            }
        },
        QuestionPhase.INVESTMENTS: {
            "question": "Do you have any investments (shares, managed funds, cryptocurrency) OR did you sell any assets this year?",
            "field": "has_investments",
            "options": {
                "yes": True,
                "y": True,
                "have": True,
                "sold": True,
                "sell": True,
                "no": False,
                "n": False,
                "none": False
            }
        },
        QuestionPhase.RENTAL: {
            "question": "Do you own any rental properties that generate income?",
            "field": "has_rental_property",
            "options": {
                "yes": True,
                "y": True,
                "own": True,
                "no": False,
                "n": False,
                "none": False
            }
        },
        QuestionPhase.ADDITIONAL: {
            "question": "Final questions! Do you have any of the following? (You can select multiple)",
            "field": "additional_items",
            "multi_select": True,
            "options": {
                "1": "has_foreign_income",
                "foreign": "has_foreign_income",
                "foreign income": "has_foreign_income",
                "overseas": "has_foreign_income",
                "2": "has_super_contributions",
                "super": "has_super_contributions",
                "superannuation": "has_super_contributions",
                "3": "has_work_expenses",
                "work expenses": "has_work_expenses",
                "deductions": "has_work_expenses",
                "home office": "has_work_expenses",
                "4": "has_private_health",
                "health insurance": "has_private_health",
                "private health": "has_private_health",
                "phi": "has_private_health",
                "5": "has_hecs_help",
                "hecs": "has_hecs_help",
                "help": "has_hecs_help",
                "education": "has_hecs_help",
                "student": "has_hecs_help",
                "6": "has_donations",
                "charity": "has_donations",
                "donations": "has_donations",
                "dgr": "has_donations",
                "7": "has_spouse",
                "married": "has_spouse",
                "marriage": "has_spouse",
                "spouse": "has_spouse",
                "partner": "has_spouse",
                "de facto": "has_spouse",
                "relationship": "has_spouse"
            }
        }
    }
    
    # Phase progression order
    PHASE_ORDER = [
        QuestionPhase.RESIDENCY,
        QuestionPhase.EMPLOYMENT,
        QuestionPhase.DEPENDENTS,
        QuestionPhase.INCOME,
        QuestionPhase.HOME,
        QuestionPhase.INVESTMENTS,
        QuestionPhase.RENTAL,
        QuestionPhase.ADDITIONAL,
        QuestionPhase.COMPLETE
    ]
    
    @staticmethod
    def get_initial_question() -> Dict:
        """
        Get the first question to start guided conversation for Australian personal tax.
        
        Returns:
            Dictionary with question and metadata
        """
        return {
            "phase": QuestionPhase.RESIDENCY,
            "question": GuidedChecklistService.QUESTIONS[QuestionPhase.RESIDENCY]["question"],
            "progress": {
                "current": 1,
                "total": len(GuidedChecklistService.PHASE_ORDER) - 1,  # Exclude COMPLETE
                "percentage": round((1 / (len(GuidedChecklistService.PHASE_ORDER) - 1)) * 100, 1)
            }
        }
    
    @staticmethod
    def get_next_question(current_phase: str, collected_info: Dict) -> Dict:
        """
        Get the next question based on current progress.
        
        Args:
            current_phase: Current question phase
            collected_info: Already collected identity information
            
        Returns:
            Dictionary with next question and metadata
        """
        try:
            current_index = GuidedChecklistService.PHASE_ORDER.index(QuestionPhase(current_phase))
            next_index = current_index + 1
            
            if next_index >= len(GuidedChecklistService.PHASE_ORDER):
                return {
                    "phase": QuestionPhase.COMPLETE,
                    "question": "✅ Great! I've collected enough information. I can now generate a personalized tax return checklist for you!",
                    "progress": {
                        "current": len(GuidedChecklistService.PHASE_ORDER) - 1,
                        "total": len(GuidedChecklistService.PHASE_ORDER) - 1,
                        "percentage": 100
                    },
                    "is_complete": True
                }
            
            next_phase = GuidedChecklistService.PHASE_ORDER[next_index]
            
            # If next phase is COMPLETE, return completion message
            if next_phase == QuestionPhase.COMPLETE:
                return {
                    "phase": QuestionPhase.COMPLETE,
                    "question": "✅ Great! I've collected enough information. I can now generate a personalized tax return checklist for you!",
                    "progress": {
                        "current": len(GuidedChecklistService.PHASE_ORDER) - 1,
                        "total": len(GuidedChecklistService.PHASE_ORDER) - 1,
                        "percentage": 100
                    },
                    "is_complete": True
                }
            
            question_data = GuidedChecklistService.QUESTIONS[next_phase]
            
            return {
                "phase": next_phase,
                "question": question_data["question"],
                "progress": {
                    "current": next_index + 1,
                    "total": len(GuidedChecklistService.PHASE_ORDER) - 1,
                    "percentage": round(((next_index + 1) / (len(GuidedChecklistService.PHASE_ORDER) - 1)) * 100, 1)
                },
                "is_complete": False
            }
            
        except (ValueError, IndexError):
            # Fallback to first question if error
            return GuidedChecklistService.get_initial_question()
    
    @staticmethod
    def parse_answer(phase: str, answer, collected_info: Dict) -> Dict:
        """
        Parse user's answer and extract structured data.
        
        Args:
            phase: Current question phase
            answer: User's answer (can be str, bool, list, or any type)
            collected_info: Existing collected information
            
        Returns:
            Dictionary with parsed values and follow-up question if needed
        """
        try:
            question_data = GuidedChecklistService.QUESTIONS[QuestionPhase(phase)]
            
            # Handle different answer types
            if isinstance(answer, bool):
                # Boolean answer - return as is
                return {
                    "parsed_value": answer,
                    "field": question_data["field"],
                    "needs_follow_up": False,
                    "follow_up_question": None
                }
            
            if isinstance(answer, list):
                # Multi-select answer
                selected_items = {item: True for item in answer}
                return {
                    "parsed_value": selected_items,
                    "field": question_data["field"],
                    "needs_follow_up": False,
                    "follow_up_question": None
                }
            
            # Convert to string for text processing
            answer_str = str(answer)
            answer_lower = answer_str.lower().strip()
            
            result = {
                "parsed_value": None,
                "field": question_data["field"],
                "needs_follow_up": False,
                "follow_up_question": None
            }
            
            # Handle multi-select
            if question_data.get("multi_select"):
                selected_items = {}
                # Check if answer contains multiple items
                for key, value in question_data["options"].items():
                    if key in answer_lower:
                        selected_items[value] = True
                
                # If nothing selected, set all to False
                if not selected_items and ("none" in answer_lower or "no" in answer_lower or "n/a" in answer_lower):
                    selected_items = {v: False for v in set(question_data["options"].values())}
                
                result["parsed_value"] = selected_items
                return result
            
            # Handle options
            if "options" in question_data:
                for key, value in question_data["options"].items():
                    if key in answer_lower:
                        result["parsed_value"] = value
                        
                        # Check for follow-up
                        if "follow_up" in question_data:
                            follow_up = question_data["follow_up"]
                            if follow_up["condition"] == value:
                                result["needs_follow_up"] = True
                                result["follow_up_question"] = follow_up["question"]
                                result["follow_up_field"] = follow_up["field"]
                        
                        break
            
            # Handle validation
            elif "validation" in question_data:
                validation_type = question_data["validation"]
                
                if validation_type == "number":
                    # Extract number
                    import re
                    numbers = re.findall(r'\d+', answer)
                    if numbers:
                        result["parsed_value"] = int(numbers[0])
            
            return result
            
        except Exception as e:
            print(f"Error parsing answer: {e}")
            return {
                "parsed_value": None,
                "field": None,
                "needs_follow_up": False,
                "error": str(e)
            }
    
    @staticmethod
    def is_conversation_complete(collected_info: Dict) -> bool:
        """
        Check if enough information has been collected for Australian personal tax return.
        
        Args:
            collected_info: Collected identity information
            
        Returns:
            Boolean indicating if ready for checklist generation
        """
        required_fields = ["residency_status", "employment_type", "has_dependents", "annual_income_range"]
        
        return all(field in collected_info and collected_info[field] is not None for field in required_fields)
