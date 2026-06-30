# backend/core/config.py

from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "MVP Educational Platform API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "edu_platform"
    
    # Gemini AI
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"  # current GA model; gemini-pro is retired
    GEMINI_TEMPERATURE: float = 0.7
    
    # Clerk Authentication
    CLERK_SECRET_KEY: str
    CLERK_PUBLISHABLE_KEY: Optional[str] = None
    CLERK_JWT_ISSUER: Optional[str] = None
    CLERK_API_URL: str = "https://api.clerk.com/v1"
    
    # Google Cloud
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    GOOGLE_CLOUD_PROJECT: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
    ALLOWED_METHODS: List[str] = ["*"]
    ALLOWED_HEADERS: List[str] = ["*"]
    
    # API Settings
    API_PREFIX: str = "/api"
    API_V1_PREFIX: str = "/api/v1"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds
    
    # Cache
    CACHE_TTL: int = 3600  # 1 hour
    CACHE_MAX_SIZE: int = 100
    
    # Testing Mode
    USE_TEST_AUTH: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"
        use_enum_values = True
        validate_assignment = True

# Create settings instance
try:
    settings = Settings()
    logger.info("✅ Settings loaded successfully")
    logger.info(f"📌 Using Gemini model: {settings.GEMINI_MODEL}")
except Exception as e:
    logger.error(f"❌ Failed to load settings: {e}")
    raise

# Validate required settings on startup
def validate_settings():
    """Validate that all required settings are present"""
    errors = []
    
    # Check required settings
    if not settings.GEMINI_API_KEY:
        errors.append("GEMINI_API_KEY is required but not set in .env file")
    
    if not settings.CLERK_SECRET_KEY:
        errors.append("CLERK_SECRET_KEY is required but not set in .env file")
    
    if errors:
        for error in errors:
            logger.error(f"❌ Configuration error: {error}")
        raise ValueError("\n".join(errors))
    
    # Production warnings
    if settings.ENVIRONMENT == "production":
        if settings.SECRET_KEY == "your-secret-key-here-change-in-production":
            logger.warning("⚠️ SECRET_KEY must be changed in production!")
        
        if settings.DEBUG:
            logger.warning("⚠️ DEBUG is True in production! Set to False for security.")
        
        if settings.USE_TEST_AUTH:
            logger.warning("⚠️ USE_TEST_AUTH is True in production! This is a security risk.")
    
    logger.info("✅ Settings validation passed")

# Run validation
validate_settings()