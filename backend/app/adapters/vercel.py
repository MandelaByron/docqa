
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.request_types import RequestData, SubmitMessage, UIMessage
import json
from typing import Any
from pydantic_ai.ui.vercel_ai._adapter import request_data_ta
class AppVercelAIAdapter(VercelAIAdapter):
     """
    Drop-in replacement for VercelAIAdapter that accepts either:
      - `messages`  list[UIMessage]  — the standard full-history shape
      - `message`   UIMessage        — the optimised single-message shape
 
    Everything else (SSE encoding, streaming, tool calls, etc.) is inherited
    unchanged from VercelAIAdapter.
    """    
     @classmethod
     def build_run_input(cls, body: bytes) -> RequestData:
        """
        Parse the request body into a RequestData object.
 
        Handles three normalisation steps before handing off to pydantic:
          1. Missing `trigger`  → defaults to "submit-message"
          2. `message` (singular UIMessage) → wrapped into `messages` list
          3. Both `message` and `messages` present → `messages` wins, `message` is dropped
        """
        try:
            raw: dict[str, Any] = json.loads(body)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Request body is not valid JSON: {exc}") from exc
 
        if not isinstance(raw, dict):
            raise ValueError(f"Expected a JSON object, got {type(raw).__name__}")
        
        if "trigger" not in raw:
            raw["trigger"] = "submit-message"
        
        if "message" in raw and "messages" not in raw:
            raw["messages"] = [raw.pop("message")]
        elif "message" in raw and "messages" in raw:
            # Both present: trust the full `messages` array, discard singular.
            raw.pop("message")

        return request_data_ta.validate_python(raw)