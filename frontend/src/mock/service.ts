import type {
  Application,
  ApplicationStatus,
  GeneratedResume,
  Job,
  JobSeeker,
  MockDb,
  MockUser,
  Notification,
  Recruiter,
  Resume,
  ResumeSnapshot,
  ResumeSettings,
  ResumeTemplate,
  Trends,
  UserRole,
} from "./types";
import { loadDb, saveDb } from "./storage";

function nowIso() {
  return new Date().toISOString();
}

function tokenFor(userId: string) {
  return `mock.${userId}`;
}

function userIdFromToken(token: string) {
  if (!token.startsWith("mock.")) return null;
  return token.slice("mock.".length);
}

function emailVariants(rawEmail: string): string[] {
  const lower = rawEmail.trim().toLowerCase();
  const variants = new Set<string>([lower]);

  if (lower.endsWith("@hirehub.demo")) {
    variants.add(lower.replace("@hirehub.demo", "@talvion.demo"));
  }

  if (lower.endsWith("@talvion.demo")) {
    variants.add(lower.replace("@talvion.demo", "@hirehub.demo"));
  }

  return Array.from(variants);
}

function assertUser(token: string | null | undefined, db: MockDb): MockUser {
  if (!token) throw new Error("Unauthorized");
  const userId = userIdFromToken(token);
  if (!userId) throw new Error("Unauthorized");
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error("Unauthorized");
  return user;
}

function createNotification(db: MockDb, n: Omit<Notification, "id" | "createdAt" | "isRead">) {
  db.notifications.unshift({
    id: `ntf_${(db.notifications.length + 1).toString().padStart(4, "0")}`,
    createdAt: nowIso(),
    isRead: false,
    ...n,
  });
}

function latestResumeForUser(db: MockDb, userId: string): Pick<Resume, "id" | "originalName"> | null {
  const resumes = db.resumes
    .filter((r) => r.userId === userId)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const latest = resumes[0];
  return latest ? { id: latest.id, originalName: latest.originalName } : null;
}

