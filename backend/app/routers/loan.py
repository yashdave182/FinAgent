"""
Loan router for loan application operations and sanction letter management.
Handles loan retrieval, PDF generation, and loan status queries.
"""

from typing import Optional

from app.schemas import (
    ErrorResponse,
    LoanApplication,
    LoanSummaryResponse,
    MessageResponse,
    SanctionLetterResponse,
)
from app.services.firebase_service import firebase_service
from app.services.pdf_service import pdf_service
from app.utils.logger import default_logger as logger
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

router = APIRouter()


@router.get("/{loan_id}", response_model=LoanSummaryResponse)
async def get_loan(loan_id: str):
    """
    Get loan application details by ID.

    Args:
        loan_id: Loan application ID

    Returns:
        LoanSummaryResponse with loan details
    """
    try:
        logger.info(f"Fetching loan application: {loan_id}")

        # Fetch loan from Firebase
        loan = firebase_service.get_loan_application(loan_id)

        if not loan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Loan application not found",
            )

        # Fetch user profile for full name
        user_id = loan.get("user_id")
        user_profile = firebase_service.get_user_profile(user_id)
        full_name = user_profile.get("full_name", "User") if user_profile else "User"

        # Prepare response
        response = LoanSummaryResponse(
            loan_id=loan.get("loan_id"),
            user_id=loan.get("user_id"),
            full_name=full_name,
            approved_amount=loan.get("approved_amount", 0),
            tenure_months=loan.get("tenure_months", 0),
            emi=loan.get("emi", 0),
            interest_rate=loan.get("interest_rate", 0),
            decision=loan.get("decision", "PENDING"),
            risk_band=loan.get("risk_band", "C"),
            created_at=loan.get("created_at"),
            sanction_pdf_url=loan.get("sanction_pdf_url"),
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching loan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch loan application",
        )


@router.get("/{loan_id}/sanction-pdf")
async def get_sanction_pdf(loan_id: str):
    """
    Get sanction letter PDF for a loan application.

    Args:
        loan_id: Loan application ID

    Returns:
        PDF file response or URL to PDF
    """
    try:
        logger.info(f"Fetching sanction PDF for loan: {loan_id}")

        # Check if PDF exists
        if not pdf_service.pdf_exists(loan_id):
            logger.info(f"PDF not found for loan {loan_id}, attempting to generate")

            # Try to fetch loan and regenerate PDF if approved
            loan = firebase_service.get_loan_application(loan_id)

            if not loan:
                logger.error(f"Loan application {loan_id} not found in database")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Loan application not found",
                )

            loan_decision = loan.get("decision")
            logger.info(f"Loan {loan_id} decision status: {loan_decision}")

            if loan_decision not in ["APPROVED", "ADJUST"]:
                logger.warning(
                    f"Cannot generate PDF for loan {loan_id} with status {loan_decision}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Sanction letter only available for approved loans",
                )

            # Get user profile for full name
            user_profile = firebase_service.get_user_profile(loan.get("user_id"))
            if user_profile:
                loan["full_name"] = user_profile.get("full_name", "Valued Customer")

            # Generate PDF
            logger.info(f"Generating PDF for loan {loan_id}")
            pdf_result = pdf_service.generate_sanction_letter(loan)
            pdf_path = pdf_result["pdf_path"]
            logger.info(f"PDF generated successfully at: {pdf_path}")
        else:
            pdf_path = pdf_service.get_pdf_path(loan_id)
            logger.info(f"Using existing PDF at: {pdf_path}")

        # Verify file exists before returning
        import os

        if not os.path.exists(pdf_path):
            logger.error(f"PDF file not found at path: {pdf_path}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF file could not be found on server",
            )

        file_size = os.path.getsize(pdf_path)
        logger.info(f"Returning PDF file: {pdf_path} (size: {file_size} bytes)")

        # Return PDF file
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=f"sanction_letter_{loan_id}.pdf",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error fetching sanction PDF for loan {loan_id}: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sanction letter PDF: {str(e)}",
        )


@router.get("/{loan_id}/sanction-info", response_model=SanctionLetterResponse)
async def get_sanction_info(loan_id: str):
    """
    Get sanction letter information without downloading PDF.

    Args:
        loan_id: Loan application ID

    Returns:
        SanctionLetterResponse with PDF path and URL
    """
    try:
        logger.info(f"Fetching sanction info for loan: {loan_id}")

        # Fetch loan
        loan = firebase_service.get_loan_application(loan_id)

        if not loan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Loan application not found",
            )

        if loan.get("decision") not in ["APPROVED", "ADJUST"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sanction letter only available for approved loans",
            )

        pdf_path = loan.get("sanction_pdf_path", "")
        pdf_url = loan.get("sanction_pdf_url", f"/api/loan/{loan_id}/sanction-pdf")

        response = SanctionLetterResponse(
            loan_id=loan_id, pdf_url=pdf_url, pdf_path=pdf_path
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sanction info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch sanction letter info",
        )


@router.get("/user/{user_id}/loans")
async def get_user_loans(user_id: str, limit: int = 10):
    """
    Get all loan applications for a user.

    Args:
        user_id: User ID
        limit: Maximum number of loans to return

    Returns:
        List of loan applications
    """
    try:
        logger.info(f"Fetching loans for user: {user_id}")

        loans = firebase_service.get_user_loans(user_id)

        # Limit results
        loans = loans[:limit]

        # Get user profile for full name
        user_profile = firebase_service.get_user_profile(user_id)
        full_name = user_profile.get("full_name", "User") if user_profile else "User"

        # Format loans
        loan_list = []
        for loan in loans:
            loan_list.append(
                {
                    "loan_id": loan.get("loan_id"),
                    "user_id": loan.get("user_id"),
                    "full_name": full_name,
                    "requested_amount": loan.get("requested_amount", 0),
                    "approved_amount": loan.get("approved_amount", 0),
                    "emi": loan.get("emi", 0),
                    "tenure_months": loan.get("tenure_months", 0),
                    "decision": loan.get("decision"),
                    "risk_band": loan.get("risk_band"),
                    "created_at": loan.get("created_at").isoformat()
                    if loan.get("created_at")
                    else None,
                }
            )

        return {"user_id": user_id, "loans": loan_list, "count": len(loan_list)}

    except Exception as e:
        logger.error(f"Error fetching user loans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user loans",
        )


@router.delete("/{loan_id}/sanction-pdf")
async def delete_sanction_pdf(loan_id: str):
    """
    Delete sanction letter PDF for a loan.

    Args:
        loan_id: Loan application ID

    Returns:
        Success message
    """
    try:
        logger.info(f"Deleting sanction PDF for loan: {loan_id}")

        # Delete PDF file
        deleted = pdf_service.delete_pdf(loan_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sanction letter PDF not found",
            )

        # Update loan record to remove PDF path
        firebase_service.update_loan_application(
            loan_id, {"sanction_pdf_path": None, "sanction_pdf_url": None}
        )

        return MessageResponse(
            message="Sanction letter PDF deleted successfully", success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting sanction PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete sanction letter PDF",
        )
