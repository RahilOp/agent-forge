from agents.tools.WebSearch import web_search
from agents.tools.WikipediaSearch import wikipedia_search_tool
from agents.tools.Calculator import calculator_tool
from agents.tools.DateTimeTool import datetime_tool
from agents.Agent import ToolCallingAgent

import yaml
import os

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv(".env")


def load_prompt_template(file_path: str) -> str:
    try:
        with open(file_path, "r") as template_file:
            return template_file.read().strip()
    except FileNotFoundError:
        raise ValueError(f"Prompt template file not found: {file_path}")


def load_config(file_path: str = "config.yaml") -> Dict[str, Any]:
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


# Map tool names to actual tool objects
TOOL_MAP = {
    "web_search": web_search,
    "wikipedia_search": wikipedia_search_tool,
    "calculator": calculator_tool,
    "datetime_tool": datetime_tool,
}


def get_tools(tool_names: List[str]) -> List[Any]:
    return [TOOL_MAP[name] for name in tool_names if name in TOOL_MAP]


# Initialize the LLM (supports OpenAI API or any compatible endpoint)
model = ChatOpenAI(
    model=os.getenv("LLM_MODEL_NAME", "gpt-4o"),
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE", None),
    temperature=0.0,
    streaming=True,
)


def initialize_agent(agent_keyword: str) -> ToolCallingAgent:
    """Initialize an agent from YAML configuration."""
    config = load_config()
    agent_config = config["agents"].get(agent_keyword)
    if not agent_config:
        raise ValueError(f"No configuration found for agent: {agent_keyword}")

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", load_prompt_template(agent_config["prompt_template"])),
        MessagesPlaceholder(variable_name="chat_history"),
        MessagesPlaceholder(variable_name="user_preferences"),
        ("human", "{input}"),
        ("ai", "{agent_scratchpad}"),
    ])

    tools = get_tools(agent_config["tools"])

    agent = ToolCallingAgent(
        name=agent_config["name"],
        prompt=prompt_template,
        tools=tools,
        model=model,
    )

    return agent
