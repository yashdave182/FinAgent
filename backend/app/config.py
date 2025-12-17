"""
Configuration module for FinAgent backend.
Handles environment variables and service initialization.
"""

import os
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Configuration
    APP_NAME: str = "FinAgent - Chat2Sanction API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # LLM Configuration (Groq)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-70b-versatile"
    LLM_TEMPERATURE: float = 0.3

    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = "finagent-fdc80"
    FIREBASE_API_KEY: str = "AIzaSyCS95PURecjhaLyyEc7RSYfR63YiN2kzec"
    FIREBASE_AUTH_DOMAIN: str = "finagent-fdc80.firebaseapp.com"
    FIREBASE_STORAGE_BUCKET: str = "finagent-fdc80.firebasestorage.app"
    FIREBASE_MESSAGING_SENDER_ID: str = "613182907538"
    FIREBASE_APP_ID: str = "1:613182907538:web:5fb81003908baccecbf24b"
    FIREBASE_MEASUREMENT_ID: str = "G-CLXYJVNRSP"

    # Firebase Admin SDK (for Firestore and Auth verification)
    # Can be JSON string or path to service account file
    FIREBASE_CREDENTIALS: str = ""  # Will use Application Default Credentials if empty

    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://finagent-fdc80.web.app",
        "https://finagent-fdc80.firebaseapp.com",
    ]

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1

    # PDF Configuration
    PDF_OUTPUT_DIR: str = "sanctions"
    PDF_VALIDITY_DAYS: int = 7

    # Loan Configuration
    DEFAULT_INTEREST_RATE: float = 12.0  # Annual percentage
    MIN_LOAN_AMOUNT: float = 50000.0
    MAX_LOAN_AMOUNT: float = 5000000.0
    MIN_TENURE_MONTHS: int = 6
    MAX_TENURE_MONTHS: int = 60

    # Underwriting Thresholds
    EXCELLENT_CREDIT_SCORE: int = 720
    GOOD_CREDIT_SCORE: int = 680
    FOIR_THRESHOLD_A: float = 0.4
    FOIR_THRESHOLD_B: float = 0.5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses LRU cache to avoid recreating settings on every call.
    """
    return Settings()


# Global settings instance
settings = get_settings()
