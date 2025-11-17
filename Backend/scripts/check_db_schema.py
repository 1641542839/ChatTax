"""
Check database schema to verify session_type column is removed.
"""
import sqlite3
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings

def check_schema():
    """Check if session_type column exists in chat_sessions table."""
    db_path = settings.database_url.replace('sqlite:///', '')
    
    print(f"Checking database: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get table schema
        cursor.execute("PRAGMA table_info(chat_sessions)")
        columns = cursor.fetchall()
        
        print("\nCurrent chat_sessions table columns:")
        print("-" * 60)
        for col in columns:
            print(f"  {col[1]:25} {col[2]:15} {'NULL' if col[3] == 0 else 'NOT NULL':10} DEFAULT: {col[4]}")
        
        # Check if session_type exists
        column_names = [col[1] for col in columns]
        if 'session_type' in column_names:
            print("\n❌ ERROR: session_type column still exists!")
            print("   Please run: python scripts/remove_session_type.py")
        else:
            print("\n✅ SUCCESS: session_type column has been removed")
            
    except Exception as e:
        print(f"\n❌ Error checking schema: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    check_schema()
