"""
Database migration script to add chat_sessions table.

This script:
1. Creates the chat_sessions table with all necessary columns
2. Adds indexes for performance
3. Sets up foreign key relationships

Run this script once to migrate the database:
    python Backend/scripts/create_chat_sessions_table.py
"""
import sqlite3
import os


def migrate_database():
    """Create chat_sessions table in the database."""
    
    # Get database path
    db_path = os.path.join("Backend", "chattax.db")
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return
    
    print(f"📂 Found database at: {db_path}")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='chat_sessions'
        """)
        
        if cursor.fetchone():
            print("⚠️  Table 'chat_sessions' already exists. Skipping creation.")
            return
        
        print("🔧 Creating chat_sessions table...")
        
        # Create chat_sessions table
        cursor.execute("""
            CREATE TABLE chat_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                title TEXT,
                conversation_history TEXT DEFAULT '[]',
                extracted_identity TEXT,
                checklist_id INTEGER,
                checklist_generated INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (checklist_id) REFERENCES checklists (id)
            )
        """)
        
        # Create indexes for performance
        cursor.execute("""
            CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_chat_sessions_checklist_id ON chat_sessions(checklist_id)
        """)
        
        # Commit changes
        conn.commit()
        
        print("✅ Successfully created chat_sessions table")
        print("✅ Created indexes: idx_chat_sessions_session_id, idx_chat_sessions_user_id, idx_chat_sessions_checklist_id")
        
        # Verify table creation
        cursor.execute("SELECT COUNT(*) FROM chat_sessions")
        count = cursor.fetchone()[0]
        print(f"✅ Table verified. Current row count: {count}")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🗄️  ChatTax Database Migration: Add chat_sessions Table")
    print("=" * 60)
    migrate_database()
    print("=" * 60)
    print("✅ Migration complete!")
    print("=" * 60)
