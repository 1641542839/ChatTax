"""
Test script for Guided Chat endpoints
Tests the three endpoints: initial, next, and answer
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_guided_chat():
    """Test guided chat flow"""
    
    # 1. Register/Login
    print("=" * 60)
    print("1. Testing Authentication...")
    print("=" * 60)
    
    # Try to login
    login_data = {
        "username": "test@example.com",
        "password": "testpassword123"
    }
    
    response = requests.post(f"{BASE_URL}/api/token", data=login_data)
    
    if response.status_code != 200:
        # Register new user
        print("User not found, registering new user...")
        register_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = requests.post(f"{BASE_URL}/api/register", json=register_data)
        if response.status_code != 200:
            print(f"❌ Registration failed: {response.text}")
            return
        
        # Login again
        response = requests.post(f"{BASE_URL}/api/token", data=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
    
    token_data = response.json()
    access_token = token_data["access_token"]
    print(f"✅ Login successful! Token: {access_token[:20]}...")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # 2. Create chat session
    print("\n" + "=" * 60)
    print("2. Creating Chat Session...")
    print("=" * 60)
    
    response = requests.post(f"{BASE_URL}/api/sessions", headers=headers, json={})
    if response.status_code != 200:
        print(f"❌ Failed to create session: {response.text}")
        return
    
    session_data = response.json()
    session_id = session_data["session_id"]
    print(f"✅ Session created: {session_id}")
    
    # 3. Get initial question
    print("\n" + "=" * 60)
    print("3. Getting Initial Question...")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/api/guided-chat/{session_id}/initial", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get initial question: {response.status_code} {response.text}")
        return
    
    question = response.json()
    print(f"✅ Got initial question!")
    print(f"   Phase: {question['phase']}")
    print(f"   Question: {question['question'][:80]}...")
    print(f"   Progress: {question['progress']['current']}/{question['progress']['total']} ({question['progress']['percentage']}%)")
    
    # 4. Submit answer
    print("\n" + "=" * 60)
    print("4. Submitting Answer...")
    print("=" * 60)
    
    answer_data = {
        "answer": "resident",  # Answer: Australian resident
        "phase": question["phase"]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/guided-chat/{session_id}/answer",
        headers=headers,
        json=answer_data
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to submit answer: {response.status_code} {response.text}")
        return
    
    answer_result = response.json()
    print(f"✅ Answer submitted!")
    print(f"   Status: {answer_result['status']}")
    print(f"   Message: {answer_result['message']}")
    
    # 5. Get next question
    print("\n" + "=" * 60)
    print("5. Getting Next Question...")
    print("=" * 60)
    
    response = requests.get(
        f"{BASE_URL}/api/guided-chat/{session_id}/next?current_phase={question['phase']}",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to get next question: {response.status_code} {response.text}")
        return
    
    next_question = response.json()
    print(f"✅ Got next question!")
    print(f"   Phase: {next_question['phase']}")
    print(f"   Question: {next_question['question'][:80]}...")
    print(f"   Progress: {next_question['progress']['current']}/{next_question['progress']['total']} ({next_question['progress']['percentage']}%)")
    
    print("\n" + "=" * 60)
    print("✅ All Guided Chat Endpoints Working!")
    print("=" * 60)
    print(f"\nSession ID: {session_id}")
    print(f"You can continue testing in the frontend with this session.")

if __name__ == "__main__":
    try:
        test_guided_chat()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
