# backend/api/routes/professor.py

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from models.schemas import User, CourseCreate, CourseResponse
from api.deps import get_current_user, get_current_user_testing
from services.llm_service import generate_course_content
from services.qr_service import generate_qr_code_base64
from core.database import get_db
from core.config import settings
from typing import List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class CourseListResponse(BaseModel):
    id: str
    title: str
    description: str
    created_at: str
    qr_code: Optional[str] = ""

class CourseDetailResponse(BaseModel):
    id: str
    title: str
    description: str
    script: str
    slides: List[dict]
    quiz: List[dict]
    created_at: str
    professor_id: str
    professor_email: str
    is_published: bool
    enrollment_count: int

@router.get("/courses", response_model=List[CourseListResponse])
async def get_professor_courses(
    request: Request,
    current_user: User = Depends(get_current_user if not settings.USE_TEST_AUTH else get_current_user_testing)
):
    """
    Get all courses for the current professor
    """
    try:
        logger.info(f"📚 Fetching courses for professor: {current_user.clerk_id}")
        logger.info(f"Request path: {request.url.path}")
        
        # Get database
        db = get_db()
        if db is None:
            logger.error("Database connection failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Fetch courses
        cursor = db.courses.find({"professor_id": current_user.clerk_id}).sort("created_at", -1)
        courses = await cursor.to_list(length=100)
        
        logger.info(f"📊 Found {len(courses)} courses")
        
        # Build response
        response = []
        for course in courses:
            course_id = str(course["_id"])
            
            # Generate QR code for each course
            try:
                student_url = f"{settings.FRONTEND_URL}/student/course/{course_id}"
                qr_code = generate_qr_code_base64(student_url)
            except Exception as e:
                logger.warning(f"Failed to generate QR code: {e}")
                qr_code = ""
            
            response.append(CourseListResponse(
                id=course_id,
                title=course.get("title", "Untitled Course"),
                description=course.get("description", ""),
                created_at=course.get("created_at").isoformat() if course.get("created_at") else "",
                qr_code=qr_code or ""
            ))
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching courses: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch courses: {str(e)}"
        )

@router.post("/create-course", response_model=CourseResponse)
async def create_course(
    request: CourseCreate,
    req: Request,
    current_user: User = Depends(get_current_user if not settings.USE_TEST_AUTH else get_current_user_testing)
):
    """
    Create a new course with AI-generated content
    """
    try:
        logger.info(f"📝 Creating course for professor: {current_user.clerk_id}")
        logger.info(f"Course title: {request.title}")
        
        # Get database
        db = get_db()
        if db is None:
            logger.error("Database connection failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Generate course content using Gemini
        logger.info("🔄 Generating course content with AI...")
        try:
            content = await generate_course_content(request.prompt)
            logger.info(f"✅ Content generated: {len(content.slides)} slides, {len(content.quiz)} quiz questions")
        except Exception as e:
            logger.error(f"❌ AI generation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate course content: {str(e)}"
            )
        
        # Prepare course data
        now = datetime.utcnow()
        new_course = {
            "professor_id": current_user.clerk_id,
            "professor_email": current_user.email,
            "title": request.title,
            "description": request.description,
            "script": content.script,
            "slides": [s.dict() if hasattr(s, 'dict') else s for s in content.slides],
            "quiz": [q.dict() if hasattr(q, 'dict') else q for q in content.quiz],
            "created_at": now,
            "updated_at": now,
            "is_published": False,
            "enrollment_count": 0
        }
        
        # Save to database
        try:
            result = await db.courses.insert_one(new_course)
            course_id = str(result.inserted_id)
            logger.info(f"✅ Course saved with ID: {course_id}")
        except Exception as e:
            logger.error(f"❌ Failed to save course: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save course: {str(e)}"
            )
        
        # Generate QR Code for student access
        try:
            student_url = f"{settings.FRONTEND_URL}/student/course/{course_id}"
            qr_code_b64 = generate_qr_code_base64(student_url)
            logger.info(f"✅ QR Code generated for course: {course_id}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to generate QR code: {e}")
            qr_code_b64 = ""
        
        return CourseResponse(
            course_id=course_id,
            qr_code=qr_code_b64 or "",
            title=new_course["title"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating course: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create course: {str(e)}"
        )

@router.get("/courses/{course_id}")
async def get_course_details(
    course_id: str,
    request: Request,
    current_user: User = Depends(get_current_user if not settings.USE_TEST_AUTH else get_current_user_testing)
):
    """
    Get detailed information about a specific course
    """
    try:
        from bson import ObjectId
        
        logger.info(f"📖 Fetching course details: {course_id}")
        logger.info(f"Request path: {request.url.path}")
        
        # Validate ObjectId
        if not ObjectId.is_valid(course_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid course ID format"
            )
        
        # Get database
        db = get_db()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Fetch course
        course = await db.courses.find_one({
            "_id": ObjectId(course_id),
            "professor_id": current_user.clerk_id
        })
        
        if not course:
            logger.warning(f"❌ Course not found: {course_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Convert ObjectId to string
        course["_id"] = str(course["_id"])
        
        logger.info(f"✅ Course found: {course.get('title')}")
        return course
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching course details: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch course details: {str(e)}"
        )

# backend/api/routes/professor.py (add this endpoint)

@router.get("/courses/{course_id}/qr")
async def get_course_qr_code(
    course_id: str,
    current_user: User = Depends(get_current_user if not settings.USE_TEST_AUTH else get_current_user_testing)
):
    """
    Get QR code for a specific course
    """
    try:
        from bson import ObjectId
        
        logger.info(f"📱 Generating QR code for course: {course_id}")
        
        # Validate ObjectId
        if not ObjectId.is_valid(course_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid course ID format"
            )
        
        # Get database
        db = get_db()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Verify course exists and belongs to professor
        course = await db.courses.find_one({
            "_id": ObjectId(course_id),
            "professor_id": current_user.clerk_id
        })
        
        if not course:
            logger.warning(f"❌ Course not found or not owned: {course_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Generate QR code
        student_url = f"{settings.FRONTEND_URL}/student/course/{course_id}"
        qr_code = generate_qr_code_base64(student_url)
        
        if not qr_code:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate QR code"
            )
        
        return {"qr_code": qr_code}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating QR code: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate QR code: {str(e)}"
        )


@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_user if not settings.USE_TEST_AUTH else get_current_user_testing)
):
    """
    Delete a course (only if owned by the professor)
    """
    try:
        from bson import ObjectId
        
        logger.info(f"🗑️ Deleting course: {course_id}")
        
        # Validate ObjectId
        if not ObjectId.is_valid(course_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid course ID format"
            )
        
        # Get database
        db = get_db()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Delete course
        result = await db.courses.delete_one({
            "_id": ObjectId(course_id),
            "professor_id": current_user.clerk_id
        })
        
        if result.deleted_count == 0:
            logger.warning(f"❌ Course not found or not owned: {course_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found or you don't have permission"
            )
        
        logger.info(f"✅ Course deleted: {course_id}")
        return {"message": "Course deleted successfully", "course_id": course_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting course: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete course: {str(e)}"
        )