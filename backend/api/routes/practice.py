"""Practice / job-prep module.

A single problem bank that spans three categories — DSA/LeetCode, system design,
and interview prep — plus per-student progress tracking. Professors author the
bank; students browse, filter, and mark their progress.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId
import logging

from api.deps import get_authenticated_user
from core.database import get_db
from models.schemas import User

logger = logging.getLogger(__name__)
router = APIRouter()

Category = Literal["dsa", "system_design", "interview"]
Difficulty = Literal["easy", "medium", "hard"]
Status = Literal["todo", "attempted", "solved"]


# ---------- Request / response models ----------

class ProblemCreate(BaseModel):
    category: Category
    title: str
    difficulty: Difficulty
    topics: List[str] = []
    description: str = ""
    external_url: Optional[str] = None


class ProblemResponse(BaseModel):
    id: str
    category: str
    title: str
    difficulty: str
    topics: List[str]
    description: str
    external_url: Optional[str] = None
    status: Status = "todo"  # the requesting student's progress


class ProgressUpdate(BaseModel):
    status: Status


# ---------- Helpers ----------

def _require_professor(user: User) -> None:
    if user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can manage problems")


def _to_response(problem: dict, status: str = "todo") -> ProblemResponse:
    return ProblemResponse(
        id=str(problem["_id"]),
        category=problem.get("category", "dsa"),
        title=problem.get("title", "Untitled"),
        difficulty=problem.get("difficulty", "easy"),
        topics=problem.get("topics", []),
        description=problem.get("description", ""),
        external_url=problem.get("external_url"),
        status=status,
    )


# ---------- Student: browse & solve ----------

@router.get("/problems", response_model=List[ProblemResponse])
async def list_problems(
    current_user: User = Depends(get_authenticated_user),
    category: Optional[Category] = Query(None),
    difficulty: Optional[Difficulty] = Query(None),
    topic: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """Browse the problem bank with filters, merged with the student's status."""
    try:
        db = get_db()
        query: dict = {}
        if category:
            query["category"] = category
        if difficulty:
            query["difficulty"] = difficulty
        if topic:
            query["topics"] = topic
        if search:
            query["title"] = {"$regex": search, "$options": "i"}

        problems = await db.practice_problems.find(query).sort(
            "created_at", -1
        ).limit(limit).to_list(length=limit)

        # Merge in this student's progress.
        progress = await db.practice_progress.find(
            {"student_id": current_user.clerk_id}
        ).to_list(length=2000)
        status_map = {p["problem_id"]: p.get("status", "todo") for p in progress}

        return [
            _to_response(p, status_map.get(str(p["_id"]), "todo"))
            for p in problems
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing practice problems: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch problems")


@router.get("/problems/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: str,
    current_user: User = Depends(get_authenticated_user),
):
    if not ObjectId.is_valid(problem_id):
        raise HTTPException(status_code=400, detail="Invalid problem ID format")
    try:
        db = get_db()
        problem = await db.practice_problems.find_one({"_id": ObjectId(problem_id)})
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")

        progress = await db.practice_progress.find_one(
            {"student_id": current_user.clerk_id, "problem_id": problem_id}
        )
        status = progress.get("status", "todo") if progress else "todo"
        return _to_response(problem, status)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching problem {problem_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch problem")


@router.put("/problems/{problem_id}/progress")
async def set_progress(
    problem_id: str,
    update: ProgressUpdate,
    current_user: User = Depends(get_authenticated_user),
):
    """Set the student's status (todo/attempted/solved) for a problem."""
    if not ObjectId.is_valid(problem_id):
        raise HTTPException(status_code=400, detail="Invalid problem ID format")
    try:
        db = get_db()
        exists = await db.practice_problems.find_one(
            {"_id": ObjectId(problem_id)}, {"_id": 1}
        )
        if not exists:
            raise HTTPException(status_code=404, detail="Problem not found")

        await db.practice_progress.update_one(
            {"student_id": current_user.clerk_id, "problem_id": problem_id},
            {"$set": {"status": update.status, "updated_at": datetime.utcnow()}},
            upsert=True,
        )
        return {"problem_id": problem_id, "status": update.status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating progress for {problem_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update progress")


@router.get("/stats")
async def practice_stats(current_user: User = Depends(get_authenticated_user)):
    """Per-category counts of the bank plus the student's solved/attempted totals."""
    try:
        db = get_db()

        totals_cursor = db.practice_problems.aggregate(
            [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
        )
        totals = {row["_id"]: row["count"] async for row in totals_cursor}

        progress = await db.practice_progress.find(
            {"student_id": current_user.clerk_id}
        ).to_list(length=5000)
        solved = sum(1 for p in progress if p.get("status") == "solved")
        attempted = sum(1 for p in progress if p.get("status") == "attempted")

        return {
            "total_by_category": totals,
            "total_problems": sum(totals.values()),
            "solved": solved,
            "attempted": attempted,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error computing practice stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch stats")


# ---------- Professor: manage the bank ----------

@router.post("/problems", response_model=ProblemResponse, status_code=201)
async def create_problem(
    body: ProblemCreate,
    current_user: User = Depends(get_authenticated_user),
):
    """Add a problem to the bank (professors only)."""
    _require_professor(current_user)
    try:
        db = get_db()
        doc = {
            "category": body.category,
            "title": body.title,
            "difficulty": body.difficulty,
            "topics": body.topics,
            "description": body.description,
            "external_url": body.external_url,
            "created_by": current_user.clerk_id,
            "created_at": datetime.utcnow(),
        }
        result = await db.practice_problems.insert_one(doc)
        doc["_id"] = result.inserted_id
        return _to_response(doc, "todo")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating problem: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create problem")


@router.delete("/problems/{problem_id}")
async def delete_problem(
    problem_id: str,
    current_user: User = Depends(get_authenticated_user),
):
    """Delete a problem from the bank (professors only)."""
    _require_professor(current_user)
    if not ObjectId.is_valid(problem_id):
        raise HTTPException(status_code=400, detail="Invalid problem ID format")
    try:
        db = get_db()
        result = await db.practice_problems.delete_one({"_id": ObjectId(problem_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Problem not found")
        return {"message": "Problem deleted", "problem_id": problem_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting problem {problem_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete problem")
