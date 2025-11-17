"""
Migration script to remove session_type column from chat_sessions table.

This removes the unnecessary session_type field that was previously used
to distinguish between free_chat and guided_chat sessions. Guided chat
no longer creates sessions, making this field obsolete.

Usage:
    python scripts/remove_session_type.py
"""
import sqlite3
import os
import sys

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings


def remove_session_type_column():
    """Remove session_type column from chat_sessions table."""
    db_path = settings.database_url.replace('sqlite:///', '')
    
    print(f"Connecting to database: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if session_type column exists
        cursor.execute("PRAGMA table_info(chat_sessions)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'session_type' not in column_names:
            print("✓ Column 'session_type' does not exist. No migration needed.")
            return
        
        print("Found 'session_type' column. Proceeding with removal...")
        
        # SQLite doesn't support DROP COLUMN directly for older versions
        # We need to recreate the table without the column
        
        # 1. Get current table schema
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='chat_sessions'")
        original_schema = cursor.fetchone()[0]
        print(f"\nOriginal schema:\n{original_schema}\n")
        
        # 2. Create new table without session_type
        cursor.execute("""
            CREATE TABLE chat_sessions_new (
                id INTEGER PRIMARY KEY,
                session_id VARCHAR UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                title VARCHAR,
                conversation_history JSON,
                extracted_identity JSON,
                checklist_id INTEGER,
                checklist_generated BOOLEAN DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(checklist_id) REFERENCES checklists(id)
            )
        """)
        print("✓ Created new table schema without session_type")
        
        # 3. Copy data from old table to new table (excluding session_type)
        cursor.execute("""
            INSERT INTO chat_sessions_new 
            (id, session_id, user_id, title, conversation_history, extracted_identity, 
             checklist_id, checklist_generated, is_active, created_at, updated_at)
            SELECT id, session_id, user_id, title, conversation_history, extracted_identity,
                   checklist_id, checklist_generated, is_active, created_at, updated_at
            FROM chat_sessions
        """)
        rows_copied = cursor.rowcount
        print(f"✓ Copied {rows_copied} rows to new table")
        
        # 4. Drop old table
        cursor.execute("DROP TABLE chat_sessions")
        print("✓ Dropped old table")
        
        # 5. Rename new table to original name
        cursor.execute("ALTER TABLE chat_sessions_new RENAME TO chat_sessions")
        print("✓ Renamed new table to chat_sessions")
        
        # 6. Recreate indexes
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_chat_sessions_session_id ON chat_sessions (session_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_chat_sessions_id ON chat_sessions (id)")
        print("✓ Recreated indexes")
        
        # Commit changes
        conn.commit()
        print("\n✅ Migration completed successfully!")
        print(f"✅ Removed session_type column from chat_sessions table")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Removing session_type column from chat_sessions table")
    print("=" * 60)
    remove_session_type_column()
