"""Seed the jobs collection with a starter set of listings.

Run from the backend/ directory:  python seed_jobs.py

Idempotent: upserts on (title, company) so re-running won't create duplicates.
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

STARTER_JOBS = [
    {"title": "Frontend Developer", "company": "TechCorp",
     "required_skills": ["React", "TypeScript", "Tailwind CSS"],
     "description": "Build modern, responsive user interfaces."},
    {"title": "Backend Engineer", "company": "DataSys",
     "required_skills": ["Python", "FastAPI", "MongoDB", "Docker"],
     "description": "Develop scalable, reliable APIs and services."},
    {"title": "Full Stack Developer", "company": "EduAI",
     "required_skills": ["React", "Python", "Machine Learning"],
     "description": "Work on AI-driven educational tools across the stack."},
]


async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    inserted, existed = 0, 0
    for job in STARTER_JOBS:
        job.setdefault("created_by", "seed")
        job.setdefault("created_at", datetime.utcnow())
        result = await db.jobs.update_one(
            {"title": job["title"], "company": job["company"]},
            {"$setOnInsert": job},
            upsert=True,
        )
        if result.upserted_id is not None:
            inserted += 1
        else:
            existed += 1
    print(f"Seed complete: {inserted} inserted, {existed} already existed.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
