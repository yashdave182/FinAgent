"""
Main FastAPI application for FinAgent backend.
Chat2Sanction - AI-powered loan processing platform.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import admin, auth, chat, loan
from app.utils.logger import setup_logger

# Setup logger
logger = setup_logger("finagent", log_file="finagent.log")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("=" * 80)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 80)
    logger.info(f"Environment: {'Development' if settings.DEBUG else 'Production'}")
    logger.info(f"Firebase Project: {settings.FIREBASE_PROJECT_ID}")
    logger.info(f"LLM Model: {settings.GROQ_MODEL}")

    # Initialize services
    try:
        from app.agents.master_agent import master_agent
        from app.services.firebase_service import firebase_service
        from app.services.pdf_service import pdf_service
        from app.services.session_service import session_service
        from app.services.underwriting_service import underwriting_service

        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {str(e)}")

    # Create output directories
    os.makedirs(settings.PDF_OUTPUT_DIR, exist_ok=True)
    logger.info(f"PDF output directory: {settings.PDF_OUTPUT_DIR}")

    logger.info("✓ Application startup complete")
    logger.info("=" * 80)

    yield

    # Shutdown
    logger.info("=" * 80)
    logger.info("Shutting down application")
    logger.info("=" * 80)


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered loan processing platform with conversational interface",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/api/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    from app.services.firebase_service import firebase_service
    from app.services.pdf_service import pdf_service

    # Check if PDF output directory is writable
    pdf_writable = False
    try:
        import tempfile

        test_file = os.path.join(pdf_service.output_dir, ".test_write")
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        pdf_writable = True
    except Exception:
        pass

    return {
        "status": "healthy",
        "firebase": "connected" if firebase_service.initialized else "disconnected",
        "llm": "configured" if settings.GROQ_API_KEY else "not configured",
        "pdf_service": {
            "output_dir": pdf_service.output_dir,
            "writable": pdf_writable,
        },
    }


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(loan.router, prefix="/api/loan", tags=["Loans"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred",
        },
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all HTTP requests."""
    from time import time

    start_time = time()

    # Process request
    response = await call_next(request)

    # Log request
    duration = (time() - start_time) * 1000  # Convert to milliseconds
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} ({duration:.2f}ms)"
    )

    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=settings.WORKERS,
    )
