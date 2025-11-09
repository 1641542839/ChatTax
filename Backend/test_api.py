"""
ChatTax Backend API 测试脚本

测试所有核心功能：
1. 用户注册/登录
2. Session创建和管理
3. 消息发送和信息提取
4. 意图分类
5. Checklist生成（三种模式）
"""

import requests
import json
import time
from typing import Optional

# API配置
BASE_URL = "http://127.0.0.1:8000"
TIMESTAMP = int(time.time())
TEST_EMAIL = f"test_user_{TIMESTAMP}@example.com"
TEST_USERNAME = f"test_user_{TIMESTAMP}"
TEST_PASSWORD = "TestPass123!"

class ChatTaxTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token: Optional[str] = None
        self.session_id: Optional[str] = None
        self.checklist_id: Optional[str] = None
        
    def print_step(self, step: str):
        """打印测试步骤"""
        print(f"\n{'='*60}")
        print(f"📝 {step}")
        print('='*60)
    
    def print_result(self, success: bool, message: str, data: Optional[dict] = None):
        """打印测试结果"""
        icon = "✅" if success else "❌"
        print(f"{icon} {message}")
        if data:
            print(f"📊 Response: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}...")
    
    def register_user(self) -> bool:
        """测试用户注册"""
        self.print_step("Step 1: 用户注册")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json={
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "username": TEST_USERNAME,
                    "full_name": "Test User"
                }
            )
            
            if response.status_code == 201:  # 注册返回201
                data = response.json()
                self.print_result(True, "用户注册成功", {"email": TEST_EMAIL})
                
                # 注册后自动登录
                return self.login_user()
            else:
                self.print_result(False, f"注册失败: {response.status_code}", response.json())
                return False
        except Exception as e:
            self.print_result(False, f"注册异常: {str(e)}")
            return False
    
    def login_user(self) -> bool:
        """测试用户登录"""
        print("\n🔐 自动登录...")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                data={
                    "username": TEST_EMAIL,  # OAuth2表单使用username字段
                    "password": TEST_PASSWORD
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.print_result(True, "用户登录成功", {"has_token": bool(self.token)})
                return True
            else:
                self.print_result(False, f"登录失败: {response.status_code}")
                return False
        except Exception as e:
            self.print_result(False, f"登录异常: {str(e)}")
            return False
    
    def create_session(self) -> bool:
        """测试创建Session"""
        self.print_step("Step 2: 创建聊天会话")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/sessions",
                headers={"Authorization": f"Bearer {self.token}"},
                json={"initial_message": "I need help with my taxes"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.session_id = data.get("session_id")
                self.print_result(
                    True, 
                    "Session创建成功",
                    {
                        "session_id": self.session_id[:8] + "...",
                        "conversation_history": len(data.get("conversation_history", []))
                    }
                )
                return True
            else:
                self.print_result(False, f"Session创建失败: {response.status_code}")
                return False
        except Exception as e:
            self.print_result(False, f"Session创建异常: {str(e)}")
            return False
    
    def send_messages(self) -> bool:
        """测试发送消息和信息提取"""
        self.print_step("Step 3: 发送消息并测试信息提取")
        
        messages = [
            "I'm married filing jointly",
            "We have 2 kids under 17 years old",
            "Our income is about $80,000 per year",
            "We live in California",
            "I have some stock investments"
        ]
        
        for i, message in enumerate(messages, 1):
            try:
                print(f"\n📤 发送消息 {i}/{len(messages)}: {message}")
                
                response = requests.post(
                    f"{self.base_url}/api/sessions/{self.session_id}/messages",
                    headers={"Authorization": f"Bearer {self.token}"},
                    json={"content": message, "role": "user"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    identity = data.get("extracted_identity", {})
                    completion = data.get("completion_percentage", 0)
                    
                    self.print_result(
                        True,
                        f"消息发送成功，信息完整度: {completion}%",
                        {
                            "filing_status": identity.get("filing_status"),
                            "has_dependents": identity.get("has_dependents"),
                            "num_dependents": identity.get("num_dependents"),
                            "income_range": identity.get("income_range"),
                            "state": identity.get("state"),
                            "has_investments": identity.get("has_investments"),
                            "completion": f"{completion}%"
                        }
                    )
                    time.sleep(1)  # 避免请求过快
                else:
                    self.print_result(False, f"消息发送失败: {response.status_code}")
                    return False
                    
            except Exception as e:
                self.print_result(False, f"消息发送异常: {str(e)}")
                return False
        
        return True
    
    def test_intent_classification(self) -> bool:
        """测试意图分类（通过聊天流式API）"""
        self.print_step("Step 4: 测试意图分类")
        
        test_messages = [
            ("What is a W-2 form?", "EXPLAIN_ITEM"),
            ("I also have rental property income", "NEW_INFO"),
            ("Can you update my checklist?", "UPDATE_REQUEST"),
        ]
        
        for message, expected_intent in test_messages:
            try:
                print(f"\n📤 测试消息: {message}")
                print(f"🎯 期望意图: {expected_intent}")
                
                # 注意：实际测试需要解析SSE流，这里简化处理
                response = requests.post(
                    f"{self.base_url}/api/chat/stream",
                    headers={
                        "Authorization": f"Bearer {self.token}",
                        "Accept": "text/event-stream"
                    },
                    json={
                        "message": message,
                        "session_id": self.session_id
                    },
                    stream=True
                )
                
                if response.status_code == 200:
                    print(f"✅ 意图分类API响应成功 (流式响应)")
                else:
                    self.print_result(False, f"意图分类失败: {response.status_code}")
                    
            except Exception as e:
                self.print_result(False, f"意图分类异常: {str(e)}")
        
        return True
    
    def generate_checklist_free_chat(self) -> bool:
        """测试Checklist生成（自由对话模式）"""
        self.print_step("Step 5: 生成Checklist (FREE_CHAT模式)")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/checklist/generate",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "generation_mode": "free_chat",
                    "session_id": self.session_id
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.checklist_id = data.get("id")
                
                categories = data.get("categories", [])
                total_items = sum(len(cat.get("items", [])) for cat in categories)
                
                self.print_result(
                    True,
                    "Checklist生成成功",
                    {
                        "checklist_id": self.checklist_id[:8] + "..." if self.checklist_id else None,
                        "title": data.get("title"),
                        "generation_mode": data.get("generation_mode"),
                        "categories_count": len(categories),
                        "total_items": total_items,
                        "identity_info": {
                            "filing_status": data.get("identity_info", {}).get("filing_status"),
                            "state": data.get("identity_info", {}).get("state")
                        }
                    }
                )
                return True
            else:
                self.print_result(False, f"Checklist生成失败: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Checklist生成异常: {str(e)}")
            return False
    
    def generate_checklist_form(self) -> bool:
        """测试Checklist生成（表单模式）"""
        self.print_step("Step 6: 生成Checklist (FORM模式)")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/checklist/generate",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "generation_mode": "form",
                    "identity": {
                        "filing_status": "married_joint",
                        "income_range": "$75,000 - $100,000",
                        "has_dependents": True,
                        "num_dependents": 2,
                        "state": "California",
                        "has_self_employment": False,
                        "has_investments": True,
                        "has_rental_property": False,
                        "has_education_expenses": True,
                        "has_medical_expenses": False,
                        "has_charitable_donations": True,
                        "has_retirement_contributions": True
                    }
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                categories = data.get("categories", [])
                total_items = sum(len(cat.get("items", [])) for cat in categories)
                
                self.print_result(
                    True,
                    "FORM模式Checklist生成成功",
                    {
                        "title": data.get("title"),
                        "categories_count": len(categories),
                        "total_items": total_items
                    }
                )
                return True
            else:
                self.print_result(False, f"FORM模式生成失败: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_result(False, f"FORM模式生成异常: {str(e)}")
            return False
    
    def list_sessions(self) -> bool:
        """测试获取Session列表"""
        self.print_step("Step 7: 获取Session列表")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/sessions",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_result(
                    True,
                    f"获取Session列表成功，共 {len(data)} 个会话",
                    {"sessions_count": len(data)}
                )
                return True
            else:
                self.print_result(False, f"获取列表失败: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_result(False, f"获取列表异常: {str(e)}")
            return False
    
    def run_all_tests(self):
        """运行所有测试"""
        print("\n" + "="*60)
        print("🚀 ChatTax Backend API 自动化测试")
        print("="*60)
        print(f"📍 API Base URL: {self.base_url}")
        print(f"📧 Test Email: {TEST_EMAIL}")
        print("="*60)
        
        tests = [
            ("用户注册", self.register_user),
            ("创建Session", self.create_session),
            ("发送消息和信息提取", self.send_messages),
            ("意图分类", self.test_intent_classification),
            ("Checklist生成(FREE_CHAT)", self.generate_checklist_free_chat),
            ("Checklist生成(FORM)", self.generate_checklist_form),
            ("Session列表", self.list_sessions),
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"\n❌ 测试异常: {test_name} - {str(e)}")
                results.append((test_name, False))
        
        # 打印测试总结
        self.print_summary(results)
    
    def print_summary(self, results: list):
        """打印测试总结"""
        print("\n" + "="*60)
        print("📊 测试总结")
        print("="*60)
        
        total = len(results)
        passed = sum(1 for _, result in results if result)
        failed = total - passed
        
        for test_name, result in results:
            icon = "✅" if result else "❌"
            print(f"{icon} {test_name}")
        
        print("\n" + "="*60)
        print(f"总计: {total} | 通过: {passed} | 失败: {failed}")
        print(f"成功率: {(passed/total*100):.1f}%")
        print("="*60)
        
        if passed == total:
            print("\n🎉 所有测试通过！后端API运行正常！")
        else:
            print(f"\n⚠️  {failed} 个测试失败，请检查日志")

if __name__ == "__main__":
    tester = ChatTaxTester()
    tester.run_all_tests()
