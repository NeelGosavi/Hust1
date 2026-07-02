# backend/main.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from core.database import connect_to_mongo, close_mongo_connection
from core.config import settings
from contextlib import asynccontextmanager
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan context manager for database connections
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting up application...")
    try:
        await connect_to_mongo()
        logger.info("✅ MongoDB connected successfully")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
    
    yield
    
    # Shutdown
    logger.info("🔄 Shutting down application...")
    try:
        await close_mongo_connection()
        logger.info("✅ MongoDB connection closed")
    except Exception as e:
        logger.error(f"❌ Error closing MongoDB connection: {e}")

# Create FastAPI app
app = FastAPI(
    title="MVP Educational Platform API",
    description="API for the MVP Educational Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
# Use an explicit allow-list from settings. A wildcard origin ("*") is
# incompatible with allow_credentials=True (browsers reject it) and would
# expose the credentialed API to any site, so it is intentionally omitted.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=settings.ALLOWED_METHODS,
    allow_headers=settings.ALLOWED_HEADERS,
)

# Import and include routers
try:
    from api.routes import professor, student, career, practice, user

    app.include_router(user.router, prefix="/api/user", tags=["User"])
    app.include_router(professor.router, prefix="/api/professor", tags=["Professor"])
    app.include_router(student.router, prefix="/api/student", tags=["Student"])
    app.include_router(career.router, prefix="/api/career", tags=["Career"])
    app.include_router(practice.router, prefix="/api/practice", tags=["Practice"])
    logger.info("✅ All routers loaded successfully")
except ImportError as e:
    logger.warning(f"⚠️ Could not import some routers: {e}")

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to the MVP Educational Platform API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": [
            "/api/professor/courses",
            "/api/professor/create-course",
            "/api/professor/courses/{course_id}",
            "/api/student/courses",
            "/api/career/jobs"
        ]
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    from core.database import db_manager
    db_status = "connected" if db_manager.db is not None else "disconnected"
    return {
        "status": "healthy",
        "database": db_status,
        "service": "educational-platform-api"
    }

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the full exception server-side, but never leak internals to clients.
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error"},
    )

if __name__ == "__main__":
    import uvicorn
    import os
    # Honor $PORT (Railway/Heroku set it); reload only in development.
    port = int(os.environ.get("PORT", 8000))
    is_dev = settings.ENVIRONMENT == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=is_dev, log_level="info")