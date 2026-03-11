from langchain.tools import StructuredTool

try:
    from duckduckgo_search import DDGS
except ImportError:
    raise ImportError("Please install duckduckgo-search: pip install duckduckgo-search")


def websearch(query: str) -> list:
    """
    Perform a web search using DuckDuckGo.

    Args:
        query: The search query string.

    Returns:
        A list of search result dicts with 'title', 'href', and 'body' keys.
    """
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=5))
    return [{"name": r["title"], "url": r["href"], "snippet": r["body"]} for r in results]


web_search = StructuredTool.from_function(
    func=websearch,
    name="WebSearch",
    description="Search the web using DuckDuckGo. Use this for recent information, current events, or anything not in your training data.",
)