function listGeneratedResumesForUser(db: MockDb, userId: string): GeneratedResume[] {
  return db.generatedResumes
    .filter((r) => r.userId === userId)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export type LoginResponse = { token: string; user: { id: string; email: string; role: UserRole } };

export const mockApi = {
  auth: {
    login(email: string, password: string, role: UserRole): LoginResponse {
      const db = loadDb();
      const candidates = emailVariants(email);
      const user = db.users.find((u) => candidates.includes(u.email.toLowerCase()));
      if (!user || user.password !== password) throw new Error("Invalid credentials");
      if (user.role !== role) throw new Error("Selected role does not match this account");
      return { token: tokenFor(user.id), user: { id: user.id, email: user.email, role: user.role } };
    },

    register(payload: {
      email: string;
      password: string;
      role: UserRole;
      jobSeeker?: { fullName: string };
      recruiter?: { companyName: string };
    }): LoginResponse {
      const db = loadDb();
      const exists = db.users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase());
      if (exists) throw new Error("Email already registered");

      const id = `usr_new_${Date.now().toString(16)}`;
      const user: MockUser = {
        id,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        createdAt: nowIso(),
      };
      db.users.push(user);

      if (payload.role === "JOB_SEEKER") {
        if (!payload.jobSeeker) throw new Error("Job seeker details required");
        db.jobSeekers.push({
          id: `js_new_${Date.now().toString(16)}`,
          userId: id,
          fullName: payload.jobSeeker.fullName,
          skills: [],
          skillLevels: {},
          phone: null,
          location: null,
          experienceYears: 0,
          desiredRole: null,
          isFresher: true,
          visibility: "PUBLIC",
        });
      }

      if (payload.role === "RECRUITER") {
        if (!payload.recruiter) throw new Error("Recruiter details required");
        db.recruiters.push({
          id: `rec_new_${Date.now().toString(16)}`,
          userId: id,
          companyName: payload.recruiter.companyName,
          website: "",
          location: "",
          description: "",
        });
      }

      saveDb(db);
      return { token: tokenFor(user.id), user: { id: user.id, email: user.email, role: user.role } };
    },

    me(token: string): { user: { id: string; email: string; role: UserRole } } {
      const db = loadDb();
      const user = assertUser(token, db);
      return { user: { id: user.id, email: user.email, role: user.role } };
    },
  },

  trends(): { trends: Trends } {
    const db = loadDb();
    return { trends: db.trends };
  },

  notifications: {
    list(token: string) {
      const db = loadDb();
      const user = assertUser(token, db);
      return { notifications: db.notifications.filter((n) => n.userId === user.id) };
    },
    markRead(token: string, id: string) {
      const db = loadDb();
      const user = assertUser(token, db);
      const n = db.notifications.find((x) => x.id === id && x.userId === user.id);
      if (n) n.isRead = true;
      saveDb(db);
      return { ok: true };
    },
  },

  jobSeeker: {
    profile: {
      get(token: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        const profile = db.jobSeekers.find((p) => p.userId === user.id);
        if (!profile) throw new Error("Profile not found");
        return { profile };
      },
      patch(token: string, patch: Partial<JobSeeker>) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        const profile = db.jobSeekers.find((p) => p.userId === user.id);
        if (!profile) throw new Error("Profile not found");
        Object.assign(profile, patch);
        saveDb(db);
        return { profile };
      },
    },

    resume: {
      list(token: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        return { resumes: db.resumes.filter((r) => r.userId === user.id).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) };
      },
      add(token: string, input: { originalName: string; mimeType: string; sizeBytes: number }) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        const resume: Resume = {
          id: `res_new_${Date.now().toString(16)}`,
          userId: user.id,
          originalName: input.originalName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          createdAt: nowIso(),
        };
        db.resumes.unshift(resume);
        saveDb(db);
        return { resume };
      },
    },

    generatedResumes: {
      list(token: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        return { generatedResumes: listGeneratedResumesForUser(db, user.id) };
      },
      create(
        token: string,
        input: { template: ResumeTemplate; title: string; snapshot: ResumeSnapshot; settings?: ResumeSettings; tags?: string[] }
      ) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");

        const title = (input.title ?? "").trim() || `Resume (${input.template})`;
        const template = input.template;
        if (
          template !== "ATS_PLAIN" &&
          template !== "TECH_FOCUSED" &&
          template !== "EXECUTIVE" &&
          template !== "STARTUP" &&
          template !== "ACADEMIC" &&
          template !== "MODERN" &&
          template !== "CLASSIC" &&
          template !== "MINIMAL"
        ) {
          throw new Error("Invalid template");
        }

        const resume: GeneratedResume = {
          id: `gres_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
          userId: user.id,
          template,
          title,
          createdAt: nowIso(),
          snapshot: input.snapshot,
          settings: input.settings,
          tags: Array.isArray(input.tags) ? input.tags : [],
          performance: {
            views: 0,
            callbacks: 0,
            lastViewedAt: null,
          },
        };

        db.generatedResumes.unshift(resume);

        // If user doesn't have a primary generated resume, set it.
        const profile = db.jobSeekers.find((p) => p.userId === user.id);
        if (profile && !profile.activeGeneratedResumeId) {
          profile.activeGeneratedResumeId = resume.id;
        }

        saveDb(db);
        return { generatedResume: resume };
      },
      remove(token: string, id: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");

        const before = db.generatedResumes.length;
        db.generatedResumes = db.generatedResumes.filter((r) => !(r.id === id && r.userId === user.id));
        const removed = db.generatedResumes.length !== before;

        const profile = db.jobSeekers.find((p) => p.userId === user.id);
        if (profile && profile.activeGeneratedResumeId === id) {
          const next = listGeneratedResumesForUser(db, user.id)[0];
          profile.activeGeneratedResumeId = next ? next.id : null;
        }

        saveDb(db);
        return { ok: removed };
      },
    },

    jobs: {
      list(
        token: string,
        filters: {
          skills?: string;
          location?: string;
          role?: string;
          q?: string;
          freshersOnly?: boolean;
          jobType?: string;
          minExp?: number;
        }
      ) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");

        let out = [...db.jobs];
        if (filters.freshersOnly) out = out.filter((j) => j.openToFreshers);
        if (filters.location) out = out.filter((j) => j.location.toLowerCase().includes(filters.location!.toLowerCase()));
        if (filters.role) out = out.filter((j) => j.role.toLowerCase().includes(filters.role!.toLowerCase()));
        if (filters.q) {
          const q = filters.q.toLowerCase();
          out = out.filter((j) => j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q));
        }
        if (filters.skills) {
          const want = filters.skills
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          out = out.filter((j) => want.every((w) => j.requiredSkills.some((s) => s.toLowerCase() === w)));
        }

        if (filters.jobType) {
          out = out.filter((j) => (j.jobType ?? "FULL_TIME") === filters.jobType);
        }

        if (typeof filters.minExp === "number" && Number.isFinite(filters.minExp)) {
          out = out.filter((j) => Number(j.minExperienceYears ?? 0) <= filters.minExp!);
        }

        return { jobs: out };
      },
      details(token: string, jobId: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        const job = db.jobs.find((j) => j.id === jobId);
        if (!job) throw new Error("Job not found");
        return { job };
      },
    },

    applications: {
      apply(token: string, jobId: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        const seeker = db.jobSeekers.find((p) => p.userId === user.id);
        if (!seeker) throw new Error("Profile not found");
        const job = db.jobs.find((j) => j.id === jobId);
        if (!job) throw new Error("Job not found");

        const exists = db.applications.some((a) => a.jobId === jobId && a.jobSeekerId === seeker.id);
        if (exists) throw new Error("Already applied");

        const application: Application = {
          id: `app_new_${Date.now().toString(16)}`,
          jobId,
          jobSeekerId: seeker.id,
          status: "APPLIED",
          createdAt: nowIso(),
          interviewAt: null,
        };
        db.applications.unshift(application);

        createNotification(db, {
          userId: user.id,
          type: "APPLICATION",
          message: `Applied to ${job.title} at ${job.companyName}.`,
        });

        const recruiter = db.recruiters.find((r) => r.id === job.recruiterId);
        if (recruiter) {
          createNotification(db, {
            userId: recruiter.userId,
            type: "SYSTEM",
            message: `${seeker.fullName} applied to ${job.title}.`,
          });
        }

        saveDb(db);
        return { application };
      },
      list(token: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        const seeker = db.jobSeekers.find((p) => p.userId === user.id);
        if (!seeker) throw new Error("Profile not found");

        const items = db.applications
          .filter((a) => a.jobSeekerId === seeker.id)
          .map((a) => ({
            id: a.id,
            status: a.status,
            interviewAt: a.interviewAt,
            createdAt: a.createdAt,
            job: db.jobs.find((j) => j.id === a.jobId)!,
          }))
          .filter((x) => Boolean(x.job));

        return { applications: items };
      },
    },

    saved: {
      list(token: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        const seeker = db.jobSeekers.find((p) => p.userId === user.id);
        if (!seeker) throw new Error("Profile not found");
        const items = db.savedJobs
          .filter((s) => s.jobSeekerId === seeker.id)
          .map((s) => ({ job: db.jobs.find((j) => j.id === s.jobId) }))
          .filter((x) => x.job);
        return { savedJobs: items };
      },
      add(token: string, jobId: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        const seeker = db.jobSeekers.find((p) => p.userId === user.id);
        if (!seeker) throw new Error("Profile not found");

        const exists = db.savedJobs.some((s) => s.jobId === jobId && s.jobSeekerId === seeker.id);
        if (exists) return { ok: true };
        db.savedJobs.unshift({ id: `sav_new_${Date.now().toString(16)}`, jobId, jobSeekerId: seeker.id, savedAt: nowIso() });
        saveDb(db);
        return { ok: true };
      },
      remove(token: string, jobId: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "JOB_SEEKER") throw new Error("Forbidden");
        const seeker = db.jobSeekers.find((p) => p.userId === user.id);
        if (!seeker) throw new Error("Profile not found");
        const idx = db.savedJobs.findIndex((s) => s.jobId === jobId && s.jobSeekerId === seeker.id);
        if (idx >= 0) db.savedJobs.splice(idx, 1);
        saveDb(db);
        return { ok: true };
      },
    },
  },

  recruiter: {
    profile: {
      get(token: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "RECRUITER") throw new Error("Forbidden");
        const profile = db.recruiters.find((p) => p.userId === user.id);
        if (!profile) throw new Error("Profile not found");
        return { profile };
      },
      patch(token: string, patch: Partial<Recruiter>) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "RECRUITER") throw new Error("Forbidden");
        const profile = db.recruiters.find((p) => p.userId === user.id);
        if (!profile) throw new Error("Profile not found");
        Object.assign(profile, patch);
        saveDb(db);
        return { profile };
      },
    },

    jobs: {
      list(token: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "RECRUITER") throw new Error("Forbidden");
        const recruiter = db.recruiters.find((r) => r.userId === user.id);
        if (!recruiter) throw new Error("Profile not found");
        return { jobs: db.jobs.filter((j) => j.recruiterId === recruiter.id) };
      },
      create(
        token: string,
        input: Omit<Job, "id" | "createdAt" | "recruiterId" | "companyName"> & { companyName?: string }
      ) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "RECRUITER") throw new Error("Forbidden");
        const recruiter = db.recruiters.find((r) => r.userId === user.id);
        if (!recruiter) throw new Error("Profile not found");

        const job: Job = {
          id: `job_new_${Date.now().toString(16)}`,
          recruiterId: recruiter.id,
          companyName: recruiter.companyName,
          createdAt: nowIso(),
          title: input.title,
          role: input.role,
          location: input.location,
          requiredSkills: input.requiredSkills,
          jobType: (input as any).jobType ?? "FULL_TIME",
          minExperienceYears: Number((input as any).minExperienceYears ?? 0),
          description: input.description,
          openToFreshers: input.openToFreshers,
        };

        db.jobs.unshift(job);
        saveDb(db);
        return { job };
      },
      patch(token: string, jobId: string, patch: Partial<Job>) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "RECRUITER") throw new Error("Forbidden");
        const recruiter = db.recruiters.find((r) => r.userId === user.id);
        if (!recruiter) throw new Error("Profile not found");
        const job = db.jobs.find((j) => j.id === jobId);
        if (!job || job.recruiterId !== recruiter.id) throw new Error("Job not found");
        Object.assign(job, patch);
        saveDb(db);
        return { job };
      },
      remove(token: string, jobId: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "RECRUITER") throw new Error("Forbidden");
        const recruiter = db.recruiters.find((r) => r.userId === user.id);
        if (!recruiter) throw new Error("Profile not found");
        const idx = db.jobs.findIndex((j) => j.id === jobId && j.recruiterId === recruiter.id);
        if (idx < 0) throw new Error("Job not found");
        db.jobs.splice(idx, 1);
        db.applications = db.applications.filter((a) => a.jobId !== jobId);
        db.savedJobs = db.savedJobs.filter((s) => s.jobId !== jobId);
        saveDb(db);
        return { ok: true };
      },
    },

    applicants: {
      listForJob(token: string, jobId: string, skill?: string) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "RECRUITER") throw new Error("Forbidden");
        const recruiter = db.recruiters.find((r) => r.userId === user.id);
        if (!recruiter) throw new Error("Profile not found");

        const job = db.jobs.find((j) => j.id === jobId);
        if (!job || job.recruiterId !== recruiter.id) throw new Error("Job not found");

        const apps = db.applications.filter((a) => a.jobId === jobId);
        const rows = apps
          .map((a) => {
            const seeker = db.jobSeekers.find((s) => s.id === a.jobSeekerId);
            if (!seeker) return null;
            return {
              applicationId: a.id,
              status: a.status,
              interviewAt: a.interviewAt,
              candidate: {
                id: seeker.id,
                fullName: seeker.fullName,
                skills: seeker.skills,
                experienceYears: seeker.experienceYears,
                latestResume: latestResumeForUser(db, seeker.userId),
              },
            };
          })
          .filter(Boolean) as any[];

        const filtered = skill
          ? rows.filter((x) => x.candidate.skills.some((s: string) => s.toLowerCase().includes(skill.toLowerCase())))
          : rows;

        return { applicants: filtered };
      },

      updateStatus(token: string, applicationId: string, status: ApplicationStatus, interviewAt?: string | null) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "RECRUITER") throw new Error("Forbidden");
        const recruiter = db.recruiters.find((r) => r.userId === user.id);
        if (!recruiter) throw new Error("Profile not found");

        const app = db.applications.find((a) => a.id === applicationId);
        if (!app) throw new Error("Application not found");
        const job = db.jobs.find((j) => j.id === app.jobId);
        if (!job || job.recruiterId !== recruiter.id) throw new Error("Forbidden");

        app.status = status;
        if (interviewAt !== undefined) {
          app.interviewAt = interviewAt;
        }

        const seeker = db.jobSeekers.find((s) => s.id === app.jobSeekerId);
        if (seeker) {
          createNotification(db, {
            userId: seeker.userId,
            type: status === "INTERVIEW_SCHEDULED" ? "INTERVIEW" : "STATUS",
            message:
              status === "SHORTLISTED"
                ? `You were shortlisted for ${job.title} at ${job.companyName}.`
                : status === "REJECTED"
                  ? `Update: ${job.companyName} rejected your application for ${job.title}.`
                  : status === "INTERVIEW_SCHEDULED"
                    ? `Interview scheduled for ${job.title} at ${job.companyName}.`
                    : `Application status updated for ${job.title} at ${job.companyName}.`,
          });
        }

        saveDb(db);
        return { ok: true };
      },
    },

    overview(token: string) {
      const db = loadDb();
      const user = assertUser(token, db);
      if (user.role !== "RECRUITER") throw new Error("Forbidden");
      const recruiter = db.recruiters.find((r) => r.userId === user.id);
      if (!recruiter) throw new Error("Profile not found");

      const recruiterJobs = db.jobs.filter((j) => j.recruiterId === recruiter.id);
      const jobIds = new Set(recruiterJobs.map((j) => j.id));
      const apps = db.applications.filter((a) => jobIds.has(a.jobId));

      const shortlisted = apps.filter((a) => a.status === "SHORTLISTED").length;
      const rejected = apps.filter((a) => a.status === "REJECTED").length;
      const interviewCount = apps.filter((a) => a.status === "INTERVIEW_SCHEDULED").length;
      const offered = apps.filter((a) => a.status === "OFFERED").length;
      const hired = apps.filter((a) => a.status === "HIRED").length;
      const total = apps.length;

      // Generate deterministic 7-day views & applications data
      const dayLabels: string[] = [];
      const viewsData: number[] = [];
      const appsData: number[] = [];
      const today = new Date();
      const seed = recruiter.id.charCodeAt(0) + recruiter.id.length;
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dayLabels.push(d.toLocaleDateString("en-IN", { weekday: "short" }));
        const base = ((seed * (7 - i) + i * 37) % 40) + 20;
        viewsData.push(base + Math.floor(total * 0.8));
        appsData.push(Math.floor(base * 0.3) + Math.floor(total * 0.15));
      }

      // Top performing job
      const jobAppCounts = recruiterJobs.map((j) => ({
        job: j,
        count: apps.filter((a) => a.jobId === j.id).length,
      }));
      jobAppCounts.sort((a, b) => b.count - a.count);
      const topJob = jobAppCounts[0] ?? null;

      // Avg time-to-hire (mock: 8-22 days deterministic)
      const avgTimeToHire = total > 0 ? 8 + (seed % 15) : 0;

      // Candidate quality score based on shortlisted ratio
      const qualityScore = total > 0 ? Math.round(((shortlisted + interviewCount + offered + hired) / total) * 100) : 0;

      return {
        overview: {
          jobsCount: recruiterJobs.length,
          applicationsTotal: total,
          shortlisted,
          rejected,
          interviews: interviewCount,
          offered,
          hired,
          // Analytics extensions
          funnel: {
            applied: total,
            shortlisted,
            interview: interviewCount,
            offered,
            hired,
          },
          weekly: { labels: dayLabels, views: viewsData, applications: appsData },
          topJob: topJob ? { title: topJob.job.title, company: topJob.job.companyName, applicants: topJob.count } : null,
          avgTimeToHire,
          qualityScore,
        },
      };
    },

    applications: {
      listByStatus(token: string, status: ApplicationStatus) {
        const db = loadDb();
        const user = assertUser(token, db);
        if (user.role !== "RECRUITER") throw new Error("Forbidden");
        const recruiter = db.recruiters.find((r) => r.userId === user.id);
        if (!recruiter) throw new Error("Profile not found");

        const jobIds = new Set(db.jobs.filter((j) => j.recruiterId === recruiter.id).map((j) => j.id));
        const apps = db.applications.filter((a) => jobIds.has(a.jobId) && a.status === status);

        const rows = apps
          .map((a) => {
            const job = db.jobs.find((j) => j.id === a.jobId);
            const seeker = db.jobSeekers.find((s) => s.id === a.jobSeekerId);
            if (!job || !seeker) return null;
            return {
              applicationId: a.id,
              status: a.status,
              interviewAt: a.interviewAt,
              job: { id: job.id, title: job.title, companyName: job.companyName, location: job.location },
              candidate: {
                fullName: seeker.fullName,
                skills: seeker.skills,
                experienceYears: seeker.experienceYears,
                latestResume: latestResumeForUser(db, seeker.userId),
              },
            };
          })
          .filter(Boolean);

        return { applications: rows };
      },
    },
  },
};
