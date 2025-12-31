import { mockApi } from "../mock/service";

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: JsonValue;
};

export async function apiJson<T>(path: string, options: ApiOptions = {}): Promise<T> {
  try {
    const method = options.method ?? "GET";
    const token = options.token ?? null;
    const body = (options.body ?? null) as any;

    // Auth
    if (path === "/auth/login" && method === "POST") {
      return mockApi.auth.login(body.email, body.password, body.role) as any;
    }
    if (path === "/auth/register" && method === "POST") {
      return mockApi.auth.register(body) as any;
    }
    if (path === "/auth/me" && method === "GET") {
      return mockApi.auth.me(token ?? "") as any;
    }

    // Trends
    if (path === "/trends" && method === "GET") {
      return mockApi.trends() as any;
    }

    // Notifications
    if (path === "/notifications" && method === "GET") {
      return mockApi.notifications.list(token ?? "") as any;
    }
    if (path.startsWith("/notifications/") && path.endsWith("/read") && method === "POST") {
      const id = path.split("/")[2];
      return mockApi.notifications.markRead(token ?? "", id) as any;
    }

    // Job seeker
    if (path === "/job-seeker/profile" && method === "GET") {
      return mockApi.jobSeeker.profile.get(token ?? "") as any;
    }
    if (path === "/job-seeker/profile" && method === "PATCH") {
      return mockApi.jobSeeker.profile.patch(token ?? "", body) as any;
    }
    if (path === "/job-seeker/resume" && method === "GET") {
      return mockApi.jobSeeker.resume.list(token ?? "") as any;
    }

    if (path === "/job-seeker/generated-resumes" && method === "GET") {
      return mockApi.jobSeeker.generatedResumes.list(token ?? "") as any;
    }
    if (path === "/job-seeker/generated-resumes" && method === "POST") {
      return mockApi.jobSeeker.generatedResumes.create(token ?? "", body) as any;
    }
    if (path.startsWith("/job-seeker/generated-resumes/") && method === "DELETE") {
      const id = path.split("/")[3];
      return mockApi.jobSeeker.generatedResumes.remove(token ?? "", id) as any;
    }
    if (path === "/jobs" && method === "GET") {
      return mockApi.jobSeeker.jobs.list(token ?? "", {}) as any;
    }
    if (path.startsWith("/jobs?") && method === "GET") {
      const url = new URL(`http://local${path}`);
      return mockApi.jobSeeker.jobs.list(token ?? "", {
        q: url.searchParams.get("q") ?? undefined,
        skills: url.searchParams.get("skills") ?? undefined,
        location: url.searchParams.get("location") ?? undefined,
        role: url.searchParams.get("role") ?? undefined,
        freshersOnly: url.searchParams.get("freshersOnly") === "true",
        jobType: url.searchParams.get("jobType") ?? undefined,
        minExp: url.searchParams.get("minExp") ? Number(url.searchParams.get("minExp")) : undefined,
      }) as any;
    }
    if (path.startsWith("/jobs/") && method === "GET") {
      const jobId = path.split("/")[2];
      return mockApi.jobSeeker.jobs.details(token ?? "", jobId) as any;
    }
    if (path === "/job-seeker/applications" && method === "POST") {
      return mockApi.jobSeeker.applications.apply(token ?? "", body.jobId) as any;
    }
    if (path === "/job-seeker/applications" && method === "GET") {
      return mockApi.jobSeeker.applications.list(token ?? "") as any;
    }
    // Saved jobs (support both new + legacy paths)
    if ((path === "/job-seeker/saved" || path === "/job-seeker/saved-jobs") && method === "GET") {
      return mockApi.jobSeeker.saved.list(token ?? "") as any;
    }
    if ((path === "/job-seeker/saved" || path === "/job-seeker/saved-jobs") && method === "POST") {
      return mockApi.jobSeeker.saved.add(token ?? "", body.jobId) as any;
    }
    if (path.startsWith("/job-seeker/saved-jobs/") && method === "DELETE") {
      const jobId = path.split("/")[3];
      return mockApi.jobSeeker.saved.remove(token ?? "", jobId) as any;
    }

    // Recruiter
    if (path === "/recruiter/profile" && method === "GET") {
      return mockApi.recruiter.profile.get(token ?? "") as any;
    }
    if (path === "/recruiter/profile" && method === "PATCH") {
      return mockApi.recruiter.profile.patch(token ?? "", body) as any;
    }
    if (path === "/recruiter/overview" && method === "GET") {
      return mockApi.recruiter.overview(token ?? "") as any;
    }
    if (path === "/recruiter/jobs" && method === "GET") {
      return mockApi.recruiter.jobs.list(token ?? "") as any;
    }
    if (path === "/recruiter/jobs" && method === "POST") {
      return mockApi.recruiter.jobs.create(token ?? "", body) as any;
    }
    if (path.startsWith("/recruiter/jobs/") && method === "PATCH") {
      const jobId = path.split("/")[3];
      return mockApi.recruiter.jobs.patch(token ?? "", jobId, body) as any;
    }
    if (path.startsWith("/recruiter/jobs/") && method === "DELETE") {
      const jobId = path.split("/")[3];
      return mockApi.recruiter.jobs.remove(token ?? "", jobId) as any;
    }
    if (path.startsWith("/recruiter/jobs/") && path.includes("/applicants") && method === "GET") {
      const url = new URL(`http://local${path}`);
      const parts = url.pathname.split("/");
      const jobId = parts[3];
      const skill = url.searchParams.get("skill") ?? undefined;
      return mockApi.recruiter.applicants.listForJob(token ?? "", jobId, skill) as any;
    }
    if (path.startsWith("/recruiter/applications?") && method === "GET") {
      const url = new URL(`http://local${path}`);
      const status = (url.searchParams.get("status") ?? "") as any;
      return mockApi.recruiter.applications.listByStatus(token ?? "", status) as any;
    }
    if (path.startsWith("/recruiter/applications/") && method === "PATCH") {
      const applicationId = path.split("/")[3];
      return mockApi.recruiter.applicants.updateStatus(token ?? "", applicationId, body.status, body.interviewAt) as any;
    }

    throw new ApiError(404, `Mock route not implemented: ${method} ${path}`);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : "Request failed";
    throw new ApiError(400, message);
  }
}

export async function apiFormData<T>(path: string, formData: FormData, token: string): Promise<T> {
  // Prototype-only: store resume metadata in mock DB (no binary upload).
  try {
    if (path === "/job-seeker/resume") {
      const file = formData.get("resume");
      if (!(file instanceof File)) throw new ApiError(400, "Invalid file");
      const res = mockApi.jobSeeker.resume.add(token, {
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      return res as any;
    }
    throw new ApiError(404, `Mock route not implemented: POST ${path}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    throw new ApiError(400, message);
  }
}
