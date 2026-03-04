import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "../../api/client";
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
      return { label: "Interview", variant: "teal" as const };
    case "REJECTED":
      return { label: "Rejected", variant: "red" as const };
    case "OFFERED":
      return { label: "Offer", variant: "purple" as const };
    case "HIRED":
      return { label: "Hired", variant: "teal" as const };
    default:
      return { label: status, variant: "blue" as const };
  }
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
  const { token } = useAuth();

  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [generatedResumes, setGeneratedResumes] = useState<GeneratedResume[]>([]);
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [savedJobs, setSavedJobs] = useState<Array<{ job: Job }>>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        setError(null);
        const [p, r, g, a, s, n] = await Promise.all([
          apiJson<{ profile: JobSeekerProfile }>("/job-seeker/profile", { token }),
          apiJson<{ resumes: Resume[] }>("/job-seeker/resume", { token }),
          apiJson<{ generatedResumes: GeneratedResume[] }>("/job-seeker/generated-resumes", { token }),
          apiJson<{ applications: ApplicationWithJob[] }>("/job-seeker/applications", { token }),
          apiJson<{ savedJobs: Array<{ job: Job }> }>("/job-seeker/saved-jobs", { token }),
          apiJson<{ notifications: NotificationItem[] }>("/notifications", { token }),
        ]);

        setProfile(p.profile);
        setResumes(r.resumes);
        setGeneratedResumes(g.generatedResumes);
        setApplications(a.applications);
        setSavedJobs(s.savedJobs);
        setNotifications(n.notifications);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
  }, [token]);

  const unreadNotifications = useMemo(
    () => notifications.filter((x) => !x.isRead).length,
    [notifications],
  );

  const interviewCalls = useMemo(
    () => applications.filter((x) => x.status === "INTERVIEW_SCHEDULED").length,
    [applications],
  );

  const upcomingInterviews = useMemo(
    () => applications.filter((x) => x.status === "INTERVIEW_SCHEDULED").slice(0, 3),
    [applications],
  );

  const recentApplications = useMemo(() => applications.slice(0, 4), [applications]);

  const completion = useMemo(() => {
    if (!profile) return 0;
    return calcProfileCompletion(profile, resumes.length > 0 || generatedResumes.length > 0);
  }, [generatedResumes.length, profile, resumes.length]);

  const resumeReadyLabel = useMemo(() => {
    if (resumes.length > 0) return "Ready";
    if (generatedResumes.length > 0) return "Ready";
    return "Not added";
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

  if (!profile) {
    return <Card>Loading dashboard...</Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-2xl font-semibold">{greetingForTime()}, {profile.fullName}.</div>
          <p className="mt-1 text-sm text-text-secondary">Here is where you stand today.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/job-seeker/profile">
            <Button variant="secondary">Edit profile</Button>
          </Link>
          <Link to="/job-seeker/jobs">
            <Button variant="primary">Find jobs</Button>
          </Link>
        </div>
      </Card>

      {error ? <Card className="border-danger/50 bg-danger/10 text-danger">{error}</Card> : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-text-secondary">Profile strength</div>
              <div className="text-2xl font-semibold">{completion}%</div>
              <div className="mt-2 text-xs text-text-muted">Aim for 80%+ to get better matches.</div>
            </div>
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-16 w-16">
                <path
                  className="text-border"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"
                />
                <path
                  className={completion >= 80 ? "text-accent-teal" : completion >= 60 ? "text-accent-amber" : "text-danger"}
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
          <div className="text-sm text-text-secondary">Applications sent</div>
          <div className="mt-2 text-3xl font-semibold">{applications.length}</div>
          <div className="mt-4">
            <svg viewBox="0 0 100 40" className="h-10 w-full">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-accent"
                points={sparklinePoints(sparklineData)}
              />
            </svg>
          </div>
        </Card>

        <Card className="card-hover">
          <div className="text-sm text-text-secondary">Saved jobs</div>
          <div className="mt-2 text-3xl font-semibold">{savedJobs.length}</div>
          <div className="mt-3 text-xs text-text-muted">Keep a shortlist of the best matches.</div>
        </Card>

        <Card className="card-hover">
          <div className="text-sm text-text-secondary">Interview calls</div>
          <div className="mt-2 text-3xl font-semibold">{interviewCalls}</div>
          <div className="mt-3 text-xs text-text-muted">Stay ready for upcoming rounds.</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent applications</h3>
            <Link to="/job-seeker/applied" className="text-sm text-text-secondary hover:text-text">
              View all
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted">
              No applications yet. Apply to a role to start tracking progress.
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((a) => {
                const status = statusVariant(a.status);
                return (
                  <div key={a.id} className="rounded-2xl border border-border bg-surface-raised p-4 transition hover:border-border-active">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold">{a.job.title}</div>
                        <div className="text-sm text-text-secondary">
                          {a.job.companyName} · {a.job.location}
                        </div>
                        <div className="mt-2 text-xs text-text-muted">
                          Applied {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Link to={`/job-seeker/jobs/${a.job.id}`}>
                          <Button variant="secondary">Details</Button>
                        </Link>
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
              <h3 className="text-lg font-semibold">Resume readiness</h3>
              <Badge variant={resumeReadyLabel === "Ready" ? "teal" : "amber"}>{resumeReadyLabel}</Badge>
            </div>
            <div className="text-sm text-text-secondary">{resumeHint}</div>
            <div className="flex gap-3">
              <Link to="/job-seeker/profile">
                <Button variant="secondary">Edit</Button>
              </Link>
              <Link to="/job-seeker/resume-builder">
                <Button variant="primary">Download</Button>
              </Link>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upcoming interviews</h3>
              <Link to="/job-seeker/applied" className="text-sm text-text-secondary hover:text-text">
                View status
              </Link>
            </div>

            {upcomingInterviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                No interviews scheduled yet. Keep applying to stay visible.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((a) => (
                  <div key={a.id} className="rounded-xl border border-border bg-surface-raised p-3">
                    <div className="text-sm font-semibold">{a.job.title}</div>
                    <div className="text-xs text-text-secondary">
                      {a.job.companyName} · {a.job.location}
                    </div>
                    <div className="mt-2 text-xs text-text-muted">
                      Interview: {a.interviewAt ? new Date(a.interviewAt).toLocaleString() : "Scheduled"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Quick apply</h3>
              <Link to="/job-seeker/jobs" className="text-sm text-text-secondary hover:text-text">
                See matches
              </Link>
            </div>

            {savedJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
                Save a job to build a quick-apply shortlist.
              </div>
            ) : (
              <div className="space-y-3">
                {savedJobs.slice(0, 2).map((item) => (
                  <div key={item.job.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-raised p-3">
                    <div>
                      <div className="text-sm font-semibold">{item.job.title}</div>
                      <div className="text-xs text-text-secondary">{item.job.companyName}</div>
                    </div>
                    <Link to={`/job-seeker/jobs/${item.job.id}`}>
                      <Button variant="secondary">Details</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Notifications</div>
          <div className="text-xs text-text-muted">
            {unreadNotifications === 0 ? "You are all caught up." : `${unreadNotifications} unread update(s).`}
          </div>
        </div>
        <Link to="/job-seeker/notifications">
          <Button variant="secondary">Open</Button>
        </Link>
      </Card>
    </div>
  );
}
