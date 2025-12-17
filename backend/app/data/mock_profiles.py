"""
Mock user profiles for automatic assignment on signup.
These profiles contain realistic financial data for loan processing demo.
"""

import random
from typing import Any, Dict, List

# Profile 1: Young Professional (Good Credit, High Approval Chance)
PROFILE_YOUNG_PROFESSIONAL = {
    "monthly_income": 75000.0,
    "existing_emi": 8000.0,
    "mock_credit_score": 750,
    "segment": "Salaried",
    "employment_type": "Salaried",
    "employment_years": 3,
    "company_category": "Category A",
    "pan_number": "ABCDE1234F",
    "aadhar_number": "1234-5678-9012",
    "address": "123, Tech Park, Bangalore, Karnataka - 560001",
    "phone": "+91-9876543210",
    "date_of_birth": "1995-06-15",
    "gender": "Male",
    "marital_status": "Single",
    "current_loan_outstanding": 200000.0,
    "bank_account_number": "1234567890",
    "bank_name": "HDFC Bank",
    "bank_ifsc": "HDFC0001234",
    # KYC Documents (mocked)
    "kyc_verified": True,
    "kyc_status": "VERIFIED",
    "cibil_score": 750,
    "cibil_last_updated": "2024-11-15",
    # Loan eligibility metrics
    "max_eligible_amount": 500000.0,
    "risk_category": "Low Risk",
    "profile_completeness": 100,
    "description": "Young professional with good credit score and stable income. High loan approval probability.",
}

# Profile 2: Mid-Career Professional (Average Credit, Moderate EMI)
PROFILE_MID_CAREER = {
    "monthly_income": 50000.0,
    "existing_emi": 12000.0,
    "mock_credit_score": 680,
    "segment": "Salaried",
    "employment_type": "Salaried",
    "employment_years": 7,
    "company_category": "Category B",
    "pan_number": "FGHIJ5678K",
    "aadhar_number": "9876-5432-1098",
    "address": "456, Green Avenue, Pune, Maharashtra - 411001",
    "phone": "+91-9876543211",
    "date_of_birth": "1990-03-22",
    "gender": "Female",
    "marital_status": "Married",
    "current_loan_outstanding": 350000.0,
    "bank_account_number": "2345678901",
    "bank_name": "ICICI Bank",
    "bank_ifsc": "ICIC0002345",
    # KYC Documents (mocked)
    "kyc_verified": True,
    "kyc_status": "VERIFIED",
    "cibil_score": 680,
    "cibil_last_updated": "2024-10-20",
    # Loan eligibility metrics
    "max_eligible_amount": 300000.0,
    "risk_category": "Medium Risk",
    "profile_completeness": 95,
    "description": "Mid-career professional with moderate existing EMI. May need loan amount adjustment.",
}

# Profile 3: Entry-Level Professional (Lower Credit, New to Credit)
PROFILE_ENTRY_LEVEL = {
    "monthly_income": 35000.0,
    "existing_emi": 3000.0,
    "mock_credit_score": 650,
    "segment": "New to Credit",
    "employment_type": "Salaried",
    "employment_years": 1,
    "company_category": "Category B",
    "pan_number": "KLMNO9012P",
    "aadhar_number": "5555-6666-7777",
    "address": "789, Lake View, Hyderabad, Telangana - 500001",
    "phone": "+91-9876543212",
    "date_of_birth": "1998-09-10",
    "gender": "Male",
    "marital_status": "Single",
    "current_loan_outstanding": 50000.0,
    "bank_account_number": "3456789012",
    "bank_name": "SBI",
    "bank_ifsc": "SBIN0003456",
    # KYC Documents (mocked)
    "kyc_verified": True,
    "kyc_status": "VERIFIED",
    "cibil_score": 650,
    "cibil_last_updated": "2024-11-01",
    # Loan eligibility metrics
    "max_eligible_amount": 200000.0,
    "risk_category": "High Risk",
    "profile_completeness": 90,
    "description": "Entry-level professional with limited credit history. Eligible for smaller loan amounts.",
}

# List of all profiles for random selection
MOCK_PROFILES: List[Dict[str, Any]] = [
    PROFILE_YOUNG_PROFESSIONAL,
    PROFILE_MID_CAREER,
    PROFILE_ENTRY_LEVEL,
]


def get_random_mock_profile() -> Dict[str, Any]:
    """
    Get a random mock profile from the available profiles.

    Returns:
        Dictionary with mock user financial data
    """
    return random.choice(MOCK_PROFILES).copy()


def get_profile_by_index(index: int) -> Dict[str, Any]:
    """
    Get a specific mock profile by index.

    Args:
        index: Profile index (0-2)

    Returns:
        Dictionary with mock user financial data
    """
    if 0 <= index < len(MOCK_PROFILES):
        return MOCK_PROFILES[index].copy()
    return MOCK_PROFILES[0].copy()


def get_all_profiles() -> List[Dict[str, Any]]:
    """
    Get all available mock profiles.

    Returns:
        List of all mock profile dictionaries
    """
    return [profile.copy() for profile in MOCK_PROFILES]


def assign_mock_profile_to_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Assign a random mock profile to a new user, preserving their basic info.

    Args:
        user_data: User's basic info (user_id, email, full_name)

    Returns:
        Complete user profile with mock financial data
    """
    # Get random profile
    mock_profile = get_random_mock_profile()

    # Merge user's actual data with mock profile
    complete_profile = {
        **mock_profile,  # Start with mock financial data
        "user_id": user_data.get("user_id"),
        "email": user_data.get("email"),
        "full_name": user_data.get("full_name"),
    }

    # If user provided any financial data during signup, use that instead
    if "monthly_income" in user_data and user_data["monthly_income"]:
        complete_profile["monthly_income"] = user_data["monthly_income"]
    if "existing_emi" in user_data and user_data["existing_emi"]:
        complete_profile["existing_emi"] = user_data["existing_emi"]

    return complete_profile


# Profile descriptions for admin/display purposes
PROFILE_DESCRIPTIONS = {
    "YOUNG_PROFESSIONAL": {
        "name": "Young Professional",
        "income_range": "₹70,000 - ₹80,000",
        "credit_score_range": "740-760",
        "approval_rate": "95%",
        "max_loan": "₹5,00,000",
        "typical_decision": "APPROVED",
    },
    "MID_CAREER": {
        "name": "Mid-Career Professional",
        "income_range": "₹45,000 - ₹55,000",
        "credit_score_range": "670-690",
        "approval_rate": "75%",
        "max_loan": "₹3,00,000",
        "typical_decision": "APPROVED or ADJUST",
    },
    "ENTRY_LEVEL": {
        "name": "Entry-Level Professional",
        "income_range": "₹30,000 - ₹40,000",
        "credit_score_range": "640-660",
        "approval_rate": "60%",
        "max_loan": "₹2,00,000",
        "typical_decision": "APPROVED (smaller amounts) or ADJUST",
    },
}
