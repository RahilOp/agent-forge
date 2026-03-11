"""
SQLite-backed chat message history compatible with LangChain's BaseChatMessageHistory.

Replaces the Elasticsearch-based history with a lightweight, zero-dependency-infrastructure
alternative that anyone can run locally.
"""

import json
import sqlite3
import os
from time import time
from typing import List

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import BaseMessage, message_to_dict, messages_from_dict


DB_PATH = os.getenv("DB_PATH", "chatagent.db")


class SQLiteChatMessageHistory(BaseChatMessageHistory):
    """Chat message history stored in SQLite.

    Args:
        session_id: Unique key for the chat session.
        session_title: Display title for the session.
        db_path: Path to the SQLite database file.
    """

    def __init__(self, session_id: str, session_title: str = "New Chat", db_path: str = None):
        self.session_id = session_id
        self.session_title = session_title
        self.db_path = db_path or DB_PATH
        self._ensure_table()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_table(self):
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                session_title TEXT DEFAULT 'New Chat',
                message_type TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_session_id ON chat_messages(session_id)")
        conn.commit()
        conn.close()

    @property
    def messages(self) -> List[BaseMessage]:
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT metadata FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
            (self.session_id,),
        ).fetchall()
        conn.close()

        items = []
        for row in rows:
            meta = json.loads(row["metadata"])
            if "langchain_message" in meta:
                items.append(meta["langchain_message"])
        return messages_from_dict(items)

    def add_message(self, message: BaseMessage) -> None:
        msg_dict = message_to_dict(message)
        message_type = msg_dict.get("type", "unknown")
        content = message.content

        metadata = {
            "langchain_message": msg_dict,
            "tool_output": msg_dict.get("data", {}).get("response_metadata", {}).get("tool_output", []),
        }

        conn = self._get_conn()
        conn.execute(
            "INSERT INTO chat_messages (session_id, session_title, message_type, content, metadata) VALUES (?, ?, ?, ?, ?)",
            (self.session_id, self.session_title, message_type, content, json.dumps(metadata, ensure_ascii=False)),
        )
        conn.commit()
        conn.close()

    def clear(self) -> None:
        conn = self._get_conn()
        conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (self.session_id,))
        conn.commit()
        conn.close()
