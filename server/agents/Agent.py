from langchain.agents import create_tool_calling_agent, AgentExecutor
from agents.ChatHistory import SQLiteChatMessageHistory


class ToolCallingAgent:
    """A configurable AI agent with tool-calling capabilities and persistent chat history.

    Each agent is initialized from a YAML config and can use a set of tools
    (web search, wikipedia, calculator, etc.) via LangChain's tool-calling interface.
    Chat history is persisted in SQLite for session management.
    """

    def __init__(
        self,
        name: str,
        prompt,
        tools: list,
        model,
        default_session_id: str = "default-session",
    ):
        self.name = name
        self.agent = create_tool_calling_agent(model, tools, prompt)
        self.agent_executor = AgentExecutor(agent=self.agent, tools=tools, return_intermediate_steps=True)
        self.chat_history = SQLiteChatMessageHistory(
            session_id=default_session_id,
            session_title="New Chat",
        )
