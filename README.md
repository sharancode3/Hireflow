# Hireflow

Hireflow is a role-based hiring platform for job seekers and recruiters with mock-first workflows, analytics dashboards, and an ATS-focused resume builder.

## Tech Stack

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.1-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2.1-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.19.1-2D3748?logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)

## Live Deployment

- Frontend (GitHub Pages): https://sharancode3.github.io/Hireflow/

## Demo Credentials

- Job seeker: `seeker1@hireflow.demo` / `Password123!`
- Recruiter: `recruiter1@hireflow.demo` / `Password123!`

## Major Features

- Role-separated auth and dashboards (Job Seeker / Recruiter)
- Job browsing, applying, saved jobs, and application pipeline tracking
- Recruiter posting, applicant review, interviews, and analytics
- Talent trends visualizations and command palette (`Ctrl+K`)
- Resume Builder with multiple templates and ATS scoring
- Interview Prep and Skill Gap analysis modules

## Run Locally

### Quick Start (Windows)

1. Install Node.js LTS
2. Open the repo in VS Code
3. Run `start-windows.bat`

### Manual Start

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Scripts (Root)

- `npm run dev` — start frontend + backend concurrently
- `npm run typecheck` — type-check frontend + backend
- `npm run lint` — lint frontend
- `npm run build` — production build frontend + backend
- `npm run check` — typecheck + lint + build

## Environment Setup

Use the included examples:

- `.env.example`
- `frontend/.env.example`

Copy them to actual `.env` files and fill values for your environment.

## Supabase Migration Readiness

Backend is prepared for Supabase client wiring.

Required backend environment variables:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Current migration mode keeps core server middleware/health active while DB-backed APIs are being ported.

