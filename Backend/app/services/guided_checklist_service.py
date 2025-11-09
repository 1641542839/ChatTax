"""
Guided Checklist Service for Path 2: Guided Conversation.

Manages a structured question-answer flow to collect tax identity information
through natural conversation.
"""
from typing import Dict, List, Optional
from enum import Enum


class QuestionPhase(str, Enum):
    """Phases of the guided conversation."""
    FILING_STATUS = "filing_status"
    EMPLOYMENT = "employment"
    STATE = "state"
    DEPENDENTS = "dependents"
    INCOME = "income"
    HOME = "home"
    INVESTMENTS = "investments"
    BUSINESS = "business"
    ADDITIONAL = "additional"
    COMPLETE = "complete"


class GuidedChecklistService:
    """Service for managing guided conversation flow."""
    
    # Question templates for each phase
    QUESTIONS = {
        QuestionPhase.FILING_STATUS: {
            "question": "让我帮您生成个性化的税务清单！首先，请问您的报税身份是什么？\n\n请选择：\n1. 单身 (Single)\n2. 已婚联合报税 (Married Filing Jointly)\n3. 已婚分开报税 (Married Filing Separately)\n4. 户主 (Head of Household)",
            "field": "filing_status",
            "options": {
                "1": "single",
                "单身": "single",
                "single": "single",
                "2": "married_filing_jointly",
                "已婚联合": "married_filing_jointly",
                "married jointly": "married_filing_jointly",
                "3": "married_filing_separately",
                "已婚分开": "married_filing_separately",
                "married separately": "married_filing_separately",
                "4": "head_of_household",
                "户主": "head_of_household",
                "head of household": "head_of_household"
            }
        },
        QuestionPhase.EMPLOYMENT: {
            "question": "您的主要就业类型是什么？\n\n请选择：\n1. W2员工（受雇）\n2. 自雇人士\n3. 企业主\n4. 自由职业者\n5. 退休人士\n6. 学生",
            "field": "employment_type",
            "options": {
                "1": "W2_employee",
                "w2": "W2_employee",
                "employee": "W2_employee",
                "2": "self_employed",
                "自雇": "self_employed",
                "self employed": "self_employed",
                "3": "business_owner",
                "企业主": "business_owner",
                "business owner": "business_owner",
                "4": "freelancer",
                "自由职业": "freelancer",
                "freelancer": "freelancer",
                "5": "retired",
                "退休": "retired",
                "retired": "retired",
                "6": "student",
                "学生": "student",
                "student": "student"
            }
        },
        QuestionPhase.STATE: {
            "question": "您居住在美国哪个州？（请输入州的两字母缩写，如 CA, NY, TX）",
            "field": "state",
            "validation": "state_code"
        },
        QuestionPhase.DEPENDENTS: {
            "question": "您有需要抚养的人（如孩子）吗？\n\n请回答：有 / 没有",
            "field": "has_dependents",
            "options": {
                "有": True,
                "yes": True,
                "是": True,
                "没有": False,
                "no": False,
                "否": False
            },
            "follow_up": {
                "condition": True,
                "question": "请问有几位需要抚养的人？",
                "field": "num_dependents",
                "validation": "number"
            }
        },
        QuestionPhase.INCOME: {
            "question": "您2024年的年收入范围大约是多少？\n\n1. 低于$50,000\n2. $50,000 - $75,000\n3. $75,000 - $100,000\n4. $100,000 - $150,000\n5. $150,000以上",
            "field": "annual_income_range",
            "options": {
                "1": "under_50k",
                "2": "50k-75k",
                "3": "75k-100k",
                "4": "100k-150k",
                "5": "150k+"
            }
        },
        QuestionPhase.HOME: {
            "question": "您拥有自己的房产吗？",
            "field": "owns_home",
            "options": {
                "有": True,
                "yes": True,
                "是": True,
                "拥有": True,
                "没有": False,
                "no": False,
                "否": False,
                "租": False
            }
        },
        QuestionPhase.INVESTMENTS: {
            "question": "您有投资吗？（如股票、债券、加密货币等）",
            "field": "has_investments",
            "options": {
                "有": True,
                "yes": True,
                "是": True,
                "没有": False,
                "no": False,
                "否": False
            }
        },
        QuestionPhase.BUSINESS: {
            "question": "您经营企业或有副业收入吗？",
            "field": "has_business",
            "options": {
                "有": True,
                "yes": True,
                "是": True,
                "没有": False,
                "no": False,
                "否": False
            }
        },
        QuestionPhase.ADDITIONAL: {
            "question": "最后几个问题！您是否有以下情况？（可以多选，用逗号分隔）\n\n1. 出租房产\n2. 海外收入\n3. 退休金供款（401k/IRA）\n4. 教育支出\n5. 大额医疗费用\n6. 慈善捐款\n\n如果都没有，请回答'没有'。",
            "field": "additional_items",
            "multi_select": True,
            "options": {
                "1": "has_rental_property",
                "出租": "has_rental_property",
                "rental": "has_rental_property",
                "2": "has_foreign_income",
                "海外": "has_foreign_income",
                "foreign": "has_foreign_income",
                "3": "has_retirement_contributions",
                "退休金": "has_retirement_contributions",
                "401k": "has_retirement_contributions",
                "ira": "has_retirement_contributions",
                "retirement": "has_retirement_contributions",
                "4": "has_education_expenses",
                "教育": "has_education_expenses",
                "education": "has_education_expenses",
                "5": "has_medical_expenses",
                "医疗": "has_medical_expenses",
                "medical": "has_medical_expenses",
                "6": "has_charitable_donations",
                "慈善": "has_charitable_donations",
                "charitable": "has_charitable_donations",
                "donation": "has_charitable_donations"
            }
        }
    }
    
    # Phase progression order
    PHASE_ORDER = [
        QuestionPhase.FILING_STATUS,
        QuestionPhase.EMPLOYMENT,
        QuestionPhase.STATE,
        QuestionPhase.DEPENDENTS,
        QuestionPhase.INCOME,
        QuestionPhase.HOME,
        QuestionPhase.INVESTMENTS,
        QuestionPhase.BUSINESS,
        QuestionPhase.ADDITIONAL,
        QuestionPhase.COMPLETE
    ]
    
    @staticmethod
    def get_initial_question() -> Dict:
        """
        Get the first question to start guided conversation.
        
        Returns:
            Dictionary with question and metadata
        """
        return {
            "phase": QuestionPhase.FILING_STATUS,
            "question": GuidedChecklistService.QUESTIONS[QuestionPhase.FILING_STATUS]["question"],
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
                    "question": "✅ 太好了！我已经收集到足够的信息。现在可以为您生成个性化的税务清单了！",
                    "progress": {
                        "current": len(GuidedChecklistService.PHASE_ORDER) - 1,
                        "total": len(GuidedChecklistService.PHASE_ORDER) - 1,
                        "percentage": 100
                    },
                    "is_complete": True
                }
            
            next_phase = GuidedChecklistService.PHASE_ORDER[next_index]
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
    def parse_answer(phase: str, answer: str, collected_info: Dict) -> Dict:
        """
        Parse user's answer and extract structured data.
        
        Args:
            phase: Current question phase
            answer: User's answer text
            collected_info: Existing collected information
            
        Returns:
            Dictionary with parsed values and follow-up question if needed
        """
        try:
            question_data = GuidedChecklistService.QUESTIONS[QuestionPhase(phase)]
            answer_lower = answer.lower().strip()
            
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
                if not selected_items and ("没有" in answer_lower or "no" in answer_lower):
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
                
                if validation_type == "state_code":
                    # Validate state code (2 letters)
                    state_code = answer_lower.strip().upper()
                    if len(state_code) == 2 and state_code.isalpha():
                        result["parsed_value"] = state_code
                
                elif validation_type == "number":
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
        Check if enough information has been collected.
        
        Args:
            collected_info: Collected identity information
            
        Returns:
            Boolean indicating if ready for checklist generation
        """
        required_fields = ["filing_status", "employment_type", "state", "has_dependents"]
        
        return all(field in collected_info and collected_info[field] is not None for field in required_fields)
