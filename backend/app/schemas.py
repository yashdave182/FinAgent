"""
Pydantic schemas for request/response validation.
Defines data models for API endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field

# ============================================================================
# Authentication Schemas
# ============================================================================


class LoginRequest(BaseModel):
    """Login request with email and password."""

    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginResponse(BaseModel):
    """Login response with user info and token."""

    access_token: str
    token_type: str = "Bearer"
    user_id: str
    full_name: str
    email: str


class RegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    monthly_income: float = Field(..., gt=0)
    existing_emi: float = Field(default=0.0, ge=0)


# ============================================================================
# Chat Schemas
# ============================================================================


class ChatRequest(BaseModel):
    """Chat message request."""

    session_id: str
    user_id: str
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    """Chat response with agent reply and metadata."""

    reply: str
    step: Optional[str] = (
        None  # WELCOME, GATHERING_DETAILS, UNDERWRITING, SANCTION_GENERATED
    )
    decision: Optional[str] = None  # APPROVED, REJECTED, ADJUST
    loan_id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    session_id: str


# ============================================================================
# Loan Schemas
# ============================================================================


class LoanApplicationRequest(BaseModel):
    """Manual loan application request."""

    user_id: str
    requested_amount: float = Field(..., gt=0)
    requested_tenure_months: int = Field(..., gt=0, le=60)


class LoanDecision(BaseModel):
    """Loan underwriting decision details."""

    decision: str  # APPROVED, REJECTED, ADJUST
    approved_amount: float
    tenure_months: int
    emi: float
    interest_rate: float
    credit_score: int
    foir: float
    risk_band: str  # A, B, C
    explanation: str


class LoanApplication(BaseModel):
    """Complete loan application record."""

    loan_id: str
    user_id: str
    requested_amount: float
    requested_tenure_months: int
    approved_amount: float
    tenure_months: int
    emi: float
    interest_rate: float
    credit_score: int
    foir: float
    decision: str
    risk_band: str
    explanation: str
    sanction_pdf_path: Optional[str] = None
    sanction_pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LoanSummaryResponse(BaseModel):
    """Loan summary for display."""

    loan_id: str
    user_id: str
    full_name: str
    approved_amount: float
    tenure_months: int
    emi: float
    interest_rate: float
    decision: str
    risk_band: str
    created_at: datetime
    sanction_pdf_url: Optional[str] = None


class SanctionLetterResponse(BaseModel):
    """Sanction letter PDF response."""

    loan_id: str
    pdf_url: str
    pdf_path: str


# ============================================================================
# User Profile Schemas
# ============================================================================


class UserProfile(BaseModel):
    """User profile information."""

    user_id: str
    full_name: str
    email: str
    monthly_income: float
    existing_emi: float
    mock_credit_score: int
    segment: str = "New to Credit"  # Existing Customer, New to Credit, etc.
    created_at: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    """User profile update request."""

    full_name: Optional[str] = None
    monthly_income: Optional[float] = Field(None, gt=0)
    existing_emi: Optional[float] = Field(None, ge=0)


# ============================================================================
# Admin Schemas
# ============================================================================


class AdminMetrics(BaseModel):
    """Admin dashboard metrics."""

    total_applications: int
    approved_count: int
    rejected_count: int
    adjust_count: int
    avg_loan_amount: float
    avg_emi: float
    avg_credit_score: float
    today_applications: int
    risk_distribution: Dict[str, int]  # {"A": 10, "B": 5, "C": 2}


class LoanListItem(BaseModel):
    """Abbreviated loan info for admin list."""

    loan_id: str
    user_id: str
    full_name: str
    requested_amount: float
    approved_amount: float
    decision: str
    risk_band: str
    created_at: datetime


class AdminLoansResponse(BaseModel):
    """List of loans for admin dashboard."""

    loans: List[LoanListItem]
    total: int
    page: int
    page_size: int


# ============================================================================
# Session Schemas
# ============================================================================


class SessionState(BaseModel):
    """Internal session state for chat context."""

    session_id: str
    user_id: str
    current_step: str = "WELCOME"
    loan_details: Optional[Dict[str, Any]] = None
    chat_history: List[Dict[str, str]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Generic Response Schemas
# ============================================================================


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None
    success: bool = False
