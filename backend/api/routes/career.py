from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from api.deps import get_authenticated_user
from models.schemas import User
from core.database import get_db
from services.resume_service import parse_resume_pdf
from services.llm_service import llm
from langchain_core.prompts import PromptTemplate
from bson import ObjectId
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------- Models ----------

class JobCreate(BaseModel):
    title: str
    company: str
    required_skills: List[str] = []
    description: str = ""


class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    required_skills: List[str]
    description: str
    created_at: Optional[str] = None


class ResumeUploadResponse(BaseModel):
    extracted_text: str


class ResumeJobRequest(BaseModel):
    resume_text: str
    job_id: str


class SkillGapResponse(BaseModel):
    match_percentage: int
    missing_skills: List[str]
    recommendations: str


class CoverLetterResponse(BaseModel):
    cover_letter: str
    status: str


# ---------- Helpers ----------

def _require_professor(user: User) -> None:
    if user.role != "professor":
        raise HTTPException(status_code=403, detail="Only professors can manage jobs")


async def _get_job_or_404(db, job_id: str) -> dict:
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _to_response(job: dict) -> JobResponse:
    return JobResponse(
        id=str(job["_id"]),
        title=job.get("title", ""),
        company=job.get("company", ""),
        required_skills=job.get("required_skills", []),
        description=job.get("description", ""),
        created_at=job.get("created_at").isoformat() if job.get("created_at") else None,
    )


# ---------- Jobs (DB-backed) ----------

@router.get("/jobs", response_model=List[JobResponse])
async def get_jobs(current_user: User = Depends(get_authenticated_user)):
    try:
        db = get_db()
        jobs = await db.jobs.find().sort("created_at", -1).to_list(length=200)
        return [_to_response(j) for j in jobs]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching jobs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, current_user: User = Depends(get_authenticated_user)):
    try:
        db = get_db()
        job = await _get_job_or_404(db, job_id)
        return _to_response(job)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch job")


@router.post("/jobs", response_model=JobResponse, status_code=201)
async def create_job(body: JobCreate, current_user: User = Depends(get_authenticated_user)):
    """Add a job listing (professors only)."""
    _require_professor(current_user)
    try:
        db = get_db()
        doc = {
            "title": body.title,
            "company": body.company,
            "required_skills": body.required_skills,
            "description": body.description,
            "created_by": current_user.clerk_id,
            "created_at": datetime.utcnow(),
        }
        result = await db.jobs.insert_one(doc)
        doc["_id"] = result.inserted_id
        return _to_response(doc)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create job")


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: User = Depends(get_authenticated_user)):
    """Delete a job listing (professors only)."""
    _require_professor(current_user)
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    try:
        db = get_db()
        result = await db.jobs.delete_one({"_id": ObjectId(job_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Job not found")
        return {"message": "Job deleted", "job_id": job_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job {job_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete job")


# ---------- Résumé tools ----------

@router.post("/upload-resume", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...), current_user: User = Depends(get_authenticated_user)):
    try:
        content = await file.read()
        extracted_text = parse_resume_pdf(content)
        return ResumeUploadResponse(extracted_text=extracted_text)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to parse resume")


@router.post("/analyze-skills", response_model=SkillGapResponse)
async def analyze_skills(
    request: ResumeJobRequest,
    current_user: User = Depends(get_authenticated_user)
):
    try:
        db = get_db()
        job = await _get_job_or_404(db, request.job_id)

        prompt = PromptTemplate(
            template="""You are a career advisor. Analyze this resume against the job requirements.
            Resume: {resume}
            Job Required Skills: {skills}

            Provide a JSON output ONLY with exactly these keys:
            "match_percentage" (integer 0-100),
            "missing_skills" (list of strings),
            "recommendations" (short paragraph).
            No markdown blocks, just the JSON.
            """,
            input_variables=["resume", "skills"]
        )

        response = llm.invoke(prompt.format(
            resume=request.resume_text,
            skills=", ".join(job.get("required_skills", [])),
        ))
        raw = response.content.replace('```json', '').replace('```', '').strip()
        analysis = json.loads(raw)

        return SkillGapResponse(**analysis)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Skill analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze skills")


@router.post("/apply", response_model=CoverLetterResponse)
async def one_click_apply(
    request: ResumeJobRequest,
    current_user: User = Depends(get_authenticated_user)
):
    try:
        db = get_db()
        job = await _get_job_or_404(db, request.job_id)

        prompt = PromptTemplate(
            template="""Write a highly personalized, professional 3-paragraph cover letter for the following job using the applicant's resume details.

            Job Title: {title}
            Company: {company}
            Resume: {resume}
            """,
            input_variables=["title", "company", "resume"]
        )

        response = llm.invoke(prompt.format(
            title=job.get("title", ""),
            company=job.get("company", ""),
            resume=request.resume_text,
        ))

        return CoverLetterResponse(
            cover_letter=response.content.strip(),
            status="Application Sent Successfully!"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cover letter generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate cover letter")
