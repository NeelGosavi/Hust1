# backend/core/database.py

from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings
import logging
import ssl
import certifi
import os

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_manager = Database()

async def connect_to_mongo():
    """Connect to MongoDB with proper SSL/TLS handling"""
    try:
        if not settings.MONGODB_URL:
            raise ValueError("MONGODB_URL not configured")
        
        # Base connection options
        client_options = {
            "maxPoolSize": 50,
            "minPoolSize": 10,
            "serverSelectionTimeoutMS": 30000,
            "connectTimeoutMS": 30000,
            "socketTimeoutMS": 30000,
            "retryWrites": True,
            "w": "majority"
        }
        
        # Check if using MongoDB Atlas (cloud)
        if "mongodb+srv" in settings.MONGODB_URL or "mongodb.net" in settings.MONGODB_URL:
            logger.info("🔐 Connecting to MongoDB Atlas with SSL/TLS...")
            
            # Try different SSL configurations
            try:
                # Option 1: Use certifi
                client_options.update({
                    "tls": True,
                    "tlsCAFile": certifi.where(),
                })
                
                db_manager.client = AsyncIOMotorClient(
                    settings.MONGODB_URL,
                    **client_options
                )
            except Exception as ssl_error:
                logger.warning(f"SSL with certifi failed: {ssl_error}")
                try:
                    # Option 2: Allow invalid certificates (for development only)
                    client_options.update({
                        "tls": True,
                        "tlsAllowInvalidCertificates": True,
                        "tlsAllowInvalidHostnames": True,
                    })
                    db_manager.client = AsyncIOMotorClient(
                        settings.MONGODB_URL,
                        **client_options
                    )
                except Exception as e2:
                    logger.warning(f"SSL with invalid certs failed: {e2}")
                    try:
                        # Option 3: No SSL (won't work for Atlas)
                        db_manager.client = AsyncIOMotorClient(
                            settings.MONGODB_URL,
                            maxPoolSize=50,
                            minPoolSize=10
                        )
                    except Exception as e3:
                        raise Exception(f"All connection attempts failed: {e3}")
        else:
            # Local MongoDB
            logger.info("🖥️ Connecting to local MongoDB...")
            db_manager.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                **client_options
            )
        
        # Get database instance
        db_manager.db = db_manager.client[settings.DATABASE_NAME]
        
        # Test connection
        await db_manager.client.admin.command('ping')
        logger.info(f"✅ Connected to MongoDB successfully (Database: {settings.DATABASE_NAME})")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"❌ Could not connect to MongoDB: {e}")
        logger.error(f"   URL: {settings.MONGODB_URL[:50]}...")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    if db_manager.client:
        db_manager.client.close()
        logger.info("✅ Closed MongoDB connection")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        db = db_manager.db
        
        # Check if collections exist before creating indexes
        collections = await db.list_collection_names()
        
        if "courses" in collections:
            await db.courses.create_index("professor_id")
            await db.courses.create_index([("created_at", -1)])
            await db.courses.create_index("title")
        
        if "users" in collections:
            await db.users.create_index("clerk_id", unique=True)
            await db.users.create_index("email", unique=True)
        
        if "jobs" in collections:
            await db.jobs.create_index("company")
            await db.jobs.create_index([("created_at", -1)])
        
        if "applications" in collections:
            await db.applications.create_index("student_id")
            await db.applications.create_index("job_id")
            await db.applications.create_index("status")

        # Enrollments: one row per (student, course); the unique compound
        # index makes enroll idempotent and prevents duplicate enrollments.
        # Created unconditionally so the collection exists from first boot.
        await db.enrollments.create_index(
            [("student_id", 1), ("course_id", 1)], unique=True
        )
        await db.enrollments.create_index("student_id")

        # Conversations: one row per (student, course) tutor thread.
        await db.conversations.create_index(
            [("student_id", 1), ("course_id", 1)]
        )

        # Quiz results: a student's quiz submissions per course.
        await db.quiz_results.create_index([("student_id", 1), ("course_id", 1)])

        # Practice problems (DSA / system design / interview) + filtering.
        await db.practice_problems.create_index("category")
        await db.practice_problems.create_index([("category", 1), ("difficulty", 1)])
        await db.practice_problems.create_index("topics")

        # Practice progress: one row per (student, problem).
        await db.practice_progress.create_index(
            [("student_id", 1), ("problem_id", 1)], unique=True
        )

        logger.info("✅ Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"❌ Error creating indexes: {e}")

def get_db():
    """Get database instance"""
    if db_manager.db is None:
        logger.error("❌ Database not initialized")
        return None
    return db_manager.db

# Helper function to check database connection status
async def check_db_connection():
    """Check if database connection is healthy"""
    try:
        if db_manager.client is None:
            return False, "Database client not initialized"
        
        await db_manager.client.admin.command('ping')
        return True, "Connected"
    except Exception as e:
        return False, str(e)