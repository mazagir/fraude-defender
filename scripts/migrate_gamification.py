"""Add gamification columns to users table in Supabase."""
from sqlalchemy import create_engine, text
import os

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres.rbwrifurdkklbpyklcbs:FraudeDefender2026!@aws-1-sa-east-1.pooler.supabase.com:5432/postgres")
engine = create_engine(DB_URL)

COLUMNS = [
    ("reputation", "ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0"),
    ("badges", "ALTER TABLE users ADD COLUMN IF NOT EXISTS badges TEXT DEFAULT '[]'"),
    ("streak", "ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0"),
    ("last_scan_date", "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_scan_date TEXT"),
]

with engine.connect() as conn:
    for name, sql in COLUMNS:
        try:
            conn.execute(text(sql))
            print(f"OK: {name}")
        except Exception as e:
            print(f"SKIP: {name} - {e}")
    conn.commit()
print("Migration done")
