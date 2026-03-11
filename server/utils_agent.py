"""
Utility functions for the agent server.
Re-exports database functions for backward compatibility.
"""

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Optional

from database import (
    get_messages_by_session,
    get_past_n_messages,
    get_unique_sessions,
    get_sessions_for_user,
    delete_session,
    get_latest_session_title,
)

load_dotenv(".env")


def format_past_messages(session_id: str, n: int = 6) -> List:
    """Get the last N messages formatted as LangChain message objects."""
    raw_messages = get_past_n_messages(session_id, n)
    messages = []
    for m in raw_messages:
        if m["type"] == "human":
            messages.append(HumanMessage(content=m["content"]))
        else:
            messages.append(AIMessage(content=m["content"]))
    return messages
