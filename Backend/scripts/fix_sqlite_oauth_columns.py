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
        cols = [row[1] for row in cur.fetchall()]
        print("Before columns:", cols)

        changes = 0
        if "google_id" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN google_id TEXT")
            # Create unique index to mimic model's unique=True
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
