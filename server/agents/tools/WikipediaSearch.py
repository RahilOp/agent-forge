from pydantic import BaseModel, Field
from langchain.tools import StructuredTool

try:
    import wikipedia
except ImportError:
    raise ImportError("Please install wikipedia: pip install wikipedia")


def wikipedia_search(query: str, sentences: int = 3) -> str:
    """
    Search Wikipedia and return a summary.

    Args:
        query: The topic to search for.
        sentences: Number of summary sentences to return.

    Returns:
        A summary string from the most relevant Wikipedia article.
    """
    try:
        results = wikipedia.search(query, results=3)
        if not results:
            return "No Wikipedia articles found for this query."

        page = wikipedia.page(results[0], auto_suggest=False)
        summary = wikipedia.summary(results[0], sentences=sentences, auto_suggest=False)
        return f"**{page.title}**\n\n{summary}\n\nSource: {page.url}"

    except wikipedia.DisambiguationError as e:
        try:
            page = wikipedia.page(e.options[0], auto_suggest=False)
            summary = wikipedia.summary(e.options[0], sentences=sentences, auto_suggest=False)
            return f"**{page.title}**\n\n{summary}\n\nSource: {page.url}"
        except Exception:
            return f"Multiple results found: {', '.join(e.options[:5])}"

    except wikipedia.PageError:
        return "No Wikipedia page found for this query."

    except Exception as e:
        return f"Wikipedia search error: {str(e)}"


class WikipediaSearchInput(BaseModel):
    query: str = Field(description="The topic or question to search for on Wikipedia")


wikipedia_search_tool = StructuredTool.from_function(
    func=wikipedia_search,
    name="WikipediaSearch",
    args_schema=WikipediaSearchInput,
    description="""
    Search Wikipedia for information about a topic. Use this when the user asks about
    general knowledge, historical events, people, places, scientific concepts, etc.
    """,
)
