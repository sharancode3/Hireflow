# Talvion

Talvion — Where Talent Meets Vision.

Talvion is a full‑stack hiring platform that connects job seekers and recruiters through role‑based dashboards, streamlined applications, hiring tools, and a built‑in resume builder.

![CI](https://github.com/sharancode3/Talvion/actions/workflows/ci.yml/badge.svg)

## What you can do

**Job Seeker**
- Browse jobs and view details
- Apply and track applications
- Build a resume and export/share it
- See notifications and updates

**Recruiter**
- Post and manage jobs
- Review applicants and shortlist candidates
- Track applications and hiring progress
- See notifications and overview stats

**Insights**
- View hiring trends / charts

## Resume intelligence (ATS-first)

Talvion’s resume builder is designed as a data product:

**Resume Builder = Data Engine + Intelligence Layer + Presentation Layer**

### Data intelligence highlights

- Uses profile + behavioral signals (searches, clicks, bookmarks, projects, courses)
- Computes a User Intent Score
- Personalizes tone, verbosity, and keyword density

```
UserIntentScore =
	(skill_match * 0.4) +
	(job_clicks * 0.3) +
	(search_keywords * 0.2) +
	(profile_completeness * 0.1)
```

### ATS optimization

- Single-column templates (no tables, icons, or images)
- Semantic headings and clean sectioning
- Keyword extraction + gap analysis

### Recruiter-grade output

- Bullet improvement suggestions (STAR/XYZ guidance)
- Role-based action verb library
- ATS score, readability, and red-flag checks

### Templates

- ATS Optimized (Plain)
- Tech-Focused
- Executive
- Startup / Product
- Academic

Templates are JSON-driven and style-separated from content.

### Fonts (ATS approved)

Recommended stack:

```
font-family: "Inter", "Source Sans 3", "Roboto", system-ui, sans-serif;
```

### Security & compliance

- Resumes are not publicly indexed
- Optional PDF watermarking (future extension)
- GDPR-style delete option (future extension)
- Encryption at rest (backend roadmap)

### Master prompt (production-ready)

```
You are an expert resume writer, ATS optimization specialist, and senior technical recruiter.

Generate a highly professional, ATS-friendly resume using the following user data.

Rules:
- Use a single-column structure
- No tables, icons, or graphics
- Use strong action verbs
- Optimize for Applicant Tracking Systems
- Tailor content for the target role
- Use measurable impact wherever possible
- Maintain natural human language (no AI tone)
- Prioritize relevance over length
- Keep resume to 1 page unless experience > 10 years

User Data:
{{USER_PROFILE_JSON}}

Target Role:
{{JOB_TITLE}}

Job Description:
{{JOB_DESCRIPTION}}

Experience Level:
{{FRESHER | MID | SENIOR}}

Resume Style:
{{ATS_PLAIN | TECH_FOCUSED | EXECUTIVE | STARTUP}}

Font:
Inter

Output Format:
- Plain structured text (no markdown)
- Section order:
	Header
	Professional Summary
	Skills
	Experience
	Projects
	Education
	Certifications (if applicable)

Additionally:
- Improve weak bullet points
- Inject missing keywords naturally
- Avoid repetition
- Ensure recruiter readability within 6 seconds
```

## Tech stack

- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** Prisma ORM + SQLite (local dev)

## Quick start (Windows)

1. Install **Node.js LTS (18 or 20)**
2. Open this folder in **VS Code**
3. Double‑click `start-windows.bat`

The starter script will:
- create `backend/.env` if missing
- install backend + frontend dependencies
- run Prisma migrations (SQLite)
- start backend + frontend in two terminal windows

Frontend usually runs at: `http://localhost:5173`

## Run in dev (manual)

### Backend

```bash
cd backend
npm install
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Useful scripts (repo root)

- `npm run dev` — start backend + frontend together
- `npm run typecheck` — TypeScript checks (backend + frontend)
- `npm run lint` — ESLint (frontend)
- `npm run build` — production build (backend + frontend)
- `npm run check` — typecheck + lint + build (used by CI)

## Configuration

The backend uses `backend/.env`.

Default values created by the Windows starter:
- `DATABASE_URL="file:./dev.db"`
- `JWT_SECRET="..."` (change this for anything beyond local dev)
- `CORS_ORIGIN="http://localhost:5173"`

## Branding asset

The UI expects a logo at `frontend/public/hirehub-logo.png`.

If it’s missing, the app still runs, but the header logo and auth-page watermark won’t render and the production build will warn about `/hirehub-logo.png` being resolved at runtime.

