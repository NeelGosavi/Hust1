# Deployment Guide

**Stack:** Frontend → Vercel · Backend → Railway · Database → MongoDB Atlas (already hosted).

---

## Backend — Railway

### 1. Prep (one-time)
- **MongoDB Atlas** → Network Access → add `0.0.0.0/0` (allow from anywhere), so Railway can connect.
- Have these values ready: `MONGODB_URL`, `NARA_API_KEY`, `CLERK_SECRET_KEY`.

### 2. Create the service
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project → Deploy from GitHub repo →** select `NeelGosavi/Hust1`.
3. Open the service → **Settings → Root Directory** → set to `backend`.
   (Railway then builds only the backend; the `Procfile` provides the start command.)

### 3. Environment variables
In the service → **Variables**, add:

| Variable | Value |
|---|---|
| `MONGODB_URL` | your Atlas connection string |
| `NARA_API_KEY` | your NaraRouter key (`sk-nry-...`) |
| `NARA_BASE_URL` | `https://router.bynara.id/v1` |
| `NARA_MODEL` | `claude-haiku-4.5` |
| `CLERK_SECRET_KEY` | your Clerk secret (`sk_test_...` or live) |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | your Vercel URL (set after the frontend deploy) |
| `EXTRA_CORS_ORIGINS` | *(optional)* extra origins, comma-separated |

> `FRONTEND_URL` is added to the CORS allow-list automatically, so the deployed
> frontend can call the API. You can set it once the frontend URL exists and redeploy.

### 4. Get the public URL
- Service → **Settings → Networking → Generate Domain**.
- You'll get something like `https://hust1-backend-production.up.railway.app`.
- Test it: open `https://<that-domain>/health` → should return `{"status":"healthy",...}`.
- API docs are at `https://<that-domain>/docs`.

### 5. Seed data (optional, one-time)
From the Railway service shell (or locally with prod `MONGODB_URL`):
```
python seed_jobs.py
python seed_practice.py
python seed_mustdo.py
```

---

## Frontend — Vercel (next)

1. [vercel.com](https://vercel.com) → **New Project** → import `NeelGosavi/Hust1`.
2. **Root Directory** → `frontend`. Framework preset: **Vite**.
3. **Environment Variables:**
   - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key (`pk_...`)
   - `VITE_API_BASE_URL` = `https://<railway-backend-domain>/api`  ← note the `/api`
4. Deploy. Then copy the Vercel URL back into Railway's `FRONTEND_URL` and redeploy the backend (for CORS).

---

## Post-deploy checklist
- [ ] Atlas allows `0.0.0.0/0`
- [ ] Backend `/health` returns healthy
- [ ] `FRONTEND_URL` on Railway = the Vercel URL (CORS)
- [ ] `VITE_API_BASE_URL` on Vercel = `https://<backend>/api`
- [ ] Clerk dashboard → add the production frontend domain
- [ ] **Rotate the leaked credentials** (Mongo password, Clerk secret) before going live
