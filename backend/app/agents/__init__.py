"""
Agents module for LangChain-based conversational AI.
Contains the master agent and tool definitions.
"""

from app.agents.master_agent import MasterAgent, master_agent
from app.agents.tools import (
    all_tools,
    create_loan_application_tool,
    fetch_user_profile_tool,
    generate_sanction_letter_tool,
    run_underwriting_tool,
)

__all__ = [
    "master_agent",
    "MasterAgent",
    "all_tools",
    "fetch_user_profile_tool",
    "run_underwriting_tool",
    "generate_sanction_letter_tool",
    "create_loan_application_tool",
]
