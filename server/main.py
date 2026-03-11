from typing import Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from initialize_agent import initialize_agent, load_config
from langchain_core.messages import HumanMessage, AIMessage
from database import (
    init_db,
    get_messages_by_session,
    get_past_n_messages,
    get_sessions_for_user,
    delete_session,
    get_latest_session_title,
    update_session_title,
)
from ltm import (
    get_session_title,
    get_current_preferences,
    ensure_user_memory_exists,
    add_preference,
    remove_preference,
    auto_update_preferences,
    update_user_profile as ltm_update_profile,
)
from database import update_user_profile as db_update_profile
import yaml
import os

app = FastAPI(title="ChatAgent - Multi-Tool AI Agent Platform")

# Initialize database
init_db()

# Initialize default agent
current_agent_key = "general_assistant"
agent = initialize_agent(current_agent_key)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_agent_names():
    config = load_config()
    return list(config.get("agents", {}).keys())


agent_names = get_agent_names()
AgentName = Literal[tuple(agent_names)]


@app.get("/")
def index():
    return "ChatAgent - Multi-Tool AI Agent Platform"


@app.get("/available_agents")
def available_agents():
    config = load_config()
    return [name for name in config["agents"]]


@app.put("/agent")
def set_active_agent(agent_name: AgentName):
    global agent, current_agent_key
    agent = initialize_agent(agent_name)
    current_agent_key = agent_name
    return f"Agent set to {agent_name}"


# --- Session Management ---

from uuid import uuid4


@app.get("/sessions")
async def fetch_sessions(user_id: str):
    sessions = get_sessions_for_user(user_id)
    return sessions[::-1]


@app.get("/create_session")
async def create_session(user_id: str):
    session_id = f"{user_id}-{uuid4()}"
    agent.chat_history.session_id = session_id
    agent.chat_history.session_title = "New Chat"
    return {"session_id": session_id, "session_title": "New Chat"}


@app.get("/delete_session")
async def delete_session_endpoint(session_id: str):
    deleted = delete_session(session_id)
    return f"Session {session_id} deleted. {deleted} messages removed."


@app.get("/session_history")
async def fetch_session_history(session_id: str):
    messages = get_messages_by_session(session_id)
    agent.chat_history.session_id = session_id
    return messages


# --- Chat ---

@app.get("/chat")
async def chat_service(session_id: str, user_id: str, user_input: str):
    try:
        agent.chat_history.session_id = session_id

        # Get or generate session title
        current_title = get_latest_session_title(session_id)
        if current_title is None or current_title == "New Chat":
            new_title = await get_session_title(user_input)
            agent.chat_history.session_title = new_title
            if new_title != "New Chat":
                update_session_title(session_id, new_title)
        else:
            agent.chat_history.session_title = current_title

        # Get recent context
        past_messages_raw = get_past_n_messages(session_id, n=6)
        past_messages = []
        for m in past_messages_raw:
            if m["type"] == "human":
                past_messages.append(HumanMessage(content=m["content"]))
            else:
                past_messages.append(AIMessage(content=m["content"]))

        # Get user preferences for personalization
        user_memory = await get_current_preferences(user_id)
        preferences = user_memory.get("preferences", [])
        pref_text = f"User preferences: {', '.join(preferences)}" if preferences else ""

        # Run agent
        res = agent.agent_executor.invoke({
            "input": [HumanMessage(content=user_input)],
            "chat_history": past_messages,
            "user_preferences": [HumanMessage(content=pref_text)] if pref_text else [],
        })

        # Store messages
        agent.chat_history.add_user_message(user_input)

        retrieved_docs = []
        if res["intermediate_steps"]:
            retrieved_docs = res["intermediate_steps"][0][1]
            agent.chat_history.add_ai_message(
                AIMessage(content=res["output"], response_metadata={"tool_output": retrieved_docs})
            )
        else:
            agent.chat_history.add_ai_message(AIMessage(content=res["output"]))

        # Auto-extract preferences in background
        await auto_update_preferences(user_id, user_input)

        return {"response": res["output"], "documents": retrieved_docs}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- User Preferences / Long-Term Memory ---

@app.get("/preferences")
async def get_preferences(user_id: str):
    memory = await get_current_preferences(user_id)
    return memory.get("preferences", [])


@app.get("/user_profile")
async def get_user_profile(user_id: str):
    memory = await get_current_preferences(user_id)
    return memory.get("user_profile", "")


@app.post("/add_preferences")
async def add_preferences_endpoint(user_id: str, new_preference: str):
    return await add_preference(user_id, new_preference)


@app.post("/delete_preferences")
async def delete_preferences_endpoint(user_id: str, idx: int):
    return await remove_preference(user_id, idx)


@app.post("/update_user_profile")
async def update_profile_endpoint(user_id: str, new_profile: str):
    await ensure_user_memory_exists(user_id)
    db_update_profile(user_id, new_profile)
    return new_profile


if __name__ == "__main__":
    import uvicorn
    from dotenv import load_dotenv

    load_dotenv()
    PORT = int(os.getenv("SERVER_PORT", 7778))
    uvicorn.run(app, host="0.0.0.0", port=PORT)
