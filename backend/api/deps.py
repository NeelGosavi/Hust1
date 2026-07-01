# backend/api/deps.py

import logging
from fastapi import Depends, HTTPException, status, Request
from clerk_backend_api.security import authenticate_request_async, AuthenticateRequestOptions, AuthStatus
from core.config import settings
from models.schemas import User
from core.database import get_db
from bson import ObjectId
from datetime import datetime

logger = logging.getLogger(__name__)

async def get_current_user(request: Request) -> User:
    """
    Get current user from Clerk authentication
    """
    try:
        # Authenticate request with Clerk
        auth_state = await authenticate_request_async(
            request,
            AuthenticateRequestOptions(
                secret_key=settings.CLERK_SECRET_KEY,
                accepts_token=["any"],
            ),
        )

        # Check authentication status
        if auth_state.status != AuthStatus.SIGNED_IN or not auth_state.payload:
            logger.warning(f"Clerk authentication failed: {getattr(auth_state.reason, 'value', auth_state.reason)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Extract user information from payload
        payload = auth_state.payload
        clerk_id = payload.get("sub") or payload.get("user_id") or payload.get("sid")

        if not clerk_id:
            logger.error("Clerk authentication payload missing user id")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get database connection
        db = get_db()
        if db is None:
            logger.error("Database connection failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )

        # Find or create user in database
        user = await db.users.find_one({"clerk_id": clerk_id})

        if not user:
            logger.info(f"Creating new user with clerk_id: {clerk_id}")
            
            # Extract email from payload
            email = payload.get("email", "")
            if not email:
                # Try to get email from other fields
                email = payload.get("email_address", "") or payload.get("email_addresses", [{}])[0].get("email_address", "")
            
            # Extract name from payload
            name = payload.get("name", "")
            if not name:
                first_name = payload.get("first_name", "")
                last_name = payload.get("last_name", "")
                name = f"{first_name} {last_name}".strip() or "Unknown User"
            
            # Create new user (role defaults to student until they onboard)
            new_user = {
                "clerk_id": clerk_id,
                "email": email,
                "name": name,
                "role": "student",
                "onboarded": False,  # prompt for role selection on first login
                "created_at": datetime.utcnow()
            }
            
            try:
                result = await db.users.insert_one(new_user)
                new_user["_id"] = result.inserted_id
                logger.info(f"✅ User created successfully with ID: {result.inserted_id}")
                return User(**new_user)
            except Exception as e:
                logger.error(f"Failed to create user: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user in database"
                )

        logger.info(f"✅ User authenticated: {user.get('email', clerk_id)}")
        return User(**user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Testing mode - Skip authentication
async def get_current_user_testing() -> User:
    """
    For testing purposes only - returns a mock user
    Use this when Clerk is not available
    """
    logger.warning("⚠️ Using testing authentication - DO NOT USE IN PRODUCTION")
    
    # Get database
    db = get_db()
    if db is None:
        # Return mock user if database not available
        return User(
            id=ObjectId(),
            clerk_id="test_user_123",
            email="test@example.com",
            role="professor",
            name="Test Professor"
        )
    
    # Try to get or create test user in database
    test_user = await db.users.find_one({"clerk_id": "test_user_123"})
    
    if not test_user:
        # Create test user
        test_user_data = {
            "clerk_id": "test_user_123",
            "email": "test@example.com",
            "name": "Test Professor",
            "role": "professor",
            "created_at": datetime.utcnow()
        }
        result = await db.users.insert_one(test_user_data)
        test_user_data["_id"] = result.inserted_id
        return User(**test_user_data)
    
    return User(**test_user)

# Unified dependency: honors the USE_TEST_AUTH flag in one place so every
# route behaves consistently instead of each deciding for itself.
async def get_authenticated_user(request: Request) -> User:
    if settings.USE_TEST_AUTH:
        return await get_current_user_testing()
    return await get_current_user(request)

# Optional: Get current user or return None (for optional authentication)
async def get_current_user_optional(request: Request) -> User | None:
    """
    Get current user if authenticated, otherwise return None
    """
    try:
        return await get_current_user(request)
    except HTTPException:
        return None