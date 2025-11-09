"""
Utility script to add missing OAuth columns to the SQLite 'users' table.
Run this during development if you see errors like:
  sqlite3.OperationalError: no such column: users.google_id

This script is idempotent: it only adds columns if they're missing.
It also creates a unique index on google_id if not present.
"""

import sqlite3
from pathlib import Path


def ensure_oauth_columns(db_path: str = "chattax.db") -> None:
    db_file = Path(db_path)
    if not db_file.exists():
        print(f"Database file not found: {db_file.resolve()}")
        return

    conn = sqlite3.connect(str(db_file))
    try:
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(users)")
        cols_info = cur.fetchall()
        cols = [row[1] for row in cols_info]
        print("Before columns:", cols)

        changes = 0
        
        # Check if hashed_password is NOT NULL
        hashed_pw_col = next((c for c in cols_info if c[1] == 'hashed_password'), None)
        if hashed_pw_col and hashed_pw_col[3] == 1:  # notnull=1
            print("Migrating hashed_password to allow NULL for OAuth users...")
            # SQLite doesn't support ALTER COLUMN, need to recreate table
            cur.execute("PRAGMA foreign_keys=OFF")
            
            # Get current table schema
            cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
            old_schema = cur.fetchone()[0]
            
            # Create new table with nullable hashed_password
            cur.execute("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    username TEXT NOT NULL UNIQUE,
                    hashed_password TEXT,
                    full_name TEXT,
                    is_active INTEGER DEFAULT 1,
                    is_superuser INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    google_id TEXT UNIQUE,
                    avatar_url TEXT,
                    oauth_provider TEXT
                )
            """)
            
            # Copy data
            cur.execute("""
                INSERT INTO users_new 
                SELECT id, email, username, hashed_password, full_name, is_active, 
                       is_superuser, created_at, updated_at, google_id, avatar_url, oauth_provider
                FROM users
            """)
            
            # Drop old table and rename
            cur.execute("DROP TABLE users")
            cur.execute("ALTER TABLE users_new RENAME TO users")
            
            # Recreate indexes
            cur.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users(email)")
            cur.execute("CREATE INDEX IF NOT EXISTS ix_users_username ON users(username)")
            cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users(google_id)")
            
            cur.execute("PRAGMA foreign_keys=ON")
            changes += 1
            print("hashed_password is now nullable")
        
        # Add OAuth columns if missing
        if "google_id" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN google_id TEXT")
            cur.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users(google_id)"
            )
            changes += 1

        if "avatar_url" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
            changes += 1

        if "oauth_provider" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN oauth_provider TEXT")
            changes += 1

        conn.commit()

        cur.execute("PRAGMA table_info(users)")
        cols_after = [row[1] for row in cur.fetchall()]
        print("After columns:", cols_after)
        print("Changes applied:", changes)
    finally:
        conn.close()


if __name__ == "__main__":
    ensure_oauth_columns()
