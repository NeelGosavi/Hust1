# backend/models/schemas.py

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)
        
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, _):
        field_schema.update(type="string")

class Slide(BaseModel):
    title: str
    content: str
    image_suggestion: str

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str

class CourseCreate(BaseModel):
    title: str
    description: str
    prompt: str

class Course(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    professor_id: str
    title: str
    description: str
    script: str
    slides: List[Slide]
    quiz: List[QuizQuestion]
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class CourseResponse(BaseModel):
    course_id: str
    qr_code: str
    title: str

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    clerk_id: str
    email: str
    role: str  # "professor" or "student"
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class Job(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str
    company: str
    required_skills: List[str]
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class Application(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    student_id: str
    job_id: str
    cover_letter: str
    status: str  # "pending", "accepted", "rejected"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )