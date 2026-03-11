import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Optional

DB_PATH = os.getenv("DB_PATH", "chatagent.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            session_title TEXT DEFAULT 'New Chat',
            message_type TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            preferences TEXT DEFAULT '[]',
            user_profile TEXT DEFAULT '',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_session_id ON chat_messages(session_id);
        CREATE INDEX IF NOT EXISTS idx_user_id ON user_memories(user_id);
    """)
    conn.commit()
    conn.close()


# --- Chat Message Operations ---

def add_message(session_id: str, session_title: str, message_type: str, content: str, metadata: dict = None):
    conn = get_connection()
    conn.execute(
        "INSERT INTO chat_messages (session_id, session_title, message_type, content, metadata) VALUES (?, ?, ?, ?, ?)",
        (session_id, session_title, message_type, content, json.dumps(metadata or {})),
    )
    conn.commit()
    conn.close()


def get_messages_by_session(session_id: str) -> List[Dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT message_type, content, metadata FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
        (session_id,),
    ).fetchall()
    conn.close()
    return [
        {"sender": r["message_type"], "text": r["content"], "documents": json.loads(r["metadata"])}
        for r in rows
    ]


def get_past_n_messages(session_id: str, n: int = 6) -> List[Dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT message_type, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
        (session_id, n),
    ).fetchall()
    conn.close()
    return [{"type": r["message_type"], "content": r["content"]} for r in reversed(rows)]


def get_unique_sessions() -> List[Dict[str, str]]:
    conn = get_connection()
    rows = conn.execute("""
        SELECT session_id, session_title FROM chat_messages
        GROUP BY session_id
        ORDER BY MAX(created_at) DESC
    """).fetchall()
    conn.close()

    session_map = {}
    for r in rows:
        sid = r["session_id"]
        title = r["session_title"]
        if sid not in session_map:
            session_map[sid] = title
        elif session_map[sid] == "New Chat" and title != "New Chat":
            session_map[sid] = title

    return [{"session_id": sid, "session_title": title} for sid, title in session_map.items()]


def get_sessions_for_user(user_id: str) -> List[Dict[str, str]]:
    prefix = user_id.split("-")[0] if "-" in user_id else user_id
    all_sessions = get_unique_sessions()
    return [s for s in all_sessions if s["session_id"].startswith(prefix)]


def delete_session(session_id: str) -> int:
    conn = get_connection()
    cursor = conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted


def get_latest_session_title(session_id: str) -> Optional[str]:
    conn = get_connection()
    row = conn.execute(
        "SELECT session_title FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 1",
        (session_id,),
    ).fetchone()
    conn.close()
    return row["session_title"] if row else None


def update_session_title(session_id: str, new_title: str):
    conn = get_connection()
    conn.execute(
        "UPDATE chat_messages SET session_title = ? WHERE session_id = ?",
        (new_title, session_id),
    )
    conn.commit()
    conn.close()


# --- User Memory Operations ---

def get_user_memory(user_id: str) -> Optional[Dict]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM user_memories WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    if row:
        return {
            "user_id": row["user_id"],
            "preferences": json.loads(row["preferences"]),
            "user_profile": row["user_profile"],
        }
    return None


def create_user_memory(user_id: str, user_profile: str = "", preferences: list = None):
    conn = get_connection()
    conn.execute(
        "INSERT OR IGNORE INTO user_memories (user_id, preferences, user_profile) VALUES (?, ?, ?)",
        (user_id, json.dumps(preferences or []), user_profile),
    )
    conn.commit()
    conn.close()


def update_user_preferences(user_id: str, preferences: list):
    conn = get_connection()
    conn.execute(
        "UPDATE user_memories SET preferences = ?, updated_at = ? WHERE user_id = ?",
        (json.dumps(preferences), datetime.utcnow().isoformat(), user_id),
    )
    conn.commit()
    conn.close()


def update_user_profile(user_id: str, profile: str):
    conn = get_connection()
    conn.execute(
        "UPDATE user_memories SET user_profile = ?, updated_at = ? WHERE user_id = ?",
        (profile, datetime.utcnow().isoformat(), user_id),
    )
    conn.commit()
    conn.close()
