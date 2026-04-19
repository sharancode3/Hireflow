# Hireflow

> Hiring workflows that feel polished for job seekers, recruiters, and admins.

Hireflow is a modern role-based hiring platform with structured application flows, recruiter approvals, analytics dashboards, and a resume builder designed for ATS-friendly presentation.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%2B_Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

## Live Demo

Try it now: https://hireflow-frontend-wvf2.vercel.app/login

Demo login details:

- Recruiter: `t.m.s10099@gmail.com`
- Job seeker: `sharans.cs24@bmsce.ac.in`
- Admin: `Sharan18x@gmail.com`
- Passwords are environment-seeded in Supabase and may vary by deployment.

## Preview

Add screenshots or a short GIF here for the strongest first impression:

| Landing page | Job seeker dashboard | Recruiter workspace |
| --- | --- | --- |
| `docs/screenshots/landing.png` | `docs/screenshots/job-seeker-dashboard.png` | `docs/screenshots/recruiter-dashboard.png` |

Recommended captures: landing page, job search/application flow, recruiter pipeline view, resume builder, and admin moderation screens.

## Features

- Role-aware experiences for job seekers, recruiters, and admins.
- Job browsing, saving, applying, and application status tracking.
- Recruiter workflows for posting jobs, reviewing applicants, and scheduling interviews.
- ATS-focused resume builder with export-friendly output and scoring guidance.
- Analytics and trend views that make hiring progress easy to understand at a glance.
- Guardrails for recruiter approval, admin access, and lifecycle integrity.
- Clean UI patterns built for fast scanning, not clutter.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Router.
- Backend: Node.js, Express, TypeScript.
- Database and auth: Supabase Auth and Postgres.
- Data visualization: Chart.js and react-chartjs-2.
- Document generation: jsPDF and html2canvas.
- Deployment: Vercel for the frontend, Render for the backend.

## How It Works

1. Users authenticate through Supabase and are routed by role.
2. Job seekers interact with role-specific job discovery, applications, and profile tools.
3. Recruiters manage jobs, shortlist candidates, and progress applicants through the pipeline.
4. Admins review recruiter access, monitor integrity, and support operational governance.
5. The backend handles protected operations, notifications, uploads, and third-party integrations.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project

### Install

```bash
npm install
```

### Configure Environment

Copy the example files and fill in your values:

- `.env.example`
- `backend/.env.example`
- `frontend/.env.example`

### Run Locally

```bash
npm run dev
```

On Windows, you can also use `start-windows.bat` for the guided two-window setup.

### Verify the Build

```bash
npm run check
```

## Environment Variables

Frontend `.env`

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://your-api.example.com
VITE_PUBLIC_APP_URL=https://your-app.example.com
VITE_ADMIN_EMAILS=Sharan18x@gmail.com
```

Backend `.env`

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JSEARCH_API_KEY=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
SERPAPI_KEY=
EXTERNAL_JOBS_SYNC_INTERVAL_MINUTES=60
EXTERNAL_JOBS_POSTED_WINDOW_DAYS=14
EXTERNAL_JOBS_SYNC_KEY=
EMAIL_MODE=log
EMAIL_FROM=no-reply@hireflow.local
ADMIN_EMAILS=admin@hireflow.local
```

Keep service-role and API keys secret. Only the public Supabase anon key belongs in the frontend.

## Roadmap

- Richer recruiter analytics with deeper funnel insights.
- Smarter matching and recommendation surfaces for jobs and candidates.
- Better notification UX for approvals, interviews, and status changes.
- More export and document options for resumes and candidate summaries.
- Continued hardening of role, approval, and audit flows.

## Contributing

Contributions are welcome.

1. Fork the repository and create a focused branch.
2. Make your changes with clear, scoped commits.
3. Run `npm run check` before opening a pull request.
4. Add screenshots or notes when the change affects the UI or workflow.

## License

No license has been declared in this repository yet.

If you plan to publish Hireflow as open source, add a LICENSE file before distributing it.

