"""
Admin router for dashboard metrics and loan management.
Provides endpoints for admin analytics and bulk operations.
"""

from typing import Optional

from app.data.mock_profiles import PROFILE_DESCRIPTIONS
from app.schemas import AdminLoansResponse, AdminMetrics, LoanListItem, MessageResponse
from app.services.firebase_service import firebase_service
from app.utils.logger import default_logger as logger
from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter()


@router.get("/metrics", response_model=AdminMetrics)
async def get_admin_metrics():
    """
    Get aggregated metrics for admin dashboard.

    Returns:
        AdminMetrics with loan statistics and analytics
    """
    try:
        logger.info("Fetching admin metrics")

        summary = firebase_service.get_admin_summary()

        metrics = AdminMetrics(
            total_applications=summary.get("total_applications", 0),
            approved_count=summary.get("approved_count", 0),
            rejected_count=summary.get("rejected_count", 0),
            adjust_count=summary.get("adjust_count", 0),
            avg_loan_amount=round(summary.get("avg_loan_amount", 0), 2),
            avg_emi=round(summary.get("avg_emi", 0), 2),
            avg_credit_score=round(summary.get("avg_credit_score", 0), 0),
            today_applications=summary.get("today_applications", 0),
            risk_distribution=summary.get("risk_distribution", {}),
        )

        return metrics

    except Exception as e:
        logger.error(f"Error fetching admin metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch admin metrics",
        )


@router.get("/loans", response_model=AdminLoansResponse)
async def get_all_loans(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    decision: Optional[str] = Query(None, description="Filter by decision"),
    risk_band: Optional[str] = Query(None, description="Filter by risk band"),
):
    """
    Get all loan applications with pagination and filtering.

    Args:
        page: Page number (starts at 1)
        page_size: Number of items per page
        decision: Optional filter by decision (APPROVED/REJECTED/ADJUST)
        risk_band: Optional filter by risk band (A/B/C)

    Returns:
        AdminLoansResponse with paginated loan list
    """
    try:
        logger.info(f"Fetching loans: page={page}, page_size={page_size}")

        # Calculate offset
        offset = (page - 1) * page_size

        # Fetch loans
        all_loans = firebase_service.get_all_loans(limit=page_size * 10, offset=0)

        # Apply filters
        filtered_loans = all_loans
        if decision:
            filtered_loans = [
                loan for loan in filtered_loans if loan.get("decision") == decision
            ]
        if risk_band:
            filtered_loans = [
                loan for loan in filtered_loans if loan.get("risk_band") == risk_band
            ]

        # Get total count
        total = len(filtered_loans)

        # Apply pagination
        start_idx = offset
        end_idx = start_idx + page_size
        paginated_loans = filtered_loans[start_idx:end_idx]

        # Format loan list
        loan_items = []
        for loan in paginated_loans:
            # Get user profile for full name
            user_id = loan.get("user_id")
            user_profile = firebase_service.get_user_profile(user_id)
            full_name = (
                user_profile.get("full_name", "User") if user_profile else "User"
            )

            loan_items.append(
                LoanListItem(
                    loan_id=loan.get("loan_id"),
                    user_id=loan.get("user_id"),
                    full_name=full_name,
                    requested_amount=loan.get("requested_amount", 0),
                    approved_amount=loan.get("approved_amount", 0),
                    decision=loan.get("decision", "PENDING"),
                    risk_band=loan.get("risk_band", "C"),
                    created_at=loan.get("created_at"),
                )
            )

        response = AdminLoansResponse(
            loans=loan_items, total=total, page=page, page_size=page_size
        )

        return response

    except Exception as e:
        logger.error(f"Error fetching loans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch loans",
        )


