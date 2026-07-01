from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Literal
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
    matched_skills: List[str] = []
    missing_skills: List[str]
    recommendations: str


class CoverLetterResponse(BaseModel):
    cover_letter: str
    status: str
    application_id: str


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    job_title: str
    company: str
    status: str
    created_at: Optional[str] = None
    cover_letter: str


class ApplicantResponse(BaseModel):
    application_id: str
    student_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    status: str
    created_at: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: Literal["pending", "accepted", "rejected"]


# ---------- Helpers ----------

def _require_hiring(user: User) -> None:
    if user.role != "hiring":
        raise HTTPException(status_code=403, detail="Only recruiters (hiring role) can manage jobs")


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
    """Add a job listing (recruiters / hiring role only)."""
    _require_hiring(current_user)
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
    """Delete a job listing (recruiters / hiring role only)."""
    _require_hiring(current_user)
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
    filename = (file.filename or "").lower()
    if not (filename.endswith(".pdf") or file.content_type == "application/pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")
    try:
        content = await file.read()
        extracted_text = parse_resume_pdf(content)
        return ResumeUploadResponse(extracted_text=extracted_text)
    except ValueError as e:
        # Unreadable / scanned / empty PDF — a client problem, not a server error.
        raise HTTPException(status_code=400, detail=str(e))
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
            "matched_skills" (list of the required skills the resume DOES have),
            "missing_skills" (list of the required skills the resume is missing),
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

        return SkillGapResponse(
            match_percentage=int(analysis.get("match_percentage", 0)),
            matched_skills=analysis.get("matched_skills", []),
            missing_skills=analysis.get("missing_skills", []),
            recommendations=analysis.get("recommendations", ""),
        )

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
        cover_letter = response.content.strip()

        # Persist the application (one per student+job; re-applying updates it).
        now = datetime.utcnow()
        await db.applications.update_one(
            {"student_id": current_user.clerk_id, "job_id": request.job_id},
            {
                "$set": {"cover_letter": cover_letter, "updated_at": now},
                "$setOnInsert": {
                    "student_id": current_user.clerk_id,
                    "job_id": request.job_id,
                    "status": "pending",
                    "created_at": now,
                },
            },
            upsert=True,
        )
        application = await db.applications.find_one(
            {"student_id": current_user.clerk_id, "job_id": request.job_id}
        )

        return CoverLetterResponse(
            cover_letter=cover_letter,
            status="Application Sent Successfully!",
            application_id=str(application["_id"]),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cover letter generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate cover letter")


# ---------- Applications ----------

@router.get("/applications", response_model=List[ApplicationResponse])
async def my_applications(current_user: User = Depends(get_authenticated_user)):
    """The current student's job applications, joined with job info."""
    try:
        db = get_db()
        apps = await db.applications.find(
            {"student_id": current_user.clerk_id}
        ).sort("created_at", -1).to_list(length=200)
        if not apps:
            return []

        job_oids = [ObjectId(a["job_id"]) for a in apps if ObjectId.is_valid(a["job_id"])]
        jobs = await db.jobs.find({"_id": {"$in": job_oids}}).to_list(length=len(job_oids))
        jobs_by_id = {str(j["_id"]): j for j in jobs}

        out = []
        for a in apps:
            job = jobs_by_id.get(a["job_id"], {})
            out.append(ApplicationResponse(
                id=str(a["_id"]),
                job_id=a["job_id"],
                job_title=job.get("title", "(removed job)"),
                company=job.get("company", ""),
                status=a.get("status", "pending"),
                created_at=a.get("created_at").isoformat() if a.get("created_at") else None,
                cover_letter=a.get("cover_letter", ""),
            ))
        return out
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching applications: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch applications")


@router.get("/jobs/{job_id}/applicants", response_model=List[ApplicantResponse])
async def job_applicants(job_id: str, current_user: User = Depends(get_authenticated_user)):
    """Applicants for a job (professors only), joined with student info."""
    _require_hiring(current_user)
    try:
        db = get_db()
        await _get_job_or_404(db, job_id)

        apps = await db.applications.find(
            {"job_id": job_id}
        ).sort("created_at", -1).to_list(length=500)
        if not apps:
            return []

        student_ids = list({a["student_id"] for a in apps})
        users = await db.users.find(
            {"clerk_id": {"$in": student_ids}}
        ).to_list(length=len(student_ids))
        users_by_id = {u["clerk_id"]: u for u in users}

        return [
            ApplicantResponse(
                application_id=str(a["_id"]),
                student_id=a["student_id"],
                student_name=users_by_id.get(a["student_id"], {}).get("name"),
                student_email=users_by_id.get(a["student_id"], {}).get("email"),
                status=a.get("status", "pending"),
                created_at=a.get("created_at").isoformat() if a.get("created_at") else None,
            )
            for a in apps
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching applicants for {job_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch applicants")


@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    body: ApplicationStatusUpdate,
    current_user: User = Depends(get_authenticated_user),
):
    """Accept/reject an application (professors only)."""
    _require_hiring(current_user)
    if not ObjectId.is_valid(application_id):
        raise HTTPException(status_code=400, detail="Invalid application ID format")
    try:
        db = get_db()
        result = await db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {"status": body.status, "updated_at": datetime.utcnow()}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        return {"application_id": application_id, "status": body.status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating application {application_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update application")
