# Hireflow

> Hiring workflows for job seekers, recruiters, and admins.

Hireflow is a role-based hiring platform with recruiter approvals, application tracking, analytics, and an ATS-focused resume builder.

Live demo: https://hireflow-frontend-wvf2.vercel.app/login

Demo login:

- Recruiter: `t.m.s10099@gmail.com` / `Password123!`
- Job seeker: `sharans.cs24@bmsce.ac.in` / `Password123!`
- Admin: `Sharan18x@gmail.com` / `Password123!`

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%2B_Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

## What It Does

- Helps job seekers search roles, apply quickly, and track progress.
- Gives recruiters a clean workflow for posting jobs, reviewing applicants, and moving candidates forward.
- Gives admins a control layer for approvals, access, and operational oversight.
- Includes a resume builder and analytics views so the hiring process stays organized end to end.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Router.
- Backend: Node.js, Express, TypeScript.
- Database and auth: Supabase Auth and Postgres.
- Visualization: Chart.js and react-chartjs-2.
- Documents: jsPDF and html2canvas.
- Deployment: Vercel frontend, Render backend.

## How It Works

1. Users sign in through Supabase and are routed by role.
2. Job seekers browse roles, save jobs, and submit applications.
3. Recruiters post jobs, review candidates, and manage interview flow.
4. Admins oversee approvals and platform integrity.
5. The backend handles protected operations, uploads, notifications, and external job sync.

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

- Deeper recruiter analytics and funnel reporting.
- Stronger matching and recommendation signals.
- Better notification and interview flow visibility.
- More export options for resumes and candidate summaries.

## Contributing

Contributions are welcome.

1. Fork the repository and create a focused branch.
2. Make your change with a narrow scope.
3. Run `npm run check` before opening a pull request.
4. Include notes when the update affects UI or workflow.

## License

No license has been declared in this repository yet.