@router.get("/stats/summary")
async def get_stats_summary():
    """
    Get detailed statistics summary.

    Returns:
        Detailed statistics including approval rates, average amounts, etc.
    """
    try:
        logger.info("Fetching detailed statistics")

        summary = firebase_service.get_admin_summary()

        total = summary.get("total_applications", 0)
        approved = summary.get("approved_count", 0)
        rejected = summary.get("rejected_count", 0)
        adjust = summary.get("adjust_count", 0)

        # Calculate rates
        approval_rate = (approved / total * 100) if total > 0 else 0
        rejection_rate = (rejected / total * 100) if total > 0 else 0
        adjustment_rate = (adjust / total * 100) if total > 0 else 0

        stats = {
            "overview": {
                "total_applications": total,
                "approved_count": approved,
                "rejected_count": rejected,
                "adjust_count": adjust,
                "today_applications": summary.get("today_applications", 0),
            },
            "rates": {
                "approval_rate": round(approval_rate, 2),
                "rejection_rate": round(rejection_rate, 2),
                "adjustment_rate": round(adjustment_rate, 2),
            },
            "averages": {
                "avg_loan_amount": round(summary.get("avg_loan_amount", 0), 2),
                "avg_emi": round(summary.get("avg_emi", 0), 2),
                "avg_credit_score": round(summary.get("avg_credit_score", 0), 0),
            },
            "risk_distribution": summary.get("risk_distribution", {}),
        }

        return stats

    except Exception as e:
        logger.error(f"Error fetching admin stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch stats",
        )


@router.get("/user/{user_id}/profile")
async def get_user_profile_details(user_id: str):
    """
    Get detailed user profile including assigned mock profile info.

    Args:
        user_id: User ID

    Returns:
        User profile with mock profile metadata
    """
    try:
        profile = firebase_service.get_user_profile(user_id)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found"
            )

        # Determine which mock profile category based on credit score
        credit_score = profile.get("mock_credit_score", 0)
        profile_category = "UNKNOWN"

        if credit_score >= 740:
            profile_category = "YOUNG_PROFESSIONAL"
        elif credit_score >= 670:
            profile_category = "MID_CAREER"
        elif credit_score >= 640:
            profile_category = "ENTRY_LEVEL"

        # Get profile description
        profile_info = PROFILE_DESCRIPTIONS.get(profile_category, {})

        return {
            "user_id": user_id,
            "profile_category": profile_category,
            "profile_info": profile_info,
            "financial_data": {
                "monthly_income": profile.get("monthly_income"),
                "existing_emi": profile.get("existing_emi"),
                "credit_score": profile.get("mock_credit_score"),
                "segment": profile.get("segment"),
                "max_eligible_amount": profile.get("max_eligible_amount"),
                "risk_category": profile.get("risk_category"),
            },
            "kyc_data": {
                "kyc_verified": profile.get("kyc_verified"),
                "pan_number": profile.get("pan_number"),
                "bank_name": profile.get("bank_name"),
                "employment_type": profile.get("employment_type"),
                "employment_years": profile.get("employment_years"),
            },
            "full_profile": profile,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user profile",
        )


@router.get("/profiles/list")
async def list_mock_profiles():
    """
    List all available mock profile templates.

    Returns:
        List of mock profile descriptions
    """
    try:
        return {
            "profiles": PROFILE_DESCRIPTIONS,
            "total_profiles": len(PROFILE_DESCRIPTIONS),
            "assignment": "Random profile assigned on signup/login",
        }
    except Exception as e:
        logger.error(f"Error listing profiles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list profiles",
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for admin services.

    Returns:
        Health status
    """
    try:
        # Check Firebase connection
        firebase_status = (
            "connected" if firebase_service.initialized else "disconnected"
        )

        return {
            "status": "healthy",
            "firebase": firebase_status,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Health check failed",
        )


@router.post("/cleanup")
async def cleanup_old_data():
    """
    Cleanup old sessions and temporary data.

    Returns:
        Cleanup result
    """
    try:
        logger.info("Running cleanup tasks")

        from app.services.session_service import session_service

        # Cleanup old sessions (older than 24 hours)
        deleted_sessions = session_service.cleanup_old_sessions(max_age_hours=24)

        return MessageResponse(
            message=f"Cleanup completed: {deleted_sessions} sessions removed",
            success=True,
        )

    except Exception as e:
        logger.error(f"Cleanup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cleanup failed",
        )
