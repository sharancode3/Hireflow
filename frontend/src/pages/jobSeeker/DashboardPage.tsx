import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, apiJson } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type {
  ApplicationWithJob,
  GeneratedResume,
  Job,
  JobSeekerProfile,
  NotificationItem,
  Resume,
} from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useCountUp } from "../../hooks/useCountUp";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function calcProfileCompletion(profile: JobSeekerProfile, hasResume: boolean) {
  const checks: Array<{ ok: boolean; weight: number }> = [
    { ok: Boolean(profile.fullName?.trim()), weight: 18 },
    { ok: Boolean((profile.location ?? "").trim()), weight: 10 },
    { ok: Boolean((profile.phone ?? "").trim()), weight: 10 },
    { ok: Boolean((profile.desiredRole ?? "").trim()), weight: 14 },
    { ok: profile.experienceYears >= 0, weight: 8 },
    { ok: (profile.skills ?? []).length >= 3, weight: 30 },
    { ok: hasResume, weight: 10 },
  ];

  const score = checks.reduce((sum, c) => sum + (c.ok ? c.weight : 0), 0);
  return clamp(score, 0, 100);
}

function greetingForTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function statusVariant(status: ApplicationWithJob["status"]) {
  switch (status) {
    case "APPLIED":
      return { label: "Applied", variant: "blue" as const };
    case "SHORTLISTED":
      return { label: "Viewed", variant: "amber" as const };
    case "INTERVIEW_SCHEDULED":
      return { label: "Interview", variant: "amber" as const };
    case "REJECTED":
      return { label: "Rejected", variant: "red" as const };
    case "OFFERED":
      return { label: "Offer", variant: "green" as const };
    case "HIRED":
      return { label: "Hired", variant: "green" as const };
    default:
      return { label: status, variant: "blue" as const };
  }
}

