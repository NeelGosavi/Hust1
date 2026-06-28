from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from api.deps import get_authenticated_user
from models.schemas import User
from core.database import get_db
from services.rag_service import ask_ai_tutor, initialize_course_rag
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------- Response models ----------

class CourseListResponse(BaseModel):
    id: str
    title: str
    description: str
    professor_name: Optional[str] = None
    created_at: str
    enrollment_count: int
    is_enrolled: bool
    progress: float = 0.0


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str


class ConversationResponse(BaseModel):
    conversation_id: Optional[str] = None
    messages: List[dict] = []


class QuizSubmitRequest(BaseModel):
    answers: List[str]  # selected option text per question, aligned by index


class QuizResultItem(BaseModel):
    question: str
    your_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool


class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    percentage: float
    results: List[QuizResultItem]


# ---------- Helpers ----------

async def _ensure_enrollment(db, student_id: str, course_id: str) -> None:
    """Idempotently enroll a student in a course.

    Uses an upsert against the unique (student_id, course_id) index so repeated
    calls are safe; the course enrollment_count is incremented only when the
    enrollment is newly created.
    """
    result = await db.enrollments.update_one(
        {"student_id": student_id, "course_id": course_id},
        {"$setOnInsert": {
            "student_id": student_id,
            "course_id": course_id,
            "enrolled_at": datetime.utcnow(),
            "progress": 0.0,
            "completed": False,
        }},
        upsert=True,
    )
    if result.upserted_id is not None:
        await db.courses.update_one(
            {"_id": ObjectId(course_id)},
            {"$inc": {"enrollment_count": 1}},
        )


async def _professor_names(db, courses: list) -> dict:
    """Map professor clerk_id -> display name for a batch of courses."""
    professor_ids = list({c.get("professor_id") for c in courses if c.get("professor_id")})
    if not professor_ids:
        return {}
    profs = await db.users.find(
        {"clerk_id": {"$in": professor_ids}}
    ).to_list(length=len(professor_ids))
    return {p["clerk_id"]: p.get("name", "Unknown") for p in profs}


# ---------- Course discovery ----------

