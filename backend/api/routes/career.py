from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from api.deps import get_authenticated_user
from models.schemas import User, Job
from core.database import get_db
from services.resume_service import parse_resume_pdf
from services.llm_service import llm
from langchain_core.prompts import PromptTemplate
from bson import ObjectId
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ResumeUploadResponse(BaseModel):
    extracted_text: str

class ResumeJobRequest(BaseModel):
    resume_text: str
    job_id: str

class SkillGapResponse(BaseModel):
    match_percentage: int
    missing_skills: list[str]
    recommendations: str

class CoverLetterResponse(BaseModel):
    cover_letter: str
    status: str

# Hardcoded jobs for MVP demo
MOCK_JOBS = [
    {"_id": "job_1", "title": "Frontend Developer", "company": "TechCorp", "required_skills": ["React", "TypeScript", "Tailwind CSS"], "description": "Build modern UIs."},
    {"_id": "job_2", "title": "Backend Engineer", "company": "DataSys", "required_skills": ["Python", "FastAPI", "MongoDB", "Docker"], "description": "Develop scalable APIs."},
    {"_id": "job_3", "title": "Full Stack Dev", "company": "EduAI", "required_skills": ["React", "Python", "Machine Learning"], "description": "Work on AI-driven educational tools."}
]

@router.get("/jobs")
async def get_jobs(current_user: User = Depends(get_authenticated_user)):
    # In a real app, fetch from DB. For MVP, we return mock jobs
    return MOCK_JOBS

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
        job = next((j for j in MOCK_JOBS if str(j["_id"]) == request.job_id), None)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

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
        
        response = llm.invoke(prompt.format(resume=request.resume_text, skills=", ".join(job["required_skills"])))
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
        job = next((j for j in MOCK_JOBS if str(j["_id"]) == request.job_id), None)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        prompt = PromptTemplate(
            template="""Write a highly personalized, professional 3-paragraph cover letter for the following job using the applicant's resume details.
            
            Job Title: {title}
            Company: {company}
            Resume: {resume}
            """,
            input_variables=["title", "company", "resume"]
        )
        
        response = llm.invoke(prompt.format(title=job["title"], company=job["company"], resume=request.resume_text))
        
        return CoverLetterResponse(
            cover_letter=response.content.strip(),
            status="Application Sent Successfully!"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cover letter generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate cover letter")