function initialsOfCompany(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function sparklinePoints(values: number[]) {
  const max = Math.max(1, ...values);
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 40 - (v / max) * 32 - 4;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function JobSeekerDashboardPage() {
  const { token, user } = useAuth();

  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [generatedResumes, setGeneratedResumes] = useState<GeneratedResume[]>([]);
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [savedJobs, setSavedJobs] = useState<Array<{ job?: Job; jobId?: Job | string }>>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function fallbackProfile(): JobSeekerProfile {
    return {
      id: `local_${user?.id ?? "job_seeker"}`,
      userId: user?.id ?? "job_seeker",
      fullName: (user?.email?.split("@")[0] ?? "Job Seeker").trim(),
      phone: null,
      location: null,
      experienceYears: 0,
      desiredRole: null,
      skills: [],
      isFresher: true,
      visibility: "PUBLIC",
    };
  }

  async function optionalApi<T>(path: string, fallback: T): Promise<T> {
    try {
      return await apiJson<T>(path, { token: token ?? undefined });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return fallback;
      throw e;
    }
  }

  useEffect(() => {
    (async () => {
      if (!token) {
        setIsLoading(false);
        setProfile(null);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const [p, r, g, a, s, n] = await Promise.all([
          optionalApi<{ profile: JobSeekerProfile }>("/job-seeker/profile", { profile: fallbackProfile() }),
          optionalApi<{ resumes: Resume[] }>("/job-seeker/resume", { resumes: [] }),
          optionalApi<{ generatedResumes: GeneratedResume[] }>("/job-seeker/generated-resumes", { generatedResumes: [] }),
          optionalApi<{ applications: ApplicationWithJob[] }>("/job-seeker/applications", { applications: [] }),
          optionalApi<{ savedJobs: Array<{ job?: Job; jobId?: Job | string }> }>("/job-seeker/saved-jobs", { savedJobs: [] }),
          optionalApi<{ notifications: NotificationItem[] }>("/notifications", { notifications: [] }),
        ]);

        setProfile(p.profile);
        setResumes(r.resumes);
        setGeneratedResumes(g.generatedResumes);
        setApplications(a.applications);
        setSavedJobs(s.savedJobs);
        setNotifications(n.notifications);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token, user?.email, user?.id]);

  const unreadNotifications = useMemo(() => notifications.filter((x) => !x.isRead).length, [notifications]);
  const interviewCalls = useMemo(() => applications.filter((x) => x.status === "INTERVIEW_SCHEDULED").length, [applications]);
  const upcomingInterviews = useMemo(() => applications.filter((x) => x.status === "INTERVIEW_SCHEDULED").slice(0, 3), [applications]);
  const recentApplications = useMemo(() => applications.slice(0, 5), [applications]);

  const completion = useMemo(() => {
    if (!profile) return 0;
    return calcProfileCompletion(profile, resumes.length > 0 || generatedResumes.length > 0);
  }, [generatedResumes.length, profile, resumes.length]);

  const resumeReadyLabel = useMemo(() => {
    if (resumes.length > 0 || generatedResumes.length > 0) return "Ready";
    return "Not Added";
  }, [generatedResumes.length, resumes.length]);

  const resumeHint = useMemo(() => {
    if (resumes.length > 0) return `Latest: ${resumes[0]?.originalName ?? "Resume"}`;
    const primary = generatedResumes.find((x) => x.id === (profile?.activeGeneratedResumeId ?? ""));
    if (primary) return `Primary: ${primary.title}`;
    if (generatedResumes.length > 0) return `Latest generated: ${generatedResumes[0]!.title}`;
    return "Add a resume to apply with one click.";
  }, [generatedResumes, profile?.activeGeneratedResumeId, resumes]);

  const sparklineData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => i);
    return days.map((offset) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - offset));
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      return applications.filter((a) => {
        const created = new Date(a.createdAt);
        return created >= start && created <= end;
      }).length;
    });
  }, [applications]);

  const recommendedJobs = useMemo(() => {
    const byId = new Map<string, Job>();
    for (const s of savedJobs) {
      const candidate = s.job ?? (typeof s.jobId === "object" ? s.jobId : null);
      if (!candidate?.id) continue;
      byId.set(candidate.id, candidate);
    }
    for (const a of applications) byId.set(a.job.id, a.job);
    return Array.from(byId.values()).slice(0, 8);
  }, [applications, savedJobs]);

  const applicationsCount = useCountUp(applications.length, 800);
  const savedCount = useCountUp(savedJobs.length, 800);
  const interviewCount = useCountUp(interviewCalls, 800);
  const completionCount = useCountUp(completion, 800);
  const firstName = useMemo(() => profile?.fullName?.trim().split(/\s+/)[0] ?? "there", [profile?.fullName]);

  if (isLoading) return <Card>Loading dashboard...</Card>;
  if (!profile) return <Card className="border-danger/50 bg-danger/10 text-danger">{error ?? "Profile not found."}</Card>;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-2xl font-semibold">{greetingForTime()}, {firstName}.</div>
          <p className="mt-1 text-sm text-text-secondary">Here is where you stand today.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/job-seeker/profile"><Button variant="secondary">Edit profile</Button></Link>
          <Link to="/job-seeker/jobs"><Button variant="primary">Find jobs</Button></Link>
        </div>
      </Card>

      {error ? <Card className="border-danger/50 bg-danger/10 text-danger">{error}</Card> : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-text-secondary">Profile strength</div>
              <div className="text-2xl font-semibold">{completionCount}%</div>
              <div className="mt-2 text-xs text-text-muted">Aim for 80%+ to unlock better job matches.</div>
            </div>
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-16 w-16">
                <path className="text-border" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32" />
                <path
                  className={completion >= 70 ? "text-accent-teal" : completion >= 40 ? "text-accent-amber" : "text-danger"}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${completion},100`}
                  d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="card-hover">
          <div className="text-sm text-text-secondary">Applications Sent</div>
          <div className="mt-2 text-3xl font-semibold">{applicationsCount}</div>
          <div className="mt-4">
            <svg viewBox="0 0 100 40" className="h-10 w-full">
              <polyline fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" points={sparklinePoints(sparklineData)} />
            </svg>
          </div>
        </Card>

        <Card className="card-hover">
          <div className="text-sm text-text-secondary">Saved Jobs</div>
          <div className="mt-2 text-3xl font-semibold">{savedCount}</div>
          <div className="mt-3 text-xs text-text-muted">Bookmark opportunities you want to revisit.</div>
        </Card>

        <Card className="card-hover">
          <div className="text-sm text-text-secondary">Interview Calls</div>
          <div className="mt-2 text-3xl font-semibold">{interviewCount}</div>
          <div className="mt-3 text-xs text-text-muted">Stay prepared for upcoming rounds.</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Applications</h3>
            <Link to="/job-seeker/applied" className="text-sm text-text-secondary hover:text-text">View all</Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted">
              No applications yet. Browse jobs to get started.
              <div className="mt-3"><Link to="/job-seeker/jobs"><Button variant="primary">Browse Jobs</Button></Link></div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((a) => {
                const status = statusVariant(a.status);
                return (
                  <div key={a.id} className="rounded-2xl border border-border bg-surface-raised px-4 py-3 transition hover:border-border-active">
                    <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(26,115,232,0.2)] text-xs font-semibold text-[#8AB4F8]">{initialsOfCompany(a.job.companyName)}</div>
                      <div>
                        <div className="text-sm font-semibold">{a.job.title}</div>
                        <div className="text-xs text-text-secondary">{a.job.companyName}</div>
                        <div className="text-xs text-text-muted">Date applied: {new Date(a.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Link to={`/job-seeker/jobs/${a.job.id}`}><Button variant="secondary">Details</Button></Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Resume Readiness</h3>
              <Badge variant={resumeReadyLabel === "Ready" ? "teal" : "amber"}>{resumeReadyLabel}</Badge>
            </div>
            <div className="text-sm text-text-secondary">{resumeHint}</div>
            {resumeReadyLabel !== "Ready" ? (
              <div className="inline-flex rounded-full bg-[rgba(251,140,0,0.2)] px-3 py-1 text-xs font-semibold text-[#FB8C00]">Add a resume to apply with one click.</div>
            ) : null}
            <div className="flex gap-3">
              <Link to="/job-seeker/profile"><Button variant="secondary">Edit Resume</Button></Link>
              <Link to="/job-seeker/resume-builder"><Button variant="primary">Download PDF</Button></Link>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upcoming Interviews</h3>
              <Link to="/job-seeker/applied" className="text-sm text-text-secondary hover:text-text">View status</Link>
            </div>
            {upcomingInterviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">No upcoming interviews scheduled.</div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((a) => (
                  <div key={a.id} className="rounded-xl border border-border bg-surface-raised p-3">
                    <div className="text-sm font-semibold">{a.job.title}</div>
                    <div className="text-xs text-text-secondary">{a.job.companyName} · {a.job.location}</div>
                    <div className="mt-2 text-xs text-text-muted">Interview: {a.interviewAt ? new Date(a.interviewAt).toLocaleString() : "Scheduled"}</div>
                    <Link to="/job-seeker/applied" className="mt-2 inline-block text-xs text-[#8AB4F8] hover:text-white">View Details</Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recommended for you</h3>
          <Link to="/job-seeker/jobs" className="text-sm text-text-secondary hover:text-text">Browse more</Link>
        </div>
        {recommendedJobs.length === 0 ? (
          <div className="text-sm text-text-muted">Recommendations will appear once you save jobs or apply.</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recommendedJobs.map((job) => (
              <div key={job.id} className="min-w-[220px] animate-slide-in-right rounded-xl border border-border bg-surface-raised p-3">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(26,115,232,0.2)] text-xs font-semibold text-[#8AB4F8]">{initialsOfCompany(job.companyName)}</div>
                <div className="text-sm font-semibold">{job.title}</div>
                <div className="text-xs text-text-secondary">{job.companyName}</div>
                <div className="mt-1 text-xs text-text-muted">{job.location}</div>
                <Link to={`/job-seeker/jobs/${job.id}`} className="mt-3 inline-block text-xs font-semibold text-[#8AB4F8] hover:text-white">View</Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Notifications</div>
          <div className="text-xs text-text-muted">{unreadNotifications === 0 ? "You are all caught up." : `${unreadNotifications} unread update(s).`}</div>
        </div>
        <Link to="/job-seeker/notifications"><Button variant="secondary">Open</Button></Link>
      </Card>
    </div>
  );
}
