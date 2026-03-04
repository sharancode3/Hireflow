import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { Job, JobType, JobSeekerProfile } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Drawer } from "../../components/ui/Drawer";

type Props = {
  freshersOnly?: boolean;
};

function splitSkills(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function JobSeekerJobsPage({ freshersOnly }: Props) {
  const { token } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const [skills, setSkills] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [jobType, setJobType] = useState<JobType | "">("");
  const [minExp, setMinExp] = useState<string>("");
  const [showGuide, setShowGuide] = useState<boolean>(() => localStorage.getItem("talvion_js_guide_dismissed") !== "1");

  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const skillsCsv = useMemo(() => splitSkills(skills).join(","), [skills]);

  async function load() {
    if (!token) return;
    const query = new URLSearchParams();
    if (q.trim()) query.set("q", q.trim());
    if (skillsCsv) query.set("skills", skillsCsv);
    if (location) query.set("location", location);
    if (role) query.set("role", role);
    if (jobType) query.set("jobType", jobType);
    if (minExp.trim()) query.set("minExp", minExp.trim());
    if (freshersOnly) query.set("freshersOnly", "true");

    const data = await apiJson<{ jobs: Job[] }>(`/jobs?${query.toString()}`, { token });
    setJobs(data.jobs);

    const p = await apiJson<{ profile: JobSeekerProfile }>("/job-seeker/profile", { token });
    setProfile(p.profile);

    const saved = await apiJson<{ savedJobs: Array<{ job: Job }> }>("/job-seeker/saved-jobs", { token });
    setSavedJobIds(new Set(saved.savedJobs.map((s) => s.job.id)));
  }

  const profileSkills = useMemo(
    () => new Set((profile?.skills ?? []).map((s) => s.toLowerCase())),
    [profile],
  );

  function matchFor(job: Job) {
    const required = job.requiredSkills.map((s) => s.toLowerCase());
    if (required.length === 0) return { pct: 0, missing: [] as string[] };
    const hits = required.filter((s) => profileSkills.has(s)).length;
    const pct = Math.round((hits / required.length) * 100);
    const missing = job.requiredSkills.filter((s) => !profileSkills.has(s.toLowerCase()));
    return { pct, missing };
  }

  function openJob(job: Job) {
    setActiveJob(job);
    setDrawerOpen(true);
  }

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load jobs");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, freshersOnly]);

  async function onFilter(e: FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to filter jobs");
    }
  }

  async function apply(jobId: string) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson("/job-seeker/applications", { method: "POST", token, body: { jobId } });
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to apply");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave(jobId: string) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      if (savedJobIds.has(jobId)) {
        await apiJson(`/job-seeker/saved-jobs/${jobId}`, { method: "DELETE", token });
      } else {
        await apiJson("/job-seeker/saved-jobs", { method: "POST", token, body: { jobId } });
      }
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to update saved jobs");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{freshersOnly ? "Freshers" : "Jobs"}</h2>
          <p className="text-sm text-text-secondary">
            {freshersOnly
              ? "Open-to-freshers roles. Apply in one click when ready."
              : "Search across curated roles and move fast with a rich match view."}
          </p>
        </div>
        <Link to="/job-seeker/profile">
          <Button variant="secondary">Update skills</Button>
        </Link>
      </Card>

      {showGuide ? (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Getting started</div>
              <div className="text-xs text-text-muted">A quick checklist you can dismiss anytime.</div>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                localStorage.setItem("talvion_js_guide_dismissed", "1");
                setShowGuide(false);
              }}
            >
              Dismiss
            </Button>
          </div>

          <ol className="space-y-2 text-sm text-text-secondary">
            <li>
              Go to <Link to="/job-seeker/profile" className="text-text">Profile</Link> and update skills.
            </li>
            <li>Upload your resume inside the Profile page.</li>
            <li>Search, open a job, then apply in one click.</li>
            <li>
              Track status in <Link to="/job-seeker/applied" className="text-text">Applied Jobs</Link> and save jobs for later.
            </li>
          </ol>
        </Card>
      ) : null}

      {error ? <Card className="border-danger/60 bg-danger/10 text-danger">{error}</Card> : null}

      <form onSubmit={onFilter} className="space-y-4">
        <Card className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <label className="label">Job title or keywords</label>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g., Frontend Engineer, Data Analyst"
            />
          </div>
          <div className="flex-1">
            <label className="label">Location</label>
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Mumbai"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={busy}>
              Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setQ("");
                setLocation("");
                setRole("");
                setSkills("");
                setJobType("");
                setMinExp("");
                void load();
              }}
            >
              Reset
            </Button>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
          <Card className="space-y-4">
            <div className="text-sm font-semibold">Filters</div>
            <div className="space-y-3">
              <div className="field">
                <label className="label">Role</label>
                <input
                  className="input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Backend Developer"
                />
              </div>
              <div className="field">
                <label className="label">Skills (comma separated)</label>
                <input
                  className="input"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g., React, Node"
                />
              </div>
              <div className="field">
                <label className="label">Job type</label>
                <select className="select" value={jobType} onChange={(e) => setJobType(e.target.value as any)}>
                  <option value="">Any</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="PART_TIME">Part-time</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Max experience required (years)</label>
                <input
                  className="input"
                  value={minExp}
                  onChange={(e) => setMinExp(e.target.value)}
                  placeholder="e.g., 2"
                  inputMode="numeric"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={freshersOnly ?? false}
                  readOnly
                  className="h-4 w-4 rounded border-border"
                />
                Show only fresher-friendly roles
              </label>
            </div>
          </Card>

          <div className="space-y-4">
            {jobs.length === 0 ? (
              <Card>
                <div className="text-sm font-semibold">No jobs found</div>
                <div className="mt-2 text-xs text-text-muted">
                  Try clearing filters, or broaden your search.
                </div>
              </Card>
            ) : (
              jobs.map((job) => {
                const match = profile ? matchFor(job) : { pct: 0, missing: [] as string[] };
                return (
                  <Card key={job.id} className="card-hover space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">{job.title}</div>
                        <div className="text-sm text-text-secondary">
                          {job.companyName} · {job.location}
                        </div>
                        <div className="mt-2 text-xs text-text-muted">
                          {job.jobType.replace("_", " ")} · {job.minExperienceYears}+ yrs
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.openToFreshers ? <Badge variant="teal">Freshers</Badge> : null}
                        <Badge variant="blue">{job.requiredSkills.length} skills</Badge>
                        <button
                          type="button"
                          className="text-xs text-text-secondary hover:text-text"
                          onClick={() => void toggleSave(job.id)}
                          disabled={busy}
                        >
                          {savedJobIds.has(job.id) ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-text-muted">Skill match</div>
                      <div className="h-2 w-full rounded-full bg-border">
                        <div
                          className={
                            "h-2 rounded-full " +
                            (match.pct >= 70 ? "bg-accent-teal" : match.pct >= 40 ? "bg-accent-amber" : "bg-danger")
                          }
                          style={{ width: `${match.pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-text-secondary">{match.pct}% match</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.slice(0, 6).map((s) => (
                        <Badge key={s} variant="blue">
                          {s}
                        </Badge>
                      ))}
                      {job.requiredSkills.length > 6 ? (
                        <span className="text-xs text-text-muted">+{job.requiredSkills.length - 6} more</span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => openJob(job)}>
                        Details
                      </Button>
                      <Button type="button" variant="primary" disabled={busy} onClick={() => void apply(job.id)}>
                        Apply
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </form>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {activeJob ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-semibold">{activeJob.title}</div>
                <div className="text-sm text-text-secondary">
                  {activeJob.companyName} · {activeJob.location} · {activeJob.role}
                </div>
                <div className="mt-2 text-xs text-text-muted">
                  {activeJob.jobType.replace("_", " ")} · {activeJob.minExperienceYears}+ yrs
                </div>
              </div>
              {activeJob.openToFreshers ? <Badge variant="teal">Freshers</Badge> : null}
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Required skills</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeJob.requiredSkills.map((s) => (
                  <Badge key={s} variant="blue">{s}</Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Description</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{activeJob.description}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary" disabled={busy} onClick={() => void apply(activeJob.id)}>
                Quick apply
              </Button>
              <Button type="button" variant="secondary" onClick={() => void toggleSave(activeJob.id)} disabled={busy}>
                {savedJobIds.has(activeJob.id) ? "Unsave" : "Save"}
              </Button>
              <Link to={`/job-seeker/jobs/${activeJob.id}`}>
                <Button type="button" variant="ghost">Open full page</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
