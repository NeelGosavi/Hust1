from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from api.deps import get_current_user
from models.schemas import User, Course
from core.database import get_db
from bson import ObjectId
from services.rag_service import ask_ai_tutor, initialize_course_rag

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.get("/course/{course_id}")
async def get_course(course_id: str, current_user: User = Depends(get_current_user)):
    try:
        db = get_db()
        course = await db.courses.find_one({"_id": ObjectId(course_id)})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
            
        # Initialize RAG vector store for this course silently in the background
        await initialize_course_rag(course_id, course["script"])
        
        # Serialize for frontend
        course["id"] = str(course["_id"])
        del course["_id"]
        return course
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/course/{course_id}/chat", response_model=ChatResponse)
async def chat_with_tutor(course_id: str, request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        db = get_db()
        course = await db.courses.find_one({"_id": ObjectId(course_id)})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
            
        reply = await ask_ai_tutor(course_id, request.message, course["script"])
        return ChatResponse(reply=reply)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
