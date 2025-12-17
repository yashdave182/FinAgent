"""
Improved LangChain tools for loan processing with sanction letter generation.
"""

import json
from datetime import datetime
from typing import Dict

from langchain.tools import Tool

from app.services.firebase_service import firebase_service
from app.services.pdf_service import pdf_service
from app.services.underwriting_service import underwriting_service
from app.utils.logger import setup_logger

logger = setup_logger("tools")


def fetch_user_profile_func(tool_input: str) -> str:
    """
    Fetch user profile with financial information.
    
    Args:
        tool_input: Either user_id string directly or JSON string with user_id
        
    Returns:
        JSON string with user profile data
    """
    try:
        # Handle different input formats
        user_id = tool_input
        
        # If input looks like JSON or has formatting, try to parse it
        if isinstance(tool_input, str):
            tool_input = tool_input.strip()
            # Remove common agent formatting errors
            if "=" in tool_input or "{" in tool_input:
                try:
                    # Try to extract user_id from various formats
                    if "user_id" in tool_input:
                        # Handle: user_id = "23ce137"
                        if "=" in tool_input:
                            user_id = tool_input.split("=")[-1].strip().strip('"\'')
                        # Handle: {"user_id": "23ce137"}
                        else:
                            parsed = json.loads(tool_input)
                            user_id = parsed.get("user_id", tool_input)
                except Exception as parse_error:
                    # If parsing fails, use the input as-is
                    logger.debug(f"Could not parse input format, using as-is: {parse_error}")
                    pass
        
        logger.info(f"Tool: Fetching profile for user {user_id}")
        profile = firebase_service.get_user_profile(user_id)
        
        if not profile:
            return json.dumps({
                "success": False,
                "error": "User profile not found"
            })
        
        return json.dumps({
            "success": True,
            "user_id": profile.get("user_id"),
            "full_name": profile.get("full_name"),
            "monthly_income": profile.get("monthly_income"),
            "existing_emi": profile.get("existing_emi", 0),
            "credit_score": profile.get("mock_credit_score"),
            "segment": profile.get("segment", "New to Credit")
        })
        
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        })


def run_underwriting_func(tool_input: str) -> str:
    """
    Run loan underwriting process.
    
    Args:
        tool_input: JSON string with user_id, session_id, requested_amount, requested_tenure_months
        
    Returns:
        JSON string with underwriting decision
    """
    try:
        # Parse input
        if isinstance(tool_input, str):
            params = json.loads(tool_input)
        else:
            params = tool_input
            
        user_id = params.get("user_id")
        session_id = params.get("session_id")
        requested_amount = float(params.get("requested_amount"))
        requested_tenure_months = int(params.get("requested_tenure_months"))
        
        logger.info(f"Tool: Running underwriting for user {user_id}, amount={requested_amount}, tenure={requested_tenure_months}")
        
        # Get user profile
        profile = firebase_service.get_user_profile(user_id)
        if not profile:
            return json.dumps({
                "success": False,
                "error": "User profile not found"
            })
        
        # Run underwriting
        decision = underwriting_service.evaluate_loan(
            monthly_income=profile["monthly_income"],
            existing_emi=profile.get("existing_emi", 0),
            credit_score=profile["mock_credit_score"],
            requested_amount=requested_amount,
            requested_tenure_months=requested_tenure_months,
        )
        
        logger.info(f"Underwriting Decision: {decision['decision']} for user {user_id}")
        
        # Store decision in session
        from app.services.session_service import session_service
        session_service.update_session(session_id, {
            "loan_decision": decision,
            "current_step": decision["decision"]
        })
        
        logger.info(f"Updated session {session_id}")
        
        # Return decision
        result = {
            "__tool_done__": True,
            "success": True,
            "decision": decision["decision"],
            "approved_amount": decision["approved_amount"],
            "tenure_months": decision["tenure_months"],
            "emi": decision["emi"],
            "interest_rate": decision["interest_rate"],
            "credit_score": decision["credit_score"],
            "foir": decision["foir"],
            "risk_band": decision["risk_band"],
            "explanation": decision["explanation"],
            "total_payable": decision.get("total_payable", decision["emi"] * decision["tenure_months"]),
            "processing_fee": decision.get("processing_fee", decision["approved_amount"] * 0.02)
        }
        
        logger.info(f"Underwriting decision: {result['decision']} for user {user_id}")
        return json.dumps(result)
        
    except Exception as e:
        logger.error(f"Error in underwriting: {str(e)}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e)
        })


