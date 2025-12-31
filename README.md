# Talvion

Talvion — Where Talent Meets Vision.

Talvion is a modern hiring platform that connects job seekers and recruiters through intelligent profiles, automated resume generation, and streamlined hiring tools.

## Run Guide

## Easiest (Windows)
1. Install Node.js LTS (18 or 20)
2. Open this folder in VS Code
3. Double-click `start-windows.bat`

## Dev from repo root
- `npm install`
- `npm run dev`

It will:
- create `backend/.env` if missing
- install backend + frontend dependencies
- run Prisma migration (SQLite)
- start backend + frontend in two terminal windows

## Manual (if needed)
Backend:
- `cd backend`
- copy `.env.example` to `.env` (or create `.env`)
- `npm install`
- `npm run prisma:migrate`
- `npm run dev`

Frontend:
- `cd frontend`
- `npm install`
- `npm run dev`

## Branding asset
The UI expects the HireHub logo image at `frontend/public/hirehub-logo.png`.

If the file is missing, the app still runs, but the header logo and auth-page watermark will not render and the production build will warn about `/hirehub-logo.png` being resolved at runtime.

