# EduAI — AI-Powered Education & Job-Prep Platform

An MVP full-stack platform that uses Google Gemini to help **professors** create
courses, **students** learn with an AI tutor, and students prepare for jobs.

> Status: early MVP. Core flows work; several features are still stubbed (see
> [Status & Known Gaps](#status--known-gaps)). The career/job-prep area is the
> main area of active expansion (see [Roadmap](#roadmap)).

---

## What it does

The platform has three flows:

### 1. Professor — AI course generation
A professor enters a topic/prompt and Gemini generates a complete course:
a lecture script, 8–10 slides (each with an image suggestion), and a
5-question multiple-choice quiz. Each course gets a **QR code** students can
scan to join.

### 2. Student — interactive learning + RAG AI tutor
Students open a course (via QR/link) and get the slides, the quiz, and an
**AI tutor chatbot**. The tutor uses **RAG** (retrieval-augmented generation):
the course script is embedded into a FAISS vector store, and the tutor answers
questions grounded in *that course's* material.

### 3. Student — job & interview prep
Tools to get students placement-ready. Today: résumé upload, AI skill-gap
analysis against a job, and AI-generated cover letters. Planned: a much larger
prep hub — see [Roadmap](#roadmap).

---

## Tech stack

| Layer        | Technology |
|--------------|------------|
| **Backend**  | FastAPI (Python 3.12), MongoDB Atlas (Motor async driver) |
| **AI**       | Gemini 2.0 Flash (chat + course gen) and `text-embedding-004` (RAG), via LangChain + FAISS |
| **Auth**     | Clerk (frontend + backend verification) |
| **Frontend** | React 19 + TypeScript + Vite, Tailwind CSS |
| **Other**    | QR code generation, Google Cloud Document AI (résumé parsing — stubbed) |

---

## Project structure

```
Hust1/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, lifespan, health/root
│   ├── core/
│   │   ├── config.py           # Settings loaded from .env
│   │   └── database.py         # MongoDB connection + indexes
│   ├── api/
│   │   ├── deps.py             # Clerk auth dependency (get_authenticated_user)
│   │   └── routes/
│   │       ├── professor.py    # Course CRUD + AI generation + QR
│   │       ├── student.py      # Course view + RAG tutor chat
│   │       └── career.py       # Résumé / skill-gap / cover letter
│   ├── services/
│   │   ├── llm_service.py      # Gemini course-content generation
│   │   ├── rag_service.py      # FAISS vector store + AI tutor
│   │   ├── qr_service.py       # QR code generation
│   │   └── resume_service.py   # Résumé parsing (stubbed)
│   ├── models/schemas.py       # Pydantic models
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.tsx             # Routes, navbar, landing page
    │   ├── api/client.ts       # Axios client + Clerk token interceptor
    │   └── pages/              # Professor + Student pages
    ├── package.json
    └── .env.example
```

---

## Getting started

### Prerequisites
- Python 3.12+
- Node.js 20+
- A MongoDB Atlas connection string
- A Google Gemini API key
- A Clerk application (publishable + secret keys)

### Backend
```bash
cd backend
python -m venv venv
# Windows:
./venv/Scripts/activate
# macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then fill in real values
python -m uvicorn main:app --reload
```
Backend runs at http://localhost:8000 (docs at `/docs`).

### Frontend
```bash
cd frontend
npm install
cp .env.example .env          # then fill in real values
npm run dev
```
Frontend runs at http://localhost:5173.

---

## Environment variables

**`backend/.env`** (see `backend/.env.example`)

| Var | Description |
|-----|-------------|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CLERK_SECRET_KEY` | Clerk backend secret key (server-side only) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service-account JSON (for résumé parsing) |

**`frontend/.env`** (see `frontend/.env.example`)

| Var | Description |
|-----|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (safe in the browser) |
| `VITE_API_BASE_URL` | Backend base URL, e.g. `http://localhost:8000` |

> `.env` files are gitignored. **Never commit real secrets.**

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health + DB status |
| GET | `/api/professor/courses` | List the professor's courses |
| POST | `/api/professor/create-course` | Generate + save a new course |
| GET | `/api/professor/courses/{id}` | Course details |
| GET | `/api/professor/courses/{id}/qr` | Course QR code |
| DELETE | `/api/professor/courses/{id}` | Delete a course |
| GET | `/api/student/course/{id}` | Get a course (initializes RAG) |
| POST | `/api/student/course/{id}/chat` | Ask the AI tutor |
| GET | `/api/career/jobs` | List jobs (currently mock data) |
| POST | `/api/career/upload-resume` | Upload + parse a résumé |
| POST | `/api/career/analyze-skills` | Skill-gap analysis vs. a job |
| POST | `/api/career/apply` | Generate a cover letter |

All `/api/*` routes require Clerk authentication (unless `USE_TEST_AUTH=true`).

---

## Status & known gaps

**Working:** professor course generation, student course view, RAG tutor,
QR codes, Clerk auth, MongoDB persistence.

**Stubbed / incomplete:**
- Résumé parsing returns hardcoded text (Document AI not wired up).
- Quiz has no submission/grading on the student side.
- Job listings are hardcoded (`MOCK_JOBS`), not from the database.

**Security to-do:**
- Credentials were committed in the first commit and pushed publicly —
  **rotate the MongoDB password, Gemini key, Clerk secret, and GCP key.**

---

## Roadmap

The **job-prep hub** is the main direction of growth. Planned features:

- [ ] **DSA / LeetCode practice** — a curated list of coding problems
      (title, difficulty, topic, link) with per-student progress tracking
      (solved / attempted / todo).
- [ ] **System design prep** — design questions and study material.
- [ ] **Interview prep** — broader job-readiness content tying the above together.
- [ ] **Real job listings** — move jobs from `MOCK_JOBS` into the database.
- [ ] **Quiz grading** — score submissions and store results.
- [ ] **Real résumé parsing** — finish the Document AI integration.

Goal: evolve from "AI course platform + light career tool" into a full
**student upskilling + placement-prep platform**.
