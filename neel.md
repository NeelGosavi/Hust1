# Hey Neel — Frontend Handoff

The backend is feature-complete and pushed to `main`. This is everything you need
to get running and wire up the UI. Full request/response shapes are in
[`README.md`](README.md), and once the backend is running the live API docs are at
**http://localhost:8000/docs** (easiest reference).

---

## 1. Sync the repo

- **If you have NOT pulled recently:** `git pull origin main`
- **If you HAD already pulled earlier** (history was rewritten to clean up a commit),
  a plain pull will conflict. Instead:
  ```bash
  git fetch origin
  git reset --hard origin/main   # discards your local copy of those commits
  ```
  ⚠️ Stash/commit any local work you care about first.

## 2. Run the frontend

```bash
cd frontend
cp .env.example .env     # then fill in the values below
npm install              # node_modules is gitignored now — required
npm run dev              # http://localhost:5173
```

`frontend/.env`:
- `VITE_CLERK_PUBLISHABLE_KEY` — the `pk_test_...` key (same Clerk app as Prashant)
- `VITE_API_BASE_URL=http://localhost:8000`

## 3. Run the backend to test against

Either Prashant runs it, or you run it locally:

```bash
cd backend
python -m venv venv && ./venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env      # needs the real keys from Prashant
python -m uvicorn main:app --reload
python seed_jobs.py       # optional demo data
python seed_practice.py   # optional demo data
```

---

## 4. Things that changed — read before integrating

- **Env var renamed:** the API client reads `VITE_API_BASE_URL` (was `VITE_API_URL`).
- **Auth is already wired:** every `/api/*` call needs a Clerk `Bearer` token; this is
  handled by `setupInterceptors` in `src/api/client.ts`. Nothing extra to do per call.
- **Job IDs are now Mongo ObjectIds** (e.g. `"507f1f77…"`), not `"job_1"`. Always send
  the real `id` from `GET /api/career/jobs` to `analyze-skills` / `apply`.
- **Course view** now returns the old keys **plus** `professor_name`, `is_enrolled`,
  `progress`. The tutor `chat` response also now includes `conversation_id`. Existing
  pages keep working unchanged.
- **Professor-only endpoints** (create/delete jobs & practice problems, manage
  applicants) return **403** unless the user's role is `professor`. New users default to
  `student` and there's no role-switch UI yet — so for now use the seed scripts or the
  test-auth user to populate data.

---

## 5. New endpoints ready for UI

**Student**
- `GET  /api/student/dashboard/stats` — totals, completed, avg progress, recent courses
- `GET  /api/student/courses?search=&limit=` — browse/search published courses
- `GET  /api/student/my-courses` — enrolled courses
- `POST /api/student/enroll/{id}` — enroll
- `GET  /api/student/course/{id}` — course view (auto-enrolls on open)
- `POST /api/student/course/{id}/chat` — ask the AI tutor → `{ reply, conversation_id }`
- `GET  /api/student/course/{id}/chat` — saved tutor conversation
- `POST /api/student/course/{id}/quiz/submit` — `{ answers: [str] }` → score + per-question correctness

**Practice hub (DSA / system design / interview)**
- `GET  /api/practice/problems?category=&difficulty=&topic=&search=&limit=`
- `GET  /api/practice/problems/{id}`
- `PUT  /api/practice/problems/{id}/progress` — `{ status: "todo"|"attempted"|"solved" }`
- `GET  /api/practice/stats`
- `POST /api/practice/problems`, `DELETE /api/practice/problems/{id}` — professors only

**Career / jobs**
- `GET  /api/career/jobs`, `GET /api/career/jobs/{id}`
- `POST /api/career/upload-resume` — multipart PDF → extracted text (400 if not a readable PDF)
- `POST /api/career/analyze-skills` — `{ resume_text, job_id }` → match %, missing skills
- `POST /api/career/apply` — `{ resume_text, job_id }` → `{ cover_letter, status, application_id }`
- `GET  /api/career/applications` — the student's applications
- `GET  /api/career/jobs/{id}/applicants` — professors only
- `PUT  /api/career/applications/{id}/status` — `{ status }` — professors only
- `POST /api/career/jobs`, `DELETE /api/career/jobs/{id}` — professors only

**Professor (existing)**
- `GET /api/professor/courses`, `POST /api/professor/create-course`,
  `GET /api/professor/courses/{id}`, `GET /api/professor/courses/{id}/qr`,
  `DELETE /api/professor/courses/{id}`

---

Ping Prashant if any endpoint behaves unexpectedly. Happy building 🚀
