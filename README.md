# ChatAgent - Multi-Tool AI Agent Platform

A full-stack AI chatbot platform that demonstrates **LLM tool-calling**, **multi-agent orchestration**, and **long-term memory** — built before MCP (Model Context Protocol) existed, using raw tool-calling with structured Pydantic outputs.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![LangChain](https://img.shields.io/badge/LangChain-0.3-green)

## Key Features

### Multi-Agent Architecture
- **YAML-configured agents** — spin up new agents by adding a config block, no code changes needed
- **Dynamic agent switching** — swap between agents (General Assistant, Research Assistant) at runtime via the UI
- Each agent has its own set of tools, prompt template, and personality

### Tool Calling with Structured Outputs
- LLM decides *which* tool to call and *how* to call it based on the user query
- Tools use **Pydantic schemas** for type-safe, structured input/output
- Built-in tools: Web Search (DuckDuckGo), Wikipedia, Calculator, DateTime
- Easily extensible — add new tools by creating a Python file and registering in config

### Long-Term Memory (LTM)
- **Automatic preference extraction** — the system detects personal facts/preferences in conversation and stores them
- **Pydantic structured outputs** for memory classification (valid/invalid for storage)
- **User profile** — editable profile text that persists across sessions
- **Memory panel** — view, add, and delete stored memories from the UI

### Session Management
- Multiple chat sessions with auto-generated titles
- Full conversation history persistence (SQLite)
- Create, switch, and delete sessions

### Full-Stack Implementation
- **Backend**: FastAPI + LangChain + SQLite
- **Frontend**: React + TypeScript + Tailwind CSS + DaisyUI
- **Containerized**: Docker Compose for one-command deployment

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Chat UI  │  │ Agent Picker │  │ Memory/Profile UI │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       └───────────────┼────────────────────┘             │
│                       │ REST API                         │
├───────────────────────┼─────────────────────────────────┤
│                  FastAPI Backend                         │
│  ┌────────────────────┼────────────────────────────┐    │
│  │            Agent Orchestrator                    │    │
│  │  ┌─────────────┐  ┌──────────────────────────┐  │    │
│  │  │ YAML Config │  │   LangChain AgentExecutor │  │    │
│  │  └─────────────┘  └──────────┬───────────────┘  │    │
│  │                              │                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌┴─────────┐        │    │
│  │  │WebSearch │ │Wikipedia │ │Calculator │ ...    │    │
│  │  │(DDG)     │ │          │ │(safe eval)│        │    │
│  │  └──────────┘ └──────────┘ └──────────┘        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │  SQLite DB      │  │  Long-Term Memory (LTM)     │   │
│  │  - Chat History │  │  - Preference Extraction     │   │
│  │  - Sessions     │  │  - Pydantic Structured Out   │   │
│  │  - User Memory  │  │  - Auto Memory Detection     │   │
│  └─────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, DaisyUI |
| Backend | FastAPI, Python 3.11 |
| LLM Framework | LangChain (tool-calling agents, structured tools) |
| LLM Provider | OpenAI API (or any compatible endpoint) |
| Database | SQLite (zero-config, portable) |
| Tools | DuckDuckGo Search, Wikipedia, Calculator, DateTime |
| Infra | Docker, Docker Compose |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- An OpenAI API key (or any OpenAI-compatible endpoint)

### 1. Clone and configure

```bash
git clone https://github.com/yourusername/chatagent.git
cd chatagent

# Set up server environment
cp server/.env.example server/.env
# Edit server/.env and add your OPENAI_API_KEY

# Set up client environment
cp client/.env.example client/.env
```

### 2. Run with Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

The app will be available at `http://localhost:5173`.

### 3. Run locally (development)

**Backend:**
```bash
cd server
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

## Adding a New Tool

1. Create `server/agents/tools/YourTool.py`:

```python
from pydantic import BaseModel, Field
from langchain.tools import StructuredTool

def your_function(param: str) -> str:
    # Your logic here
    return result

class YourToolInput(BaseModel):
    param: str = Field(description="What this parameter does")

your_tool = StructuredTool.from_function(
    func=your_function,
    name="YourTool",
    args_schema=YourToolInput,
    description="When to use this tool",
)
```

2. Register in `server/initialize_agent.py` (add to `TOOL_MAP`)
3. Add to an agent in `server/config.yaml`

## Adding a New Agent

Add a block to `server/config.yaml`:

```yaml
agents:
  your_agent:
    name: "Your Agent Name"
    prompt_template: "templates/your_prompt.txt"
    tools:
      - "web_search"
      - "your_tool"
```

No code changes needed — the agent appears in the UI automatically.

## Project Structure

```
chatagent/
├── server/
│   ├── main.py                 # FastAPI app with all endpoints
│   ├── database.py             # SQLite operations
│   ├── initialize_agent.py     # Agent factory from YAML config
│   ├── ltm.py                  # Long-term memory with structured outputs
│   ├── config.yaml             # Agent definitions
│   ├── agents/
│   │   ├── Agent.py            # ToolCallingAgent class
│   │   ├── ChatHistory.py      # LangChain-compatible SQLite history
│   │   └── tools/
│   │       ├── WebSearch.py    # DuckDuckGo search
│   │       ├── WikipediaSearch.py
│   │       ├── Calculator.py   # Safe math eval via AST
│   │       └── DateTimeTool.py
│   └── templates/              # System prompts per agent
├── client/
│   ├── src/
│   │   ├── App.tsx             # Main chat interface
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   └── ChatSidebar.tsx
│   │   └── utils/api.ts        # Backend API client
│   └── ...config files
├── docker-compose.yml
└── README.md
```

## License

MIT
