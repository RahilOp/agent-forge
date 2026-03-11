import ast
import operator
from pydantic import BaseModel, Field
from langchain.tools import StructuredTool

# Safe operators for math evaluation
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _safe_eval(node):
    """Recursively evaluate an AST node with only safe math operations."""
    if isinstance(node, ast.Expression):
        return _safe_eval(node.body)
    elif isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant: {node.value}")
    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPERATORS:
            raise ValueError(f"Unsupported operator: {op_type.__name__}")
        left = _safe_eval(node.left)
        right = _safe_eval(node.right)
        return SAFE_OPERATORS[op_type](left, right)
    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPERATORS:
            raise ValueError(f"Unsupported operator: {op_type.__name__}")
        return SAFE_OPERATORS[op_type](_safe_eval(node.operand))
    else:
        raise ValueError(f"Unsupported expression: {type(node).__name__}")


def calculate(expression: str) -> str:
    """
    Safely evaluate a mathematical expression.

    Args:
        expression: A mathematical expression string (e.g., "2 + 3 * 4", "100 / 7").

    Returns:
        The result of the calculation as a string.
    """
    try:
        tree = ast.parse(expression, mode="eval")
        result = _safe_eval(tree)
        return f"{expression} = {result}"
    except ZeroDivisionError:
        return "Error: Division by zero"
    except Exception as e:
        return f"Error evaluating expression: {str(e)}"


class CalculatorInput(BaseModel):
    expression: str = Field(description="A mathematical expression to evaluate, e.g. '2 + 3 * 4' or '(100 - 20) / 4'")


calculator_tool = StructuredTool.from_function(
    func=calculate,
    name="Calculator",
    args_schema=CalculatorInput,
    description="""
    Evaluate mathematical expressions safely. Use this for arithmetic calculations,
    unit conversions that involve math, or any numeric computation the user requests.
    Supports: +, -, *, /, //, %, ** (power).
    """,
)