def create_loan_application_func(tool_input: str) -> str:
    """
    Create loan application record and generate sanction letter.
    Works for APPROVED loans and ADJUST loans (after user accepts).
    
    Args:
        tool_input: JSON string with user_id, session_id
        
    Returns:
        JSON string with loan_id and sanction letter details
    """
    try:
        # Parse input
        if isinstance(tool_input, str):
            params = json.loads(tool_input)
        else:
            params = tool_input
            
        user_id = params.get("user_id")
        session_id = params.get("session_id")
        
        logger.info(f"Tool: Creating loan application for user {user_id}")
        
        # Get session with decision
        from app.services.session_service import session_service
        session = session_service.get_session(session_id)
        
        if not session or "loan_decision" not in session:
            return json.dumps({
                "success": False,
                "error": "No loan decision found in session"
            })
        
        decision = session["loan_decision"]
        
        # Accept both APPROVED and ADJUST decisions
        # ADJUST means user accepted the adjusted terms
        if decision["decision"] not in ["APPROVED", "ADJUST"]:
            return json.dumps({
                "success": False,
                "error": f"Cannot create sanction letter for {decision['decision']} loan. Only APPROVED or ADJUST loans can generate sanction letters."
            })
        
        # Get user profile
        profile = firebase_service.get_user_profile(user_id)
        if not profile:
            return json.dumps({
                "success": False,
                "error": "User profile not found"
            })
        
        # Create loan application in Firestore
        loan_data = {
            "user_id": user_id,
            "full_name": profile["full_name"],
            "email": profile["email"],
            "requested_amount": decision["approved_amount"],  # Use approved/adjusted amount
            "requested_tenure_months": decision["tenure_months"],
            "approved_amount": decision["approved_amount"],
            "tenure_months": decision["tenure_months"],
            "emi": decision["emi"],
            "interest_rate": decision["interest_rate"],
            "credit_score": decision["credit_score"],
            "foir": decision["foir"],
            "decision": "APPROVED",  # Store as APPROVED in database (both APPROVED and ADJUST are approved)
            "risk_band": decision["risk_band"],
            "explanation": decision["explanation"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # Save to Firestore
        loan_id = firebase_service.create_loan_application(loan_data)
        logger.info(f"Created loan application: {loan_id}")
        
        # Generate sanction letter PDF
        pdf_path = pdf_service.generate_sanction_letter(
            loan_id=loan_id,
            user_name=profile["full_name"],
            loan_amount=decision["approved_amount"],
            tenure_months=decision["tenure_months"],
            emi=decision["emi"],
            interest_rate=decision["interest_rate"],
            risk_band=decision["risk_band"]
        )
        
        logger.info(f"Generated sanction letter: {pdf_path}")
        
        # Update loan with PDF path
        firebase_service.update_loan_application(loan_id, {
            "sanction_pdf_path": pdf_path
        })
        
        return json.dumps({
            "__tool_done__": True,
            "success": True,
            "loan_id": loan_id,
            "sanction_pdf_path": pdf_path,
            "approved_amount": decision["approved_amount"],
            "emi": decision["emi"],
            "tenure_months": decision["tenure_months"],
            "message": f"Sanction letter generated successfully! Loan ID: {loan_id}"
        })
        
    except Exception as e:
        logger.error(f"Error creating loan application: {str(e)}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e)
        })


# Define tools
fetch_user_profile_tool = Tool(
    name="fetch_user_profile",
    func=fetch_user_profile_func,
    description=(
        "Fetch user's financial profile including income, existing EMIs, and credit score. "
        "Input should be just the user_id string (e.g., '23ce137'). "
        "Returns JSON with user profile data."
    )
)

run_underwriting_tool = Tool(
    name="run_underwriting",
    func=run_underwriting_func,
    description=(
        "Evaluate loan application and make approval decision based on user's financial profile. "
        "Input must be a JSON string like: "
        '{"user_id": "23ce137", "session_id": "abc-123", "requested_amount": 500000, "requested_tenure_months": 36}. '
        "Returns JSON with decision (APPROVED/REJECTED/ADJUST), approved amount, EMI, and explanation."
    )
)

create_loan_application_tool = Tool(
    name="create_loan_application",
    func=create_loan_application_func,
    description=(
        "Create official loan application record and generate sanction letter PDF. "
        "ONLY use this AFTER loan is APPROVED. "
        "Input must be a JSON string like: "
        '{"user_id": "23ce137", "session_id": "abc-123"}. '
        "Returns JSON with loan_id and sanction letter path."
    )
)

# All tools list
all_tools = [
    fetch_user_profile_tool,
    run_underwriting_tool,
    create_loan_application_tool,
]