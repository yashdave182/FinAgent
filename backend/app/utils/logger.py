"""
Logging utility for structured logging across the application.
Provides consistent logging format and helpers.
"""

import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output."""

    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    BOLD = "\033[1m"

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors."""
        # Add color to level name
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = (
                f"{self.COLORS[levelname]}{self.BOLD}{levelname}{self.RESET}"
            )

        # Format the message
        formatted = super().format(record)

        return formatted


def setup_logger(
    name: str = "finagent",
    level: int = logging.INFO,
    log_file: Optional[str] = None,
) -> logging.Logger:
    """
    Set up a logger with console and optional file handlers.

    Args:
        name: Logger name
        level: Logging level (default: INFO)
        log_file: Optional path to log file

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Prevent duplicate handlers
    if logger.handlers:
        return logger

    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_formatter = ColoredFormatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(level)
        file_formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger


def log_request(
    logger: logging.Logger,
    method: str,
    path: str,
    user_id: Optional[str] = None,
    **kwargs: Any,
) -> None:
    """
    Log an API request with structured data.

    Args:
        logger: Logger instance
        method: HTTP method
        path: Request path
        user_id: Optional user ID
        **kwargs: Additional context data
    """
    context = {
        "method": method,
        "path": path,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        **kwargs,
    }
    logger.info(f"Request: {method} {path}", extra={"context": context})


def log_response(
    logger: logging.Logger,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    **kwargs: Any,
) -> None:
    """
    Log an API response with structured data.

    Args:
        logger: Logger instance
        method: HTTP method
        path: Request path
        status_code: HTTP status code
        duration_ms: Request duration in milliseconds
        **kwargs: Additional context data
    """
    context = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
        "timestamp": datetime.utcnow().isoformat(),
        **kwargs,
    }
    logger.info(
        f"Response: {method} {path} - {status_code} ({duration_ms:.2f}ms)",
        extra={"context": context},
    )


def log_error(
    logger: logging.Logger,
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log an error with structured context.

    Args:
        logger: Logger instance
        error: Exception instance
        context: Optional context dictionary
    """
    error_context = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "timestamp": datetime.utcnow().isoformat(),
        **(context or {}),
    }
    logger.error(
        f"Error: {type(error).__name__}: {str(error)}",
        extra={"context": error_context},
        exc_info=True,
    )


def log_agent_action(
    logger: logging.Logger, action: str, details: Dict[str, Any]
) -> None:
    """
    Log an agent action (tool call, decision, etc.).

    Args:
        logger: Logger instance
        action: Action name/type
        details: Action details
    """
    context = {
        "action": action,
        "timestamp": datetime.utcnow().isoformat(),
        **details,
    }
    logger.info(f"Agent Action: {action}", extra={"context": context})


def log_underwriting_decision(
    logger: logging.Logger,
    user_id: str,
    decision: str,
    amount: float,
    credit_score: int,
    foir: float,
) -> None:
    """
    Log an underwriting decision with key metrics.

    Args:
        logger: Logger instance
        user_id: User ID
        decision: Decision (APPROVED/REJECTED/ADJUST)
        amount: Approved amount
        credit_score: Credit score
        foir: FOIR ratio
    """
    context = {
        "user_id": user_id,
        "decision": decision,
        "approved_amount": amount,
        "credit_score": credit_score,
        "foir": round(foir, 3),
        "timestamp": datetime.utcnow().isoformat(),
    }
    logger.info(
        f"Underwriting Decision: {decision} for user {user_id}",
        extra={"context": context},
    )


# Default logger instance
default_logger = setup_logger()
