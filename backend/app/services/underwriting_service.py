"""
Underwriting service for loan decision logic.
Implements credit evaluation and loan approval rules.
"""

import math
from datetime import datetime
from typing import Any, Dict

from app.config import settings
from app.utils.logger import default_logger as logger
from app.utils.logger import log_underwriting_decision


class UnderwritingService:
    """Service for evaluating loan applications and making credit decisions."""

    def __init__(self):
        """Initialize underwriting service with configuration."""
        self.interest_rate = settings.DEFAULT_INTEREST_RATE
        self.min_loan_amount = settings.MIN_LOAN_AMOUNT
        self.max_loan_amount = settings.MAX_LOAN_AMOUNT
        self.min_tenure = settings.MIN_TENURE_MONTHS
        self.max_tenure = settings.MAX_TENURE_MONTHS
        self.excellent_credit_score = settings.EXCELLENT_CREDIT_SCORE
        self.good_credit_score = settings.GOOD_CREDIT_SCORE
        self.foir_threshold_a = settings.FOIR_THRESHOLD_A
        self.foir_threshold_b = settings.FOIR_THRESHOLD_B

    def evaluate_application(
        self,
        user_profile: Dict[str, Any],
        requested_amount: float,
        requested_tenure_months: int,
    ) -> Dict[str, Any]:
        """
        Evaluate a loan application and make a credit decision.

        Args:
            user_profile: User profile with income and credit info
            requested_amount: Requested loan amount
            requested_tenure_months: Requested tenure in months

        Returns:
            Decision dict with approval status, amount, EMI, etc.
        """
        logger.info(
            f"Evaluating loan: amount={requested_amount}, tenure={requested_tenure_months}"
        )

        # Extract user data
        monthly_income = user_profile.get("monthly_income", 0)
        existing_emi = user_profile.get("existing_emi", 0)
        credit_score = user_profile.get("mock_credit_score", 650)
        user_id = user_profile.get("user_id", "unknown")

        # Validate basic requirements
        validation_error = self._validate_loan_request(
            requested_amount, requested_tenure_months, monthly_income
        )
        if validation_error:
            return self._create_rejection_response(
                user_id,
                requested_amount,
                requested_tenure_months,
                credit_score,
                0,
                validation_error,
            )

        # Calculate EMI
        emi = self._calculate_emi(requested_amount, requested_tenure_months)

        # Calculate FOIR (Fixed Obligations to Income Ratio)
        foir = self._calculate_foir(existing_emi, emi, monthly_income)

        # Make decision based on credit score and FOIR
        decision = self._make_decision(
            credit_score,
            foir,
            requested_amount,
            requested_tenure_months,
            monthly_income,
            existing_emi,
        )

        # Log decision
        log_underwriting_decision(
            logger,
            user_id,
            decision["decision"],
            decision["approved_amount"],
            credit_score,
            foir,
        )

        return decision

    def _validate_loan_request(
        self, amount: float, tenure: int, monthly_income: float
    ) -> str:
        """
        Validate basic loan request parameters.

        Returns:
            Error message if invalid, empty string if valid
        """
        if amount < self.min_loan_amount:
            return f"Loan amount must be at least ₹{self.min_loan_amount:,.0f}"

        if amount > self.max_loan_amount:
            return f"Loan amount cannot exceed ₹{self.max_loan_amount:,.0f}"

        if tenure < self.min_tenure:
            return f"Tenure must be at least {self.min_tenure} months"

        if tenure > self.max_tenure:
            return f"Tenure cannot exceed {self.max_tenure} months"

        if monthly_income <= 0:
            return "Valid monthly income is required"

        return ""

    def _calculate_emi(self, principal: float, tenure_months: int) -> float:
        """
        Calculate EMI using reducing balance method.

        Formula: EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
        Where:
            P = Principal loan amount
            r = Monthly interest rate (annual rate / 12 / 100)
            n = Tenure in months

        Args:
            principal: Loan amount
            tenure_months: Loan tenure in months

        Returns:
            Monthly EMI amount
        """
        # Convert annual interest rate to monthly rate
        monthly_rate = self.interest_rate / 12 / 100

        # Calculate EMI using the standard formula
        if monthly_rate == 0:
            # If interest rate is 0, EMI is simply principal / tenure
            emi = principal / tenure_months
        else:
            # Standard EMI calculation
            emi = (
                principal
                * monthly_rate
                * math.pow(1 + monthly_rate, tenure_months)
                / (math.pow(1 + monthly_rate, tenure_months) - 1)
            )

        return round(emi, 2)

    def _calculate_foir(
        self, existing_emi: float, new_emi: float, monthly_income: float
    ) -> float:
        """
        Calculate Fixed Obligations to Income Ratio.

        FOIR = (Existing EMI + New EMI) / Monthly Income

        Args:
            existing_emi: Existing loan EMIs
            new_emi: New loan EMI
            monthly_income: Monthly income

        Returns:
            FOIR ratio (0.0 to 1.0)
        """
        if monthly_income <= 0:
            return 1.0  # Maximum FOIR if income is invalid

        total_obligations = existing_emi + new_emi
        foir = total_obligations / monthly_income

        return round(foir, 3)

    def _make_decision(
        self,
        credit_score: int,
        foir: float,
        requested_amount: float,
        requested_tenure: int,
        monthly_income: float,
        existing_emi: float,
    ) -> Dict[str, Any]:
        """
        Make loan decision based on credit score and FOIR.

        Decision Rules:
        - Risk Band A (Excellent): Credit >= 720 AND FOIR <= 0.4
          → APPROVED with full amount
        - Risk Band B (Good): Credit >= 680 AND FOIR <= 0.5
          → APPROVED with adjusted amount (80%) OR suggest lower amount
        - Risk Band C (Poor): Otherwise
          → REJECTED

        Args:
            credit_score: User's credit score
            foir: Calculated FOIR
            requested_amount: Requested loan amount
            requested_tenure: Requested tenure
            monthly_income: Monthly income
            existing_emi: Existing EMIs

        Returns:
            Decision dictionary
        """
        # Risk Band A: Excellent - Full Approval
        if (
            credit_score >= self.excellent_credit_score
            and foir <= self.foir_threshold_a
        ):
            return self._create_approval_response(
                requested_amount,
                requested_tenure,
                credit_score,
                foir,
                "A",
                f"Approved! Excellent credit score ({credit_score}) and healthy FOIR ({foir:.1%}). "
                f"You qualify for the full amount with Risk Band A rating.",
            )

        # Risk Band B: Good - Conditional Approval or Adjustment
        if credit_score >= self.good_credit_score and foir <= self.foir_threshold_b:
            # If FOIR is slightly high, reduce the loan amount
            if foir > self.foir_threshold_a:
                # Calculate maximum affordable EMI
                max_affordable_emi = (
                    monthly_income * self.foir_threshold_a
                ) - existing_emi

                # Calculate maximum loan amount based on affordable EMI
                monthly_rate = self.interest_rate / 12 / 100
                if monthly_rate > 0:
                    adjusted_amount = (
                        max_affordable_emi
                        * (math.pow(1 + monthly_rate, requested_tenure) - 1)
                        / (monthly_rate * math.pow(1 + monthly_rate, requested_tenure))
                    )
                else:
                    adjusted_amount = max_affordable_emi * requested_tenure

                adjusted_amount = round(adjusted_amount, 2)

                # Ensure adjusted amount is at least minimum
                if adjusted_amount < self.min_loan_amount:
                    return self._create_rejection_response(
                        "unknown",
                        requested_amount,
                        requested_tenure,
                        credit_score,
                        foir,
                        f"Your current FOIR ({foir:.1%}) is too high. "
                        f"Maximum affordable loan amount (₹{adjusted_amount:,.0f}) "
                        f"is below minimum requirement.",
                    )

                return self._create_adjustment_response(
                    adjusted_amount,
                    requested_tenure,
                    credit_score,
                    foir,
                    "B",
                    f"Approved with adjustment! Your credit score ({credit_score}) is good, "
                    f"but your FOIR ({foir:.1%}) is slightly high. "
                    f"We can approve ₹{adjusted_amount:,.0f} instead of ₹{requested_amount:,.0f} "
                    f"to maintain healthy FOIR. Risk Band: B.",
                )
            else:
                # Full approval for Risk Band B
                return self._create_approval_response(
                    requested_amount,
                    requested_tenure,
                    credit_score,
                    foir,
                    "B",
                    f"Approved! Good credit score ({credit_score}) and acceptable FOIR ({foir:.1%}). "
                    f"Risk Band B rating.",
                )

        # Risk Band C: Poor - Rejection
        reasons = []
        if credit_score < self.good_credit_score:
            reasons.append(
                f"credit score ({credit_score}) is below minimum requirement ({self.good_credit_score})"
            )
        if foir > self.foir_threshold_b:
            reasons.append(
                f"FOIR ({foir:.1%}) exceeds maximum threshold ({self.foir_threshold_b:.1%})"
            )

        explanation = (
            f"Unfortunately, we cannot approve this loan because "
            f"{' and '.join(reasons)}. "
            f"Please improve your credit profile and try again."
        )

        return self._create_rejection_response(
            "unknown",
            requested_amount,
            requested_tenure,
            credit_score,
            foir,
            explanation,
        )

    def _create_approval_response(
        self,
        amount: float,
        tenure: int,
        credit_score: int,
        foir: float,
        risk_band: str,
        explanation: str,
    ) -> Dict[str, Any]:
        """Create an approval decision response."""
        emi = self._calculate_emi(amount, tenure)

        return {
            "decision": "APPROVED",
            "approved_amount": amount,
            "tenure_months": tenure,
            "emi": emi,
            "interest_rate": self.interest_rate,
            "credit_score": credit_score,
            "foir": foir,
            "risk_band": risk_band,
            "explanation": explanation,
            "total_payable": round(emi * tenure, 2),
            "processing_fee": round(amount * 0.02, 2),  # 2% processing fee
        }

    def _create_adjustment_response(
        self,
        adjusted_amount: float,
        tenure: int,
        credit_score: int,
        foir: float,
        risk_band: str,
        explanation: str,
    ) -> Dict[str, Any]:
        """Create an adjustment decision response."""
        emi = self._calculate_emi(adjusted_amount, tenure)

        # Recalculate FOIR with adjusted amount
        # Note: We don't have existing_emi here, so we use the provided foir
        # In practice, you'd recalculate with actual existing_emi

        return {
            "decision": "ADJUST",
            "approved_amount": adjusted_amount,
            "tenure_months": tenure,
            "emi": emi,
            "interest_rate": self.interest_rate,
            "credit_score": credit_score,
            "foir": foir,
            "risk_band": risk_band,
            "explanation": explanation,
            "total_payable": round(emi * tenure, 2),
            "processing_fee": round(adjusted_amount * 0.02, 2),
        }

    def _create_rejection_response(
        self,
        user_id: str,
        requested_amount: float,
        tenure: int,
        credit_score: int,
        foir: float,
        explanation: str,
    ) -> Dict[str, Any]:
        """Create a rejection decision response."""
        return {
            "decision": "REJECTED",
            "approved_amount": 0.0,
            "tenure_months": tenure,
            "emi": 0.0,
            "interest_rate": self.interest_rate,
            "credit_score": credit_score,
            "foir": foir,
            "risk_band": "C",
            "explanation": explanation,
            "total_payable": 0.0,
            "processing_fee": 0.0,
        }


# Singleton instance
underwriting_service = UnderwritingService()
