import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { ApplicationWithJob, GeneratedResume, Job, JobSeekerProfile, NotificationItem, Resume } from "../../types";

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

  const recentApplications = useMemo(() => applications.slice(0, 3), [applications]);

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

  if (!profile) {
    return <div className="card">Loading dashboard...</div>;
  }

  return (
    <div className="grid">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Dashboard</h2>
            <p className="muted" style={{ margin: 0 }}>
              Your calm control center — focus on what’s next.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" to="/job-seeker/profile">
              Edit profile
            </Link>
            <Link className="btn btn-primary" to="/job-seeker/jobs">
              Find jobs
            </Link>
          </div>
        </div>
      </div>

      {error ? <div className="card">{error}</div> : null}

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="label">Profile completion</div>
              <div style={{ fontWeight: 900, fontSize: 28 }}>{completion}%</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Aim for 80%+ to get better matches.
              </div>
            </div>
            <Link className="btn" to="/job-seeker/profile">
              Improve
            </Link>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="label">Resume readiness</div>
              <div style={{ fontWeight: 900, fontSize: 28 }}>{resumeReadyLabel}</div>
              <div className="muted" style={{ marginTop: 6 }}>
                {resumeHint}
              </div>
            </div>
            <Link className="btn" to="/job-seeker/profile">
              Manage
            </Link>
          </div>
        </div>
      </div>

      <details className="card">
        <summary style={{ cursor: "pointer", fontWeight: 900 }}>More activity</summary>
        <div className="grid grid-3" style={{ marginTop: 12 }}>
          <div>
            <div className="label">Unread notifications</div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{unreadNotifications}</div>
          </div>
          <div>
            <div className="label">Applications</div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{applications.length}</div>
          </div>
          <div>
            <div className="label">Saved jobs</div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{savedJobs.length}</div>
          </div>
          <div>
            <div className="label">Interviews</div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{interviewCalls}</div>
          </div>
        </div>
      </details>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Recent applications</h3>
            <Link to="/job-seeker/applied" className="btn">
              View all
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="muted" style={{ marginTop: 12 }}>
              No applications yet.
            </div>
          ) : (
            <div className="grid" style={{ marginTop: 12 }}>
              {recentApplications.map((a) => (
                <div key={a.id} className="card" style={{ padding: 12, display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900 }}>{a.job.title}</div>
                  <div className="muted">
                    {a.job.companyName} • {a.job.location}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <span className={a.status === "APPLIED" ? "badge" : "badge badge-accent"}>{a.status}</span>
                    <Link className="btn" to={`/job-seeker/jobs/${a.job.id}`}>
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Interview updates</h3>
            <Link to="/job-seeker/applied" className="btn">
              View status
            </Link>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="muted" style={{ marginTop: 12 }}>
              No interviews scheduled yet.
            </div>
          ) : (
            <div className="grid" style={{ marginTop: 12 }}>
              {upcomingInterviews.map((a) => (
                <div key={a.id} className="card" style={{ padding: 12, display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900 }}>{a.job.title}</div>
                  <div className="muted">
                    {a.job.companyName} • {a.job.location}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Interview: {a.interviewAt ? new Date(a.interviewAt).toLocaleString() : "Scheduled"}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <span className="badge badge-accent">INTERVIEW</span>
                    <Link className="btn" to={`/job-seeker/jobs/${a.job.id}`}>
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900 }}>Notifications</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {unreadNotifications === 0 ? "You’re all caught up." : `${unreadNotifications} unread update(s).`}
            </div>
          </div>
          <Link to="/job-seeker/notifications" className="btn">
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}