@router.get("/courses", response_model=List[CourseListResponse])
async def get_available_courses(
    current_user: User = Depends(get_authenticated_user),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    """Browse published courses, with optional title/description search."""
    try:
        db = get_db()
        query = {"is_published": True}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
            ]

        courses = await db.courses.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)

        enrollments = await db.enrollments.find(
            {"student_id": current_user.clerk_id}
        ).to_list(length=1000)
        enrolled_ids = {e["course_id"] for e in enrollments}
        progress_map = {e["course_id"]: e.get("progress", 0.0) for e in enrollments}

        professors = await _professor_names(db, courses)

        return [
            CourseListResponse(
                id=str(c["_id"]),
                title=c.get("title", "Untitled"),
                description=c.get("description", ""),
                professor_name=professors.get(c.get("professor_id"), "Unknown"),
                created_at=c.get("created_at").isoformat() if c.get("created_at") else "",
                enrollment_count=c.get("enrollment_count", 0),
                is_enrolled=str(c["_id"]) in enrolled_ids,
                progress=progress_map.get(str(c["_id"]), 0.0),
            )
            for c in courses
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching available courses: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch courses")


@router.get("/my-courses", response_model=List[CourseListResponse])
async def get_my_courses(current_user: User = Depends(get_authenticated_user)):
    """Courses the current student is enrolled in."""
    try:
        db = get_db()
        enrollments = await db.enrollments.find(
            {"student_id": current_user.clerk_id}
        ).to_list(length=1000)
        if not enrollments:
            return []

        valid = [e for e in enrollments if ObjectId.is_valid(e["course_id"])]
        course_oids = [ObjectId(e["course_id"]) for e in valid]
        courses = await db.courses.find(
            {"_id": {"$in": course_oids}, "is_published": True}
        ).to_list(length=len(course_oids))

        progress_map = {e["course_id"]: e.get("progress", 0.0) for e in enrollments}
        professors = await _professor_names(db, courses)

        return [
            CourseListResponse(
                id=str(c["_id"]),
                title=c.get("title", "Untitled"),
                description=c.get("description", ""),
                professor_name=professors.get(c.get("professor_id"), "Unknown"),
                created_at=c.get("created_at").isoformat() if c.get("created_at") else "",
                enrollment_count=c.get("enrollment_count", 0),
                is_enrolled=True,
                progress=progress_map.get(str(c["_id"]), 0.0),
            )
            for c in courses
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching my courses: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch your courses")


@router.post("/enroll/{course_id}")
async def enroll_in_course(
    course_id: str,
    current_user: User = Depends(get_authenticated_user),
):
    """Explicitly enroll in a course (for a browse-then-enroll UI)."""
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID format")
    try:
        db = get_db()
        course = await db.courses.find_one({"_id": ObjectId(course_id), "is_published": True})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        await _ensure_enrollment(db, current_user.clerk_id, course_id)
        return {"message": "Successfully enrolled in course"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enrolling in {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to enroll")


# ---------- Course view ----------

@router.get("/course/{course_id}")
async def get_course(
    course_id: str,
    current_user: User = Depends(get_authenticated_user),
):
    """Fetch a course for study. Opening a course auto-enrolls the student
    (accessing via the shared QR/link is treated as joining)."""
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID format")
    try:
        db = get_db()
        course = await db.courses.find_one({"_id": ObjectId(course_id), "is_published": True})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Opening the course enrolls the student.
        await _ensure_enrollment(db, current_user.clerk_id, course_id)
        enrollment = await db.enrollments.find_one(
            {"student_id": current_user.clerk_id, "course_id": course_id}
        )

        professor_name = "Unknown"
        if course.get("professor_id"):
            professor = await db.users.find_one({"clerk_id": course["professor_id"]})
            if professor:
                professor_name = professor.get("name", "Unknown")

        # Warm the tutor's context for this course.
        await initialize_course_rag(course_id, course["script"])

        return {
            "id": str(course["_id"]),
            "title": course.get("title"),
            "description": course.get("description"),
            "script": course.get("script"),
            "slides": course.get("slides", []),
            "quiz": course.get("quiz", []),
            "professor_name": professor_name,
            "created_at": course.get("created_at").isoformat() if course.get("created_at") else "",
            "enrollment_count": course.get("enrollment_count", 0),
            "is_enrolled": True,
            "progress": enrollment.get("progress", 0.0) if enrollment else 0.0,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load course")


# ---------- AI tutor ----------

@router.post("/course/{course_id}/chat", response_model=ChatResponse)
async def chat_with_tutor(
    course_id: str,
    request: ChatRequest,
    current_user: User = Depends(get_authenticated_user),
):
    """Ask the course AI tutor. The exchange is persisted per (student, course)."""
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID format")
    try:
        db = get_db()
        course = await db.courses.find_one({"_id": ObjectId(course_id), "is_published": True})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Using the tutor implies enrollment.
        await _ensure_enrollment(db, current_user.clerk_id, course_id)

        reply = await ask_ai_tutor(course_id, request.message, course["script"])

        now = datetime.utcnow()
        await db.conversations.update_one(
            {"student_id": current_user.clerk_id, "course_id": course_id},
            {
                "$push": {"messages": {"$each": [
                    {"role": "user", "text": request.message, "at": now},
                    {"role": "tutor", "text": reply, "at": now},
                ]}},
                "$set": {"updated_at": now},
                "$setOnInsert": {
                    "student_id": current_user.clerk_id,
                    "course_id": course_id,
                    "created_at": now,
                },
            },
            upsert=True,
        )

        conversation = await db.conversations.find_one(
            {"student_id": current_user.clerk_id, "course_id": course_id}
        )
        conversation_id = request.conversation_id or str(conversation["_id"])
        return ChatResponse(reply=reply, conversation_id=conversation_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in tutor chat for course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process your question")


@router.get("/course/{course_id}/chat", response_model=ConversationResponse)
async def get_chat_history(
    course_id: str,
    current_user: User = Depends(get_authenticated_user),
):
    """Return the saved tutor conversation for this (student, course)."""
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID format")
    try:
        db = get_db()
        convo = await db.conversations.find_one(
            {"student_id": current_user.clerk_id, "course_id": course_id}
        )
        if not convo:
            return ConversationResponse(conversation_id=None, messages=[])
        return ConversationResponse(
            conversation_id=str(convo["_id"]),
            messages=convo.get("messages", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chat history for {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch chat history")


# ---------- Quiz ----------

@router.post("/course/{course_id}/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    course_id: str,
    body: QuizSubmitRequest,
    current_user: User = Depends(get_authenticated_user),
):
    """Score a quiz submission, record the result, and advance course progress.

    `answers[i]` is the option text the student selected for question i.
    Course `progress` never regresses; `completed` becomes true at >= 70%.
    """
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID format")
    try:
        db = get_db()
        course = await db.courses.find_one({"_id": ObjectId(course_id), "is_published": True})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        quiz = course.get("quiz", [])
        if not quiz:
            raise HTTPException(status_code=400, detail="This course has no quiz")

        results: List[QuizResultItem] = []
        score = 0
        for i, q in enumerate(quiz):
            correct = q.get("answer", "")
            your = body.answers[i] if i < len(body.answers) else None
            is_correct = your is not None and your == correct
            if is_correct:
                score += 1
            results.append(QuizResultItem(
                question=q.get("question", ""),
                your_answer=your,
                correct_answer=correct,
                is_correct=is_correct,
            ))

        total = len(quiz)
        percentage = round(score / total * 100, 1) if total else 0.0
        now = datetime.utcnow()

        await db.quiz_results.insert_one({
            "student_id": current_user.clerk_id,
            "course_id": course_id,
            "score": score,
            "total": total,
            "percentage": percentage,
            "answers": body.answers,
            "submitted_at": now,
        })

        # Submitting the quiz implies enrollment; advance progress (never down).
        await _ensure_enrollment(db, current_user.clerk_id, course_id)
        enrollment = await db.enrollments.find_one(
            {"student_id": current_user.clerk_id, "course_id": course_id}
        )
        prev_progress = enrollment.get("progress", 0.0) if enrollment else 0.0
        prev_completed = enrollment.get("completed", False) if enrollment else False
        await db.enrollments.update_one(
            {"student_id": current_user.clerk_id, "course_id": course_id},
            {"$set": {
                "progress": max(prev_progress, percentage),
                "completed": prev_completed or percentage >= 70,
                "updated_at": now,
            }},
        )

        return QuizSubmitResponse(
            score=score, total=total, percentage=percentage, results=results
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting quiz for {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit quiz")


# ---------- Dashboard ----------

@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_authenticated_user)):
    """Aggregate stats + recent courses for the student dashboard."""
    try:
        db = get_db()
        enrollments = await db.enrollments.find(
            {"student_id": current_user.clerk_id}
        ).to_list(length=1000)

        total = len(enrollments)
        completed = sum(1 for e in enrollments if e.get("completed", False))
        avg_progress = (
            sum(e.get("progress", 0.0) for e in enrollments) / total if total else 0.0
        )

        recent = []
        for e in sorted(
            enrollments, key=lambda x: x.get("enrolled_at", datetime.min), reverse=True
        )[:5]:
            if not ObjectId.is_valid(e["course_id"]):
                continue
            course = await db.courses.find_one({"_id": ObjectId(e["course_id"])})
            if course:
                recent.append({
                    "course_id": e["course_id"],
                    "title": course.get("title", "Untitled"),
                    "progress": e.get("progress", 0.0),
                    "completed": e.get("completed", False),
                })

        return {
            "stats": {
                "total_courses": total,
                "completed_courses": completed,
                "in_progress": total - completed,
                "average_progress": round(avg_progress, 1),
            },
            "recent_courses": recent,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch stats")
