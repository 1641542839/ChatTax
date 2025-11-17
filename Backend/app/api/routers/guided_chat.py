"""
Guided Chat Router - Path 2: AI-guided conversation flow
Structured Q&A to collect tax information step by step.

Note: Guided chat does not use database sessions. Answers are stored
in memory temporarily and only used for checklist generation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
import json

from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.guided_checklist_service import GuidedChecklistService

router = APIRouter(
    prefix="/api/guided-chat",
    tags=["guided-chat"],
)

# In-memory storage for guided chat answers (temporary, only for current session)
# Key: session_id, Value: collected_info dict
_guided_chat_storage: Dict[str, dict] = {}


@router.get("/{session_id}/initial")
async def get_initial_question(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the first question to start the guided conversation.
    
    Args:
        session_id: Temporary session ID (not stored in database)
        current_user: Authenticated user
    
    Returns:
        GuidedQuestion with phase, question text, type, and options
    """
    try:
        # No need to verify session - guided chat doesn't use database sessions
        
        # Get first question
        question_data = GuidedChecklistService.get_initial_question()
        phase = question_data["phase"]
        
        # Get question config from service
        question_config = GuidedChecklistService.QUESTIONS.get(phase, {})
        options_dict = question_config.get("options", {})
        
        # Determine question type and format options
        question_type = "text"
        formatted_options = []
        
        if phase == "residency":
            question_type = "single_choice"
            formatted_options = [
                {"value": "resident", "label": "1. Australian resident for tax purposes"},
                {"value": "non_resident", "label": "2. Non-resident / Foreign resident"},
                {"value": "working_holiday", "label": "3. Working holiday maker"}
            ]
        elif phase == "employment":
            question_type = "single_choice"
            formatted_options = [
                {"value": "employed", "label": "1. Employed (PAYG)"},
                {"value": "self_employed", "label": "2. Self-employed / Business owner"},
                {"value": "contractor", "label": "3. Contractor / Freelancer"},
                {"value": "retired", "label": "4. Retired / Pensioner"},
                {"value": "student", "label": "5. Student"},
                {"value": "unemployed", "label": "6. Unemployed"}
            ]
        elif phase == "dependents":
            question_type = "boolean"
            formatted_options = [
                {"value": True, "label": "Yes"},
                {"value": False, "label": "No"}
            ]
        elif phase == "income":
            question_type = "single_choice"
            formatted_options = [
                {"value": "under_18200", "label": "1. Under $18,200 (tax-free threshold)"},
                {"value": "18200-45000", "label": "2. $18,200 - $45,000"},
                {"value": "45000-120000", "label": "3. $45,000 - $120,000"},
                {"value": "120000-180000", "label": "4. $120,000 - $180,000"},
                {"value": "over_180000", "label": "5. Over $180,000"}
            ]
        elif phase == "home":
            question_type = "boolean"
            formatted_options = [
                {"value": True, "label": "Own"},
                {"value": False, "label": "Rent"}
            ]
        elif phase in ["investments", "rental"]:
            question_type = "boolean"
            formatted_options = [
                {"value": True, "label": "Yes"},
                {"value": False, "label": "No"}
            ]
        elif phase == "additional":
            question_type = "multiple_choice"
            formatted_options = [
                {"value": "has_hecs_help", "label": "1. HECS-HELP / Student loans"},
                {"value": "has_private_health", "label": "2. Private health insurance"},
                {"value": "has_donations", "label": "3. Charity donations"},
                {"value": "has_work_expenses", "label": "4. Work-related expenses (tools, uniforms, etc.)"},
                {"value": "has_foreign_income", "label": "5. Foreign income or assets"},
                {"value": "has_super_contributions", "label": "6. Additional superannuation contributions"},
                {"value": "has_spouse", "label": "7. Married or in a de facto relationship"},
                {"value": "none", "label": "8. None of the above"}
            ]
        
        # Restructure to match frontend expectations
        return {
            "phase": phase,
            "question": question_data["question"],
            "current_question": question_data["progress"]["current"],
            "total_questions": question_data["progress"]["total"],
            "progress": question_data["progress"]["percentage"],
            "question_type": question_type,
            "options": formatted_options,
            "required": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get initial question: {str(e)}"
        )


