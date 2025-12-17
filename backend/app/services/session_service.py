"""
Session service for managing chat context and state.
Maintains in-memory session data for chat conversations.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import uuid4

from app.utils.logger import default_logger as logger


class SessionService:
    """Service for managing user chat sessions and context."""

    def __init__(self):
        """Initialize session service with in-memory storage."""
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._max_history = 20  # Maximum chat history items per session

    def create_session(self, user_id: str) -> str:
        """
        Create a new chat session for a user.

        Args:
            user_id: User ID

        Returns:
            Session ID
        """
        session_id = str(uuid4())

        self._sessions[session_id] = {
            "session_id": session_id,
            "user_id": user_id,
            "current_step": "WELCOME",
            "loan_details": {},
            "chat_history": [],
            "user_profile": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "context": {},
        }

        logger.info(f"Created session {session_id} for user {user_id}")
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session data by ID.

        Args:
            session_id: Session ID

        Returns:
            Session data dict or None if not found
        """
        session = self._sessions.get(session_id)

        if not session:
            logger.warning(f"Session not found: {session_id}")
            return None

        return session

    def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update session data.

        Args:
            session_id: Session ID
            updates: Dictionary of fields to update

        Returns:
            True if updated successfully, False if session not found
        """
        session = self._sessions.get(session_id)

        if not session:
            logger.warning(f"Cannot update, session not found: {session_id}")
            return False

        # Update fields
        for key, value in updates.items():
            if key != "session_id":  # Don't allow changing session_id
                session[key] = value

        session["updated_at"] = datetime.utcnow()

        logger.info(f"Updated session {session_id}")
        return True

    def add_to_chat_history(self, session_id: str, role: str, content: str) -> bool:
        """
        Add a message to chat history.

        Args:
            session_id: Session ID
            role: Message role (user/assistant/system)
            content: Message content

        Returns:
            True if added successfully, False otherwise
        """
        session = self._sessions.get(session_id)

        if not session:
            logger.warning(f"Cannot add to history, session not found: {session_id}")
            return False

        # Add message to history
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }

        session["chat_history"].append(message)

        # Trim history if it exceeds max length
        if len(session["chat_history"]) > self._max_history:
            session["chat_history"] = session["chat_history"][-self._max_history :]
            logger.debug(f"Trimmed chat history for session {session_id}")

        session["updated_at"] = datetime.utcnow()

        return True

    def get_chat_history(self, session_id: str) -> list:
        """
        Get chat history for a session.

        Args:
            session_id: Session ID

        Returns:
            List of chat messages
        """
        session = self._sessions.get(session_id)

        if not session:
            return []

        return session.get("chat_history", [])

    def set_user_profile(self, session_id: str, user_profile: Dict[str, Any]) -> bool:
        """
        Store user profile in session.

        Args:
            session_id: Session ID
            user_profile: User profile data

        Returns:
            True if set successfully, False otherwise
        """
        session = self._sessions.get(session_id)

        if not session:
            logger.warning(f"Cannot set profile, session not found: {session_id}")
            return False

        session["user_profile"] = user_profile
        session["updated_at"] = datetime.utcnow()

        logger.info(f"Set user profile for session {session_id}")
        return True

    def get_user_profile(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile from session.

        Args:
            session_id: Session ID

        Returns:
            User profile dict or None
        """
        session = self._sessions.get(session_id)

        if not session:
            return None

        return session.get("user_profile")

    def set_loan_details(self, session_id: str, loan_details: Dict[str, Any]) -> bool:
        """
        Store loan details in session.

        Args:
            session_id: Session ID
            loan_details: Loan details data

        Returns:
            True if set successfully, False otherwise
        """
        session = self._sessions.get(session_id)

        if not session:
            logger.warning(f"Cannot set loan details, session not found: {session_id}")
            return False

        session["loan_details"] = loan_details
        session["updated_at"] = datetime.utcnow()

        logger.info(f"Set loan details for session {session_id}")
        return True

    def get_loan_details(self, session_id: str) -> Dict[str, Any]:
        """
        Get loan details from session.

        Args:
            session_id: Session ID

        Returns:
            Loan details dict (empty if not set)
        """
        session = self._sessions.get(session_id)

        if not session:
            return {}

        return session.get("loan_details", {})

    def set_step(self, session_id: str, step: str) -> bool:
        """
        Set current conversation step.

        Args:
            session_id: Session ID
            step: Step name (WELCOME, GATHERING_DETAILS, UNDERWRITING, etc.)

        Returns:
            True if set successfully, False otherwise
        """
        session = self._sessions.get(session_id)

        if not session:
            logger.warning(f"Cannot set step, session not found: {session_id}")
            return False

        session["current_step"] = step
        session["updated_at"] = datetime.utcnow()

        logger.info(f"Set step to {step} for session {session_id}")
        return True

    def get_step(self, session_id: str) -> str:
        """
        Get current conversation step.

        Args:
            session_id: Session ID

        Returns:
            Current step name or "WELCOME" if not found
        """
        session = self._sessions.get(session_id)

        if not session:
            return "WELCOME"

        return session.get("current_step", "WELCOME")

    def set_context(self, session_id: str, key: str, value: Any) -> bool:
        """
        Set a context variable in the session.

        Args:
            session_id: Session ID
            key: Context key
            value: Context value

        Returns:
            True if set successfully, False otherwise
        """
        session = self._sessions.get(session_id)

        if not session:
            logger.warning(f"Cannot set context, session not found: {session_id}")
            return False

        if "context" not in session:
            session["context"] = {}

        session["context"][key] = value
        session["updated_at"] = datetime.utcnow()

        return True

    def get_context(self, session_id: str, key: str, default: Any = None) -> Any:
        """
        Get a context variable from the session.

        Args:
            session_id: Session ID
            key: Context key
            default: Default value if not found

        Returns:
            Context value or default
        """
        session = self._sessions.get(session_id)

        if not session:
            return default

        context = session.get("context", {})
        return context.get(key, default)

    def clear_session(self, session_id: str) -> bool:
        """
        Delete a session.

        Args:
            session_id: Session ID

        Returns:
            True if deleted successfully, False if not found
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            logger.info(f"Cleared session {session_id}")
            return True

        logger.warning(f"Cannot clear, session not found: {session_id}")
        return False

    def get_or_create_session(self, session_id: str, user_id: str) -> str:
        """
        Get existing session or create new one if not found.

        Args:
            session_id: Session ID (can be None or empty)
            user_id: User ID

        Returns:
            Session ID (existing or newly created)
        """
        if session_id and session_id in self._sessions:
            return session_id

        # Create new session
        return self.create_session(user_id)

    def get_session_count(self) -> int:
        """
        Get total number of active sessions.

        Returns:
            Number of sessions
        """
        return len(self._sessions)

    def cleanup_old_sessions(self, max_age_hours: int = 24) -> int:
        """
        Clean up sessions older than specified hours.

        Args:
            max_age_hours: Maximum age in hours

        Returns:
            Number of sessions deleted
        """
        now = datetime.utcnow()
        deleted = 0

        # Find old sessions
        old_sessions = []
        for session_id, session in self._sessions.items():
            age = now - session["updated_at"]
            if age.total_seconds() > (max_age_hours * 3600):
                old_sessions.append(session_id)

        # Delete old sessions
        for session_id in old_sessions:
            del self._sessions[session_id]
            deleted += 1

        if deleted > 0:
            logger.info(f"Cleaned up {deleted} old sessions")

        return deleted


# Singleton instance
session_service = SessionService()
