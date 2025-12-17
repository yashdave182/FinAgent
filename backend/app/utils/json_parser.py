"""
JSON parsing utilities for handling malformed LLM outputs.
Provides robust parsing with fallback strategies.
"""

import json
import re
from typing import Any, Dict, Optional


def parse_llm_json(text: str) -> Optional[Dict[str, Any]]:
    """
    Parse JSON from LLM output with multiple fallback strategies.

    Handles common issues:
    - Extra text before/after JSON
    - Line breaks within JSON
    - Single quotes instead of double quotes
    - Trailing commas

    Args:
        text: Raw text from LLM that should contain JSON

    Returns:
        Parsed JSON dictionary or None if parsing fails
    """
    if not text or not isinstance(text, str):
        return None

    # Strategy 1: Try direct parsing
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Extract JSON from text (look for {...} or [...])
    try:
        # Find first { and last }
        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1 and end > start:
            json_str = text[start : end + 1]
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass

    # Strategy 3: Try to extract JSON array
    try:
        start = text.find("[")
        end = text.rfind("]")

        if start != -1 and end != -1 and end > start:
            json_str = text[start : end + 1]
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass

    # Strategy 4: Fix common issues and retry
    try:
        # Remove line breaks within JSON
        cleaned = re.sub(r"\n\s*", " ", text)

        # Extract JSON portion
        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start != -1 and end != -1 and end > start:
            json_str = cleaned[start : end + 1]

            # Replace single quotes with double quotes (carefully)
            # This is a simple heuristic and may not work for all cases
            json_str = json_str.replace("'", '"')

            # Remove trailing commas before } or ]
            json_str = re.sub(r",(\s*[}\]])", r"\1", json_str)

            return json.loads(json_str)
    except (json.JSONDecodeError, Exception):
        pass

    # Strategy 5: Try to parse as key-value pairs using regex
    try:
        # Look for key: value patterns
        pattern = r'"?(\w+)"?\s*:\s*"?([^",}\]]+)"?'
        matches = re.findall(pattern, text)

        if matches:
            result = {}
            for key, value in matches:
                # Try to parse value as number if possible
                try:
                    if "." in value:
                        result[key] = float(value)
                    else:
                        result[key] = int(value)
                except ValueError:
                    result[key] = value.strip()

            if result:
                return result
    except Exception:
        pass

    return None


def parse_tool_input(input_str: str) -> Dict[str, Any]:
    """
    Parse tool input from LLM, handling both string and JSON inputs.

    Args:
        input_str: Input string from LLM (may be JSON or plain string)

    Returns:
        Dictionary with parsed values
    """
    # If it's already a dict, return it
    if isinstance(input_str, dict):
        return input_str

    # Try to parse as JSON
    parsed = parse_llm_json(input_str)
    if parsed:
        return parsed

    # If it's a simple string that might be a user_id, wrap it
    if isinstance(input_str, str):
        input_str = input_str.strip().strip('"').strip("'")

        # Check if it looks like JSON but failed to parse
        if "{" in input_str or "[" in input_str:
            # Return empty dict to signal parsing failure
            return {}

        # If it's a simple value, treat it as user_id
        if not any(char in input_str for char in ["{", "}", "[", "]", ":"]):
            return {"user_id": input_str}

    return {}


def extract_json_value(text: str, key: str, default: Any = None) -> Any:
    """
    Extract a specific value from JSON text without full parsing.

    Args:
        text: Text containing JSON
        key: Key to extract
        default: Default value if key not found

    Returns:
        Extracted value or default
    """
    try:
        parsed = parse_llm_json(text)
        if parsed and isinstance(parsed, dict):
            return parsed.get(key, default)
    except Exception:
        pass

    # Try regex extraction as fallback
    try:
        pattern = rf'"{key}"\s*:\s*"?([^",}}\]]+)"?'
        match = re.search(pattern, text)
        if match:
            value = match.group(1).strip()
            # Try to convert to number
            try:
                if "." in value:
                    return float(value)
                return int(value)
            except ValueError:
                return value
    except Exception:
        pass

    return default
