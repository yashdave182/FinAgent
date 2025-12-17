"""
Chat router for conversational loan processing.
Handles chat messages and integrates with the master agent.
"""

from typing import Optional

from app.agents.master_agent import master_agent
from app.schemas import ChatRequest, ChatResponse, ErrorResponse
from app.services.firebase_service import firebase_service
from app.services.session_service import session_service
from app.utils.logger import default_logger as logger
from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat message and return agent response.

    Args:
        request: Chat request with session_id, user_id, and message

    Returns:
        ChatResponse with agent reply and metadata
    """
    try:
        logger.info(
            f"Chat request from user {request.user_id}, session {request.session_id}"
        )

        # Get or create session - if session doesn't exist or is invalid format, create new
        existing_session = None
        if request.session_id and not request.session_id.startswith("undefined"):
            existing_session = session_service.get_session(request.session_id)

        if existing_session:
            session_id = request.session_id
            logger.info(f"Using existing session {session_id}")
        else:
            session_id = session_service.create_session(request.user_id)
            logger.info(f"Created new session {session_id} for user {request.user_id}")

        # Fetch user profile if not in session
        user_profile = session_service.get_user_profile(session_id)
        if not user_profile:
            user_profile = firebase_service.get_user_profile(request.user_id)
            if user_profile:
                session_service.set_user_profile(session_id, user_profile)

        # Add user message to session history
        session_service.add_to_chat_history(session_id, "user", request.message)

        # Determine current step
        current_step = session_service.get_step(session_id)

        # Process message with master agent
        agent_response = master_agent.chat(session_id, request.user_id, request.message)

        # Add agent response to session history
        session_service.add_to_chat_history(
            session_id, "assistant", agent_response["reply"]
        )

        # Update session step based on decision and message content
        new_step = current_step
        message_lower = request.message.lower()

        if agent_response.get("decision"):
            if agent_response["decision"] in ["APPROVED", "ADJUST"]:
                new_step = "SANCTION_GENERATED"
            elif agent_response["decision"] == "REJECTED":
                new_step = "REJECTED"
        elif any(
            word in message_lower
            for word in ["loan", "need", "want", "borrow", "₹", "rs", "rupees"]
        ) and any(
            word in message_lower
            for word in ["amount", "for", "of", "months", "year", "tenure"]
        ):
            new_step = "GATHERING_DETAILS"
        elif current_step == "GATHERING_DETAILS" and any(
            word in message_lower
            for word in ["yes", "confirm", "correct", "proceed", "ok", "sure"]
        ):
            new_step = "UNDERWRITING"
        elif (
            current_step == "WELCOME"
            and len(session_service.get_chat_history(session_id)) > 2
        ):
            # Move from welcome if conversation has progressed
            new_step = "GATHERING_DETAILS"

        session_service.set_step(session_id, new_step)

        # Prepare response
        response = ChatResponse(
            reply=agent_response["reply"],
            step=new_step,
            decision=agent_response.get("decision"),
            loan_id=agent_response.get("loan_id"),
            meta=agent_response.get("meta"),
            session_id=session_id,
        )

        logger.info(
            f"Chat response sent: decision={response.decision}, step={response.step}"
        )
        return response

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat message",
        )


@router.get("/history/{session_id}")
async def get_chat_history(session_id: str):
    """
    Get chat history for a session.

    Args:
        session_id: Session ID

    Returns:
        List of chat messages
    """
    try:
        history = session_service.get_chat_history(session_id)
        return {"session_id": session_id, "history": history, "count": len(history)}

    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch chat history",
        )


@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """
    Clear a chat session.

    Args:
        session_id: Session ID

    Returns:
        Success message
    """
    try:
        session_service.clear_session(session_id)
        master_agent.clear_session_memory(session_id)

        logger.info(f"Cleared session {session_id}")
        return {"message": "Session cleared successfully", "success": True}

    except Exception as e:
        logger.error(f"Error clearing session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear session",
        )


@router.get("/session/{session_id}/info")
async def get_session_info(session_id: str):
    """
    Get session information and state.

    Args:
        session_id: Session ID

    Returns:
        Session information
    """
    try:
        session = session_service.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )

        # Return session info without sensitive data
        return {
            "session_id": session["session_id"],
            "user_id": session["user_id"],
            "current_step": session["current_step"],
            "message_count": len(session["chat_history"]),
            "created_at": session["created_at"].isoformat(),
            "updated_at": session["updated_at"].isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch session info",
        )
