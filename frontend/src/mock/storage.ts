import { createSeedDb } from "./seed";
import type { MockDb } from "./types";

const DB_KEY = "hireflow_mock_db_v1";
const LEGACY_DB_KEY_2 = "talvion_mock_db_v1";
const LEGACY_DB_KEY = "hirehub_mock_db_v1";

function normalizeDb(db: any): MockDb {
  const seeded = createSeedDb();
  const out: any = { ...seeded, ...db };

  out.users = Array.isArray(out.users) ? out.users : seeded.users;
    out.users = out.users.map((u: any) => ({
      ...u,
      recruiterApprovalStatus:
        u.role === "RECRUITER"
          ? (u.recruiterApprovalStatus ?? "APPROVED")
          : undefined,
    }));

  out.recruiters = Array.isArray(out.recruiters) ? out.recruiters : seeded.recruiters;
  out.jobSeekers = Array.isArray(out.jobSeekers) ? out.jobSeekers : seeded.jobSeekers;
  out.jobs = Array.isArray(out.jobs) ? out.jobs : seeded.jobs;
  out.applications = Array.isArray(out.applications) ? out.applications : seeded.applications;
  out.savedJobs = Array.isArray(out.savedJobs) ? out.savedJobs : seeded.savedJobs;
  out.resumes = Array.isArray(out.resumes) ? out.resumes : seeded.resumes;
  out.generatedResumes = Array.isArray(out.generatedResumes) ? out.generatedResumes : seeded.generatedResumes;
  out.notifications = Array.isArray(out.notifications) ? out.notifications : seeded.notifications;
  out.trends = out.trends ?? seeded.trends;

  // Ensure new fields exist
  out.jobs = out.jobs.map((j: any) => ({
    jobType: "FULL_TIME",
    minExperienceYears: 0,
    ...j,
  }));

  out.jobSeekers = out.jobSeekers.map((p: any) => ({
    photoDataUrl: null,
    headline: null,
    about: null,
    interests: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
    activeGeneratedResumeId: null,
    skillLevels: {},
    ...p,
  }));

  return out as MockDb;
}

export function loadDb(): MockDb {
  let raw = localStorage.getItem(DB_KEY);
  if (!raw) raw = localStorage.getItem(LEGACY_DB_KEY_2);
  if (!raw) raw = localStorage.getItem(LEGACY_DB_KEY);
  if (!raw) return createSeedDb();
  try {
    const parsed = normalizeDb(JSON.parse(raw));
    // Persist under new key if we loaded legacy
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify(parsed));
      localStorage.removeItem(LEGACY_DB_KEY_2);
      localStorage.removeItem(LEGACY_DB_KEY);
    }
    return parsed;
  } catch {
    return createSeedDb();
  }
}

export function saveDb(db: MockDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function initMockDb() {
  const existing = localStorage.getItem(DB_KEY) ?? localStorage.getItem(LEGACY_DB_KEY_2) ?? localStorage.getItem(LEGACY_DB_KEY);
  if (existing) return;
  const db = createSeedDb();
  saveDb(db);
}

export function resetMockDb() {
  localStorage.removeItem(DB_KEY);
  initMockDb();
}