@router.get("/{session_id}/next")
async def get_next_question(
    session_id: str,
    current_phase: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the next question based on current conversation phase.
    
    Args:
        session_id: Temporary session ID (not stored in database)
        current_phase: Current question phase
        current_user: Authenticated user
    
    Returns:
        GuidedQuestion for the next phase
    """
    try:
        # No need to verify session - guided chat doesn't use database sessions
        # Answers are collected in memory in the guided chat service
        
        # Get next question with empty collected_info (service manages state internally)
        question_data = GuidedChecklistService.get_next_question(current_phase, {})
        phase = question_data["phase"]
        
        # If conversation is complete, return completion data
        if phase == "complete" or question_data.get("is_complete"):
            return {
                "phase": phase,
                "question": question_data["question"],
                "current_question": question_data["progress"]["current"],
                "total_questions": question_data["progress"]["total"],
                "progress": question_data["progress"]["percentage"],
                "is_complete": True,
                "question_type": "text",
                "options": [],
                "required": False
            }
        
        # Get question config from service
        question_config = GuidedChecklistService.QUESTIONS.get(phase, {})
        options_dict = question_config.get("options", {})
        
        # Determine question type and format options
        question_type = "text"
        formatted_options = []
        
        if phase == "residency":
            question_type = "single_choice"
            formatted_options = [
                {"value": "resident", "label": "1. Australian resident for tax purposes"},
                {"value": "non_resident", "label": "2. Non-resident / Foreign resident"},
                {"value": "working_holiday", "label": "3. Working holiday maker"}
            ]
        elif phase == "employment":
            question_type = "single_choice"
            formatted_options = [
                {"value": "employed", "label": "1. Employed (PAYG)"},
                {"value": "self_employed", "label": "2. Self-employed / Business owner"},
                {"value": "contractor", "label": "3. Contractor / Freelancer"},
                {"value": "retired", "label": "4. Retired / Pensioner"},
                {"value": "student", "label": "5. Student"},
                {"value": "unemployed", "label": "6. Unemployed"}
            ]
        elif phase == "dependents":
            question_type = "boolean"
            formatted_options = [
                {"value": True, "label": "Yes"},
                {"value": False, "label": "No"}
            ]
        elif phase == "income":
            question_type = "single_choice"
            formatted_options = [
                {"value": "under_18200", "label": "1. Under $18,200 (tax-free threshold)"},
                {"value": "18200-45000", "label": "2. $18,200 - $45,000"},
                {"value": "45000-120000", "label": "3. $45,000 - $120,000"},
                {"value": "120000-180000", "label": "4. $120,000 - $180,000"},
                {"value": "over_180000", "label": "5. Over $180,000"}
            ]
        elif phase == "home":
            question_type = "boolean"
            formatted_options = [
                {"value": True, "label": "Own"},
                {"value": False, "label": "Rent"}
            ]
        elif phase in ["investments", "rental"]:
            question_type = "boolean"
            formatted_options = [
                {"value": True, "label": "Yes"},
                {"value": False, "label": "No"}
            ]
        elif phase == "additional":
            question_type = "multiple_choice"
            formatted_options = [
                {"value": "has_hecs_help", "label": "1. HECS-HELP / Student loans"},
                {"value": "has_private_health", "label": "2. Private health insurance"},
                {"value": "has_donations", "label": "3. Charity donations"},
                {"value": "has_work_expenses", "label": "4. Work-related expenses (tools, uniforms, etc.)"},
                {"value": "has_foreign_income", "label": "5. Foreign income or assets"},
                {"value": "has_super_contributions", "label": "6. Additional superannuation contributions"},
                {"value": "has_spouse", "label": "7. Married or in a de facto relationship"},
                {"value": "none", "label": "8. None of the above"}
            ]
        
        # Restructure to match frontend expectations
        return {
            "phase": phase,
            "question": question_data["question"],
            "current_question": question_data["progress"]["current"],
            "total_questions": question_data["progress"]["total"],
            "progress": question_data["progress"]["percentage"],
            "question_type": question_type,
            "options": formatted_options,
            "required": True,
            "is_complete": question_data.get("is_complete", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in get_next_question: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        print(f"Session ID: {session_id}, Current Phase: {current_phase}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get next question: {str(e)}"
        )


@router.post("/{session_id}/answer")
async def submit_answer(
    session_id: str,
    answer_data: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Submit an answer to the current question and store in memory.
    
    Args:
        session_id: Temporary session ID
        answer_data: Dict with 'answer' and 'phase' fields
        current_user: Authenticated user
    
    Returns:
        Success status
    """
    try:
        answer = answer_data.get("answer")
        phase = answer_data.get("phase")
        
        if answer is None or phase is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing 'answer' or 'phase' in request"
            )
        
        # Get current collected info from memory storage
        collected_info = _guided_chat_storage.get(session_id, {})
        
        # Parse answer and update collected info
        parse_result = GuidedChecklistService.parse_answer(phase, answer, collected_info)
        
        if parse_result["parsed_value"] is not None:
            field = parse_result["field"]
            
            # Handle multi-select (dict of boolean values)
            if isinstance(parse_result["parsed_value"], dict):
                # Special handling for "none" in additional phase
                if phase == "additional" and "none" in answer:
                    # If "none" is selected, clear all additional fields
                    additional_fields = ["has_hecs_help", "has_private_health", "has_donations", 
                                       "has_work_expenses", "has_foreign_income", 
                                       "has_super_contributions", "has_spouse"]
                    for field_name in additional_fields:
                        collected_info[field_name] = False
                else:
                    # Remove "none" if it exists when other options are selected
                    if "none" in parse_result["parsed_value"]:
                        del parse_result["parsed_value"]["none"]
                    collected_info.update(parse_result["parsed_value"])
            else:
                collected_info[field] = parse_result["parsed_value"]
        
        # Store updated collected_info in memory
        _guided_chat_storage[session_id] = collected_info
        
        return {
            "status": "success",
            "message": "Answer stored successfully",
            "needs_follow_up": parse_result.get("needs_follow_up", False),
            "follow_up_question": parse_result.get("follow_up_question")
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in submit_answer: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store answer: {str(e)}"
        )
