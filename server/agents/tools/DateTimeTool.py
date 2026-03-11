from datetime import datetime, timezone
from pydantic import BaseModel, Field
from langchain.tools import StructuredTool


def get_current_datetime(timezone_name: str = "UTC") -> str:
    """
    Get the current date and time.

    Args:
        timezone_name: Currently only supports 'UTC'. Defaults to 'UTC'.

    Returns:
        A formatted string with the current date, time, and day of the week.
    """
    now = datetime.now(timezone.utc)
    return (
        f"Current date and time (UTC): {now.strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Day of the week: {now.strftime('%A')}\n"
        f"ISO format: {now.isoformat()}"
    )


class DateTimeInput(BaseModel):
    timezone_name: str = Field(default="UTC", description="Timezone name (currently only 'UTC' is supported)")


datetime_tool = StructuredTool.from_function(
    func=get_current_datetime,
    name="DateTime",
    args_schema=DateTimeInput,
    description="Get the current date and time. Use this when the user asks about today's date, current time, or day of the week.",
)
