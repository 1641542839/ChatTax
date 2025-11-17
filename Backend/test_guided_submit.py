"""
Test script for guided chat submit answer endpoint
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_guided_submit():
    """Test submitting an answer to guided chat"""
    
    # Step 0: Register (ignore if already exists)
    print("0. Registering user...")
    requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "test123456",
            "full_name": "Test User"
        }
    )
    
    # Step 1: Login
    print("1. Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "test123456"
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    print(f"✅ Logged in successfully")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Create session
    print("\n2. Creating session...")
    session_response = requests.post(
        f"{BASE_URL}/api/session/create",
        headers=headers,
        json={}
    )
    
    if session_response.status_code != 200:
        print(f"❌ Session creation failed: {session_response.status_code}")
        print(f"Response: {session_response.text}")
        return
    
    session_id = session_response.json()["session_id"]
    print(f"✅ Session created: {session_id}")
    
    # Step 3: Get initial question
    print("\n3. Getting initial question...")
    initial_response = requests.get(
        f"{BASE_URL}/api/guided-chat/{session_id}/initial",
        headers=headers
    )
    
    if initial_response.status_code != 200:
        print(f"❌ Get initial question failed: {initial_response.status_code}")
        print(f"Response: {initial_response.text}")
        return
    
    question = initial_response.json()
    print(f"✅ Got initial question:")
    print(f"   Phase: {question['phase']}")
    print(f"   Question: {question['question']}")
    print(f"   Type: {question['question_type']}")
    print(f"   Options: {len(question.get('options', []))} options")
    
    # Step 4: Submit answer
    print("\n4. Submitting answer...")
    answer_data = {
        "answer": "resident",  # Answer to residency question
        "phase": question["phase"]
    }
    
    print(f"   Payload: {json.dumps(answer_data, indent=2)}")
    
    submit_response = requests.post(
        f"{BASE_URL}/api/guided-chat/{session_id}/answer",
        headers=headers,
        json=answer_data
    )
    
    print(f"   Status Code: {submit_response.status_code}")
    print(f"   Response: {submit_response.text}")
    
    if submit_response.status_code == 200:
        print(f"✅ Answer submitted successfully!")
        result = submit_response.json()
        print(f"   Status: {result.get('status')}")
        print(f"   Message: {result.get('message')}")
    else:
        print(f"❌ Submit answer failed: {submit_response.status_code}")
        print(f"   Error: {submit_response.text}")

if __name__ == "__main__":
    test_guided_submit()
