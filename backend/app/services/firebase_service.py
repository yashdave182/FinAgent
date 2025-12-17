"""
Firebase service for Firestore database and Authentication.
Handles all Firebase operations including user profiles and loan applications.
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import firebase_admin
from app.config import settings
from app.utils.logger import default_logger as logger
from firebase_admin import auth, credentials, firestore
from google.cloud.firestore_v1 import FieldFilter


class FirebaseService:
    """Service for Firebase Firestore and Authentication operations."""

    def __init__(self):
        """Initialize Firebase Admin SDK and Firestore client."""
        self.db: Optional[firestore.Client] = None
        self.initialized = False
        self._initialize_firebase()

    def _initialize_firebase(self) -> None:
        """Initialize Firebase Admin SDK with credentials."""
        try:
            # Check if Firebase app is already initialized
            if not firebase_admin._apps:
                # Try to load credentials from environment or use default
                if settings.FIREBASE_CREDENTIALS:
                    # If FIREBASE_CREDENTIALS is a JSON string
                    if settings.FIREBASE_CREDENTIALS.startswith("{"):
                        cred_dict = json.loads(settings.FIREBASE_CREDENTIALS)
                        cred = credentials.Certificate(cred_dict)
                    else:
                        # If it's a file path
                        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS)

                    firebase_admin.initialize_app(
                        cred, {"projectId": settings.FIREBASE_PROJECT_ID}
                    )
                else:
                    # Use Application Default Credentials (for local dev with gcloud)
                    firebase_admin.initialize_app(
                        options={"projectId": settings.FIREBASE_PROJECT_ID}
                    )

            self.db = firestore.client()
            self.initialized = True
            logger.info("Firebase initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {str(e)}")
            # For development, we can continue without Firebase
            logger.warning("Running without Firebase connection (dev mode)")
            self.initialized = False

    # ========================================================================
    # User Profile Operations
    # ========================================================================

    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve user profile from Firestore.

        Args:
            user_id: User ID

        Returns:
            User profile dict or None if not found
        """
        if not self.initialized:
            logger.warning("Firebase not initialized, returning mock data")
            return self._get_mock_user_profile(user_id)

        try:
            doc_ref = self.db.collection("users").document(user_id)
            doc = doc_ref.get()

            if doc.exists:
                profile = doc.to_dict()
                profile["user_id"] = user_id
                logger.info(f"Retrieved profile for user {user_id}")
                return profile
            else:
                logger.warning(f"User profile not found: {user_id}")
                return None

        except Exception as e:
            logger.error(f"Error fetching user profile: {str(e)}")
            return None

    def create_user_profile(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user profile in Firestore.

        Args:
            user_data: User profile data

        Returns:
            Created user profile with user_id
        """
        if not self.initialized:
            logger.warning("Firebase not initialized, returning mock data")
            return {**user_data, "user_id": "mock_user_123"}

        try:
            user_id = user_data.get("user_id")
            if not user_id:
                # Generate user_id from Firebase Auth UID or create new
                user_id = self.db.collection("users").document().id

            user_data["user_id"] = user_id
            user_data["created_at"] = datetime.utcnow()
            user_data["updated_at"] = datetime.utcnow()

            # Set default values
            user_data.setdefault("existing_emi", 0.0)
            user_data.setdefault("mock_credit_score", 650)
            user_data.setdefault("segment", "New to Credit")

            doc_ref = self.db.collection("users").document(user_id)
            doc_ref.set(user_data)

            logger.info(f"Created user profile: {user_id}")
            return user_data

        except Exception as e:
            logger.error(f"Error creating user profile: {str(e)}")
            raise

    def update_user_profile(
        self, user_id: str, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing user profile.

        Args:
            user_id: User ID
            update_data: Fields to update

        Returns:
            Updated user profile
        """
        if not self.initialized:
            logger.warning("Firebase not initialized")
            return {"user_id": user_id, **update_data}

        try:
            update_data["updated_at"] = datetime.utcnow()
            doc_ref = self.db.collection("users").document(user_id)
            doc_ref.update(update_data)

            logger.info(f"Updated user profile: {user_id}")
            return self.get_user_profile(user_id)

        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            raise

    # ========================================================================
    # Loan Application Operations
    # ========================================================================

    def create_loan_application(self, loan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new loan application in Firestore.

        Args:
            loan_data: Loan application data

        Returns:
            Created loan application with loan_id
        """
        if not self.initialized:
            logger.warning("Firebase not initialized, returning mock data")
            return {**loan_data, "loan_id": "mock_loan_123"}

        try:
            # Generate loan ID
            loan_ref = self.db.collection("loan_applications").document()
            loan_id = loan_ref.id

            loan_data["loan_id"] = loan_id
            loan_data["created_at"] = datetime.utcnow()
            loan_data["updated_at"] = datetime.utcnow()

            loan_ref.set(loan_data)

            logger.info(f"Created loan application: {loan_id}")
            return loan_data

        except Exception as e:
            logger.error(f"Error creating loan application: {str(e)}")
            raise

    def update_loan_application(
        self, loan_id: str, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing loan application.

        Args:
            loan_id: Loan application ID
            update_data: Fields to update

        Returns:
            Updated loan application
        """
        if not self.initialized:
            logger.warning("Firebase not initialized")
            return {"loan_id": loan_id, **update_data}

        try:
            update_data["updated_at"] = datetime.utcnow()
            doc_ref = self.db.collection("loan_applications").document(loan_id)
            doc_ref.update(update_data)

            logger.info(f"Updated loan application: {loan_id}")
            return self.get_loan_application(loan_id)

        except Exception as e:
            logger.error(f"Error updating loan application: {str(e)}")
            raise

    def get_loan_application(self, loan_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a loan application by ID.

        Args:
            loan_id: Loan application ID

        Returns:
            Loan application dict or None if not found
        """
        if not self.initialized:
            logger.warning("Firebase not initialized, returning mock data")
            return self._get_mock_loan_application(loan_id)

        try:
            doc_ref = self.db.collection("loan_applications").document(loan_id)
            doc = doc_ref.get()

            if doc.exists:
                loan = doc.to_dict()
                loan["loan_id"] = loan_id
                logger.info(f"Retrieved loan application: {loan_id}")
                return loan
            else:
                logger.warning(f"Loan application not found: {loan_id}")
                return None

        except Exception as e:
            logger.error(f"Error fetching loan application: {str(e)}")
            return None

    def get_user_loans(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all loan applications for a user.

        Args:
            user_id: User ID

        Returns:
            List of loan applications
        """
        if not self.initialized:
            logger.warning("Firebase not initialized, returning empty list")
            return []

        try:
            loans_ref = self.db.collection("loan_applications")
            query = loans_ref.where(
                filter=FieldFilter("user_id", "==", user_id)
            ).order_by("created_at", direction=firestore.Query.DESCENDING)

            loans = []
            for doc in query.stream():
                loan = doc.to_dict()
                loan["loan_id"] = doc.id
                loans.append(loan)

            logger.info(f"Retrieved {len(loans)} loans for user {user_id}")
            return loans

        except Exception as e:
            logger.error(f"Error fetching user loans: {str(e)}")
            return []

    def get_all_loans(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get all loan applications with pagination.

        Args:
            limit: Number of loans to retrieve
            offset: Number of loans to skip

        Returns:
            List of loan applications
        """
        if not self.initialized:
            logger.warning("Firebase not initialized, returning empty list")
            return []

        try:
            loans_ref = self.db.collection("loan_applications")
            query = loans_ref.order_by(
                "created_at", direction=firestore.Query.DESCENDING
            ).limit(limit)

            if offset > 0:
                # Get the document to start after
                skip_query = loans_ref.order_by(
                    "created_at", direction=firestore.Query.DESCENDING
                ).limit(offset)
                skip_docs = list(skip_query.stream())
                if skip_docs:
                    query = query.start_after(skip_docs[-1])

            loans = []
            for doc in query.stream():
                loan = doc.to_dict()
                loan["loan_id"] = doc.id
                loans.append(loan)

            logger.info(
                f"Retrieved {len(loans)} loans (limit={limit}, offset={offset})"
            )
            return loans

        except Exception as e:
            logger.error(f"Error fetching all loans: {str(e)}")
            return []

    # ========================================================================
    # Admin Operations
    # ========================================================================

    def get_admin_summary(self) -> Dict[str, Any]:
        """
        Get aggregated metrics for admin dashboard.

        Returns:
            Dictionary with admin metrics
        """
        if not self.initialized:
            logger.warning("Firebase not initialized, returning mock data")
            return self._get_mock_admin_summary()

        try:
            loans_ref = self.db.collection("loan_applications")
            loans = list(loans_ref.stream())

            total = len(loans)
            approved = 0
            rejected = 0
            adjust = 0
            total_amount = 0
            total_emi = 0
            total_credit = 0
            risk_dist = {"A": 0, "B": 0, "C": 0}

            today = datetime.utcnow().date()
            today_count = 0

            for doc in loans:
                loan = doc.to_dict()

                decision = loan.get("decision", "")
                if decision == "APPROVED":
                    approved += 1
                elif decision == "REJECTED":
                    rejected += 1
                elif decision == "ADJUST":
                    adjust += 1

                total_amount += loan.get("approved_amount", 0)
                total_emi += loan.get("emi", 0)
                total_credit += loan.get("credit_score", 0)

                risk_band = loan.get("risk_band", "C")
                if risk_band in risk_dist:
                    risk_dist[risk_band] += 1

                created_at = loan.get("created_at")
                if created_at and created_at.date() == today:
                    today_count += 1

            summary = {
                "total_applications": total,
                "approved_count": approved,
                "rejected_count": rejected,
                "adjust_count": adjust,
                "avg_loan_amount": total_amount / total if total > 0 else 0,
                "avg_emi": total_emi / total if total > 0 else 0,
                "avg_credit_score": total_credit / total if total > 0 else 0,
                "today_applications": today_count,
                "risk_distribution": risk_dist,
            }

            logger.info("Generated admin summary")
            return summary

        except Exception as e:
            logger.error(f"Error generating admin summary: {str(e)}")
            return self._get_mock_admin_summary()

    # ========================================================================
    # Authentication Operations
    # ========================================================================

    def verify_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """
        Verify Firebase ID token.

        Args:
            id_token: Firebase ID token from client

        Returns:
            Decoded token with user info or None if invalid
        """
        if not self.initialized:
            logger.warning("Firebase not initialized, skipping token verification")
            return {"uid": "mock_user_123", "email": "test@example.com"}

        try:
            decoded_token = auth.verify_id_token(id_token)
            logger.info(f"Token verified for user: {decoded_token.get('uid')}")
            return decoded_token

        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            return None

    # ========================================================================
    # Mock Data Methods (for development)
    # ========================================================================

    def _get_mock_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Return mock user profile for development."""
        return {
            "user_id": user_id,
            "full_name": "John Doe",
            "email": "john.doe@example.com",
            "monthly_income": 75000.0,
            "existing_emi": 5000.0,
            "mock_credit_score": 720,
            "segment": "Existing Customer",
            "created_at": datetime.utcnow(),
        }

    def _get_mock_loan_application(self, loan_id: str) -> Dict[str, Any]:
        """Return mock loan application for development."""
        return {
            "loan_id": loan_id,
            "user_id": "mock_user_123",
            "requested_amount": 500000.0,
            "requested_tenure_months": 36,
            "approved_amount": 500000.0,
            "tenure_months": 36,
            "emi": 16620.0,
            "interest_rate": 12.0,
            "credit_score": 720,
            "foir": 0.29,
            "decision": "APPROVED",
            "risk_band": "A",
            "explanation": "Approved based on excellent credit score and low FOIR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

    def _get_mock_admin_summary(self) -> Dict[str, Any]:
        """Return mock admin summary for development."""
        return {
            "total_applications": 25,
            "approved_count": 18,
            "rejected_count": 5,
            "adjust_count": 2,
            "avg_loan_amount": 425000.0,
            "avg_emi": 14250.0,
            "avg_credit_score": 695,
            "today_applications": 3,
            "risk_distribution": {"A": 12, "B": 10, "C": 3},
        }


# Singleton instance
firebase_service = FirebaseService()
