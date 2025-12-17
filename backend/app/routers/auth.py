"""
Authentication router for user login and registration.
Handles Firebase Authentication integration.
"""

from datetime import datetime
from typing import Optional

from app.config import settings
from app.data.mock_profiles import assign_mock_profile_to_user
from app.schemas import (
    ErrorResponse,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    RegisterRequest,
)
from app.services.firebase_service import firebase_service
from app.utils.logger import default_logger as logger
from fastapi import APIRouter, Header, HTTPException, status

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login endpoint for user authentication.

    For hackathon: Simple email/password validation.
    In production: This would validate Firebase ID tokens.

    Args:
        request: Login request with email and password

    Returns:
        LoginResponse with access token and user info
    """
    try:
        logger.info(f"Login attempt for email: {request.email}")

        # For hackathon: Simple validation
        if len(request.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )

        # Try to find user by email in Firestore
        # In production, Firebase Auth would handle this
        user_profile = None

        # For now, we'll check if user exists or create a mock response
        # In production, you'd verify Firebase ID token here

        # Generate a mock user_id from email (for demo)
        user_id = request.email.split("@")[0].replace(".", "_")

        # Try to fetch existing user
        user_profile = firebase_service.get_user_profile(user_id)

        if not user_profile:
            # For demo: Create a profile with realistic mock data
            logger.info(f"Creating new user profile with mock data for {request.email}")

            # Assign random mock profile with realistic financial data
            basic_user_data = {
                "user_id": user_id,
                "email": request.email,
                "full_name": request.email.split("@")[0].title(),
            }
            user_profile = assign_mock_profile_to_user(basic_user_data)

            firebase_service.create_user_profile(user_profile)
            logger.info(
                f"Assigned mock profile: Credit Score={user_profile.get('mock_credit_score')}, Income=₹{user_profile.get('monthly_income')}"
            )

        # Generate access token (in production, use proper JWT)
        access_token = f"finagent_token_{user_id}_{datetime.utcnow().timestamp()}"

        response = LoginResponse(
            access_token=access_token,
            token_type="Bearer",
            user_id=user_profile.get("user_id", user_id),
            full_name=user_profile.get("full_name", "User"),
            email=user_profile.get("email", request.email),
        )

        logger.info(f"Login successful for user: {user_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed"
        )


@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest):
    """
    Register a new user.

    Args:
        request: Registration request with user details

    Returns:
        LoginResponse with access token and user info
    """
    try:
        logger.info(f"Registration attempt for email: {request.email}")

        # Generate user_id from email
        user_id = request.email.split("@")[0].replace(".", "_")

        # Check if user already exists
        existing_user = firebase_service.get_user_profile(user_id)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
            )

        # Create user profile with mock financial data
        basic_user_data = {
            "user_id": user_id,
            "email": request.email,
            "full_name": request.full_name,
            "monthly_income": request.monthly_income
            if hasattr(request, "monthly_income")
            else None,
            "existing_emi": request.existing_emi
            if hasattr(request, "existing_emi")
            else None,
        }

        # Assign mock profile with realistic data (KYC, CIBIL, etc.)
        user_profile = assign_mock_profile_to_user(basic_user_data)

        logger.info(
            f"Assigning mock profile to new user: Credit Score={user_profile.get('mock_credit_score')}, Income=₹{user_profile.get('monthly_income')}"
        )

        created_profile = firebase_service.create_user_profile(user_profile)

        # Generate access token
        access_token = f"finagent_token_{user_id}_{datetime.utcnow().timestamp()}"

        response = LoginResponse(
            access_token=access_token,
            token_type="Bearer",
            user_id=created_profile.get("user_id", user_id),
            full_name=created_profile.get("full_name"),
            email=created_profile.get("email"),
        )

        logger.info(f"Registration successful for user: {user_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@router.post("/verify-token")
async def verify_token(authorization: Optional[str] = Header(None)):
    """
    Verify Firebase ID token.

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        Token verification result
    """
    try:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header missing",
            )

        # Extract token from Bearer scheme
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format",
            )

        token = parts[1]

        # For hackathon: Simple token validation
        if token.startswith("finagent_token_"):
            # Extract user_id from token
            parts = token.split("_")
            if len(parts) >= 3:
                user_id = "_".join(parts[2:-1])
                return MessageResponse(message="Token valid", success=True)

        # In production: Verify Firebase ID token
        # decoded_token = firebase_service.verify_token(token)
        # if decoded_token:
        #     return MessageResponse(message="Token valid", success=True)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token verification failed"
        )


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """
    Logout endpoint.

    For stateless JWT tokens, this is mainly for client-side cleanup.
    In production with Firebase, you might want to revoke refresh tokens.

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        Success message
    """
    try:
        logger.info("Logout request received")

        # In production: Could revoke Firebase refresh tokens here
        # or add token to blacklist

        return MessageResponse(message="Logged out successfully", success=True)

    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Logout failed"
        )
