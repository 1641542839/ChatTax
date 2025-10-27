"""
Debug script to test PATCH endpoint directly and see the actual error.
"""
import sys
sys.path.insert(0, 'D:\\Projects\\project\\ChatTax\\Backend')

from app.services.checklist_service import ChecklistService
from app.db.database import SessionLocal
import traceback

print("🔍 Debugging PATCH endpoint issue...")
print("=" * 50)

# Create a database session
db = SessionLocal()
service = ChecklistService(db)

try:
    # Try to update item status for checklist ID 4
    checklist_id = 4
    user_id = 1
    item_id = "doc_001"
    new_status = "doing"
    
    print(f"\n📝 Attempting to update:")
    print(f"   Checklist ID: {checklist_id}")
    print(f"   User ID: {user_id}")
    print(f"   Item ID: {item_id}")
    print(f"   New Status: {new_status}")
    print("-" * 50)
    
    # Call the update method
    result = service.update_item_status(
        checklist_id=checklist_id,
        user_id=user_id,
        item_id=item_id,
        new_status=new_status
    )
    
    if result:
        print("\n✅ Update successful!")
        print(f"   Updated at: {result.updated_at}")
        
        # Find the updated item
        for item in result.items:
            if item.id == item_id:
                print(f"   Item '{item.title}' status: {item.status}")
                break
    else:
        print("\n❌ Update failed - checklist or item not found")
        
except Exception as e:
    print(f"\n❌ Error occurred:")
    print(f"   Error type: {type(e).__name__}")
    print(f"   Error message: {str(e)}")
    print("\n📋 Full traceback:")
    traceback.print_exc()
    
finally:
    db.close()
    print("\n" + "=" * 50)
    print("Debug complete")
