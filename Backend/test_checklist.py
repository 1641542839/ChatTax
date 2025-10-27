"""
Test script for checklist generation endpoint.

Run this to test the /api/checklist/generate endpoint.
"""
import requests
import json

# Base URL
BASE_URL = "http://localhost:8000"

def test_generate_checklist():
    """Test checklist generation endpoint."""
    
    print("Testing /api/checklist/generate endpoint...")
    print("-" * 50)
    
    # Sample request
    request_data = {
        "user_id": 1,
        "identity_info": {
            "employment_status": "employed",
            "income_sources": ["salary", "investment", "rental"],
            "has_dependents": True,
            "has_investment": True,
            "has_rental_property": True,
            "is_first_time_filer": False,
            "additional_info": {
                "industry": "technology",
                "location": "NSW",
                "has_home_office": True
            }
        }
    }
    
    print("\n📤 Request:")
    print(json.dumps(request_data, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/checklist/generate",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            print("\n✅ Success! Checklist generated:")
            result = response.json()
            print(json.dumps(result, indent=2))
            
            print(f"\n📊 Summary:")
            print(f"   - Checklist ID: {result['id']}")
            print(f"   - User ID: {result['user_id']}")
            print(f"   - Total items: {len(result['items'])}")
            print(f"   - Created at: {result['created_at']}")
            
            print(f"\n📋 Items breakdown:")
            for item in result['items']:
                status_emoji = {"todo": "⚪", "doing": "🔵", "done": "✅"}.get(item['status'], "⚪")
                priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(item['priority'], "⚪")
                print(f"   {status_emoji} {priority_emoji} [{item['category']}] {item['title']}")
                print(f"      └─ {item['description'][:60]}...")
            
            return result
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"\n❌ Exception: {e}")
        return None


def test_get_checklist(checklist_id: int, user_id: int):
    """Test getting a checklist."""
    
    print(f"\n\nTesting GET /api/checklist/{checklist_id}...")
    print("-" * 50)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/checklist/{checklist_id}",
            params={"user_id": user_id}
        )
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("\n✅ Checklist retrieved successfully!")
            result = response.json()
            print(f"   - Total items: {len(result['items'])}")
            
            # Count by status
            status_counts = {"todo": 0, "doing": 0, "done": 0}
            for item in result['items']:
                status_counts[item['status']] += 1
            
            print(f"   - Todo: {status_counts['todo']}")
            print(f"   - Doing: {status_counts['doing']}")
            print(f"   - Done: {status_counts['done']}")
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"\n❌ Exception: {e}")


def test_update_item_status(checklist_id: int, user_id: int, item_id: str, new_status: str):
    """Test updating an item's status."""
    
    print(f"\n\nTesting PATCH /api/checklist/{checklist_id}/status...")
    print("-" * 50)
    
    request_data = {
        "item_id": item_id,
        "status": new_status
    }
    
    print(f"\n📤 Updating item {item_id} to status '{new_status}'")
    
    try:
        response = requests.patch(
            f"{BASE_URL}/api/checklist/{checklist_id}/status",
            json=request_data,
            params={"user_id": user_id}
        )
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"\n✅ Item status updated successfully!")
            result = response.json()
            
            # Find and display the updated item
            for item in result['items']:
                if item['id'] == item_id:
                    status_emoji = {"todo": "⚪", "doing": "🔵", "done": "✅"}.get(item['status'], "⚪")
                    print(f"   {status_emoji} {item['title']} - Status: {item['status']}")
                    break
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"\n❌ Exception: {e}")


if __name__ == "__main__":
    print("🚀 ChatTax Checklist API Test")
    print("=" * 50)
    
    # Test 1: Generate checklist
    result = test_generate_checklist()
    
    if result:
        checklist_id = result['id']
        user_id = result['user_id']
        first_item_id = result['items'][0]['id'] if result['items'] else None
        
        # Test 2: Get checklist
        test_get_checklist(checklist_id, user_id)
        
        # Test 3: Update item status
        if first_item_id:
            test_update_item_status(checklist_id, user_id, first_item_id, "doing")
            test_update_item_status(checklist_id, user_id, first_item_id, "done")
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
    else:
        print("\n❌ Initial test failed. Make sure the server is running.")
