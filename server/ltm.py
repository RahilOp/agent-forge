"""
Long-Term Memory (LTM) module.

Handles extraction and management of user preferences and profile information
using LLM-powered analysis with Pydantic structured outputs.
"""

import json
import os
from openai import OpenAI
from pydantic import BaseModel
from database import get_user_memory, create_user_memory, update_user_preferences, update_user_profile


client = OpenAI(
    base_url=os.getenv("OPENAI_API_BASE", None),
    api_key=os.getenv("OPENAI_API_KEY"),
)

LLM_MODEL = os.getenv("LLM_MODEL_NAME", "gpt-4o")


class ValidityResponse(BaseModel):
    valid: bool


async def extract_long_term_memory(user_query: str) -> str:
    """Extract preference/memory information from a user message."""
    system_prompt = f"""
    You are an assistant that extracts long-term memory information from the user's message. Extract key information such as:
    - The user's job role or profession
    - Preferences or interests (e.g., hobbies, technologies they work with)
    - Recurring themes or topics
    - Personal facts they share

    Current user message:
    {user_query}

    Output a concise summary (max 15 words) capturing the user's preference, interest, or personal fact.
    """

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query},
            ],
            temperature=0,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error extracting memory: {e}")
        return None


async def get_session_title(query: str) -> str:
    """Generate a short title for a chat session based on the first query."""
    prompt = f"""You are a summarization assistant. Create a short title for a chat session based on the user's first message.

    User message: {query}

    Rules:
    - Generate a title only when the message is substantive.
    - Return 'New Chat' if a meaningful title cannot be generated.
    - Title must be 5 words or fewer.
    - Return ONLY the title, nothing else.

    Examples:
    - "Hi, I'm John" -> "New Chat"
    - "What is quantum computing?" -> "Quantum Computing Basics"
    - "Help me write a Python script" -> "Python Script Help"
    """

    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "system", "content": prompt}],
        temperature=0,
    )
    return response.choices[0].message.content.strip()


async def is_valid_for_long_term_memory(user_query: str) -> bool:
    """Determine if a user message contains information worth storing as long-term memory."""
    system_prompt = """You are a helpful assistant that evaluates whether a user's message contains personal information worth remembering for future conversations.

    Check if the user mentioned any personal facts or preferences such as:
    - Personal info (name, age, location, etc.)
    - Their profession or career
    - Hobbies, interests, likes/dislikes
    - Life events (new job, travel plans, etc.)
    - Communication style preferences
    - Technical skills or tools they use

    Return {"valid": true} if any such information is detected, otherwise {"valid": false}.
    """

    try:
        response = client.beta.chat.completions.parse(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query},
            ],
            response_format=ValidityResponse,
            temperature=0,
        )
        result = json.loads(response.choices[0].message.content)
        return result.get("valid", False)
    except Exception as e:
        print(f"Error checking memory validity: {e}")
        return False


async def get_current_preferences(user_id: str) -> dict:
    """Get current user memory (preferences + profile) from the database."""
    memory = get_user_memory(user_id)
    if memory:
        return memory
    return {"user_id": user_id, "preferences": [], "user_profile": ""}


async def ensure_user_memory_exists(user_id: str):
    """Create user memory record if it doesn't exist."""
    memory = get_user_memory(user_id)
    if not memory:
        create_user_memory(user_id)


async def add_preference(user_id: str, preference: str) -> list:
    """Add a new preference to the user's memory."""
    await ensure_user_memory_exists(user_id)
    memory = get_user_memory(user_id)
    preferences = memory["preferences"] if memory else []
    preferences.append(preference)
    update_user_preferences(user_id, preferences)
    return preferences


async def remove_preference(user_id: str, idx: int) -> list:
    """Remove a preference by index."""
    memory = get_user_memory(user_id)
    if memory and 0 <= idx < len(memory["preferences"]):
        memory["preferences"].pop(idx)
        update_user_preferences(user_id, memory["preferences"])
    return memory["preferences"] if memory else []


async def auto_update_preferences(user_id: str, user_query: str) -> list:
    """Automatically extract and store preferences from a user message."""
    await ensure_user_memory_exists(user_id)
    memory = get_user_memory(user_id)
    preferences = memory["preferences"] if memory else []

    if await is_valid_for_long_term_memory(user_query):
        new_memory = await extract_long_term_memory(user_query)
        if new_memory:
            preferences.append(new_memory)
            update_user_preferences(user_id, preferences)

    return preferences
