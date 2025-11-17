"""
Migration script to add session_type column to chat_sessions table.
Run this script once to update the database schema.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import engine, SessionLocal
from sqlalchemy import text


def add_session_type_column():
    """Add session_type column to chat_sessions table."""
    
    db = SessionLocal()
    
    try:
        # Check if column already exists
        result = db.execute(text("PRAGMA table_info(chat_sessions)"))
        columns = [row[1] for row in result]
        
        if 'session_type' in columns:
            print("✅ session_type column already exists!")
            return
        
        print("🔧 Adding session_type column to chat_sessions table...")
        
        # Add the column with default value 'free_chat'
        db.execute(text(
            "ALTER TABLE chat_sessions ADD COLUMN session_type VARCHAR DEFAULT 'free_chat'"
        ))
        db.commit()
        
        print("✅ Successfully added session_type column!")
        print("📊 Updating existing sessions to 'free_chat' type...")
        
        # Update any NULL values to 'free_chat' (shouldn't be any due to DEFAULT, but just in case)
        result = db.execute(text(
            "UPDATE chat_sessions SET session_type = 'free_chat' WHERE session_type IS NULL"
        ))
        db.commit()
        
        updated_count = result.rowcount
        print(f"✅ Updated {updated_count} existing sessions to 'free_chat' type")
        
        # Verify the change
        result = db.execute(text("PRAGMA table_info(chat_sessions)"))
        print("\n📋 Updated table structure:")
        for row in result:
            print(f"  {row[1]}: {row[2]}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Running database migration: Add session_type column")
    print("=" * 60)
    
    add_session_type_column()
    
    print("\n" + "=" * 60)
    print("✅ Migration completed successfully!")
    print("=" * 60)
    print("\nNow you can:")
    print("  1. Restart your backend server")
    print("  2. Free chat and guided chat will use separate sessions")
    print("  3. Use ?session_type=free_chat or ?session_type=guided_chat to filter sessions")
