import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { Job, JobType, JobSeekerProfile } from "../../types";

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
    <div className="grid">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>{freshersOnly ? "Freshers" : "Jobs"}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {freshersOnly
                ? "Open-to-freshers roles. Apply in one click when ready."
                : "Find a role fast — keep filters minimal, expand when needed."}
            </p>
          </div>
          <Link className="btn" to="/job-seeker/profile">
            Update skills
          </Link>
        </div>
      </div>

      {showGuide ? (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900 }}>Getting started (demo)</div>
              <div className="muted">A quick, calm checklist — you can dismiss this anytime.</div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                localStorage.setItem("talvion_js_guide_dismissed", "1");
                setShowGuide(false);
              }}
            >
              Dismiss
            </button>
          </div>

          <ol className="muted" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            <li>
              Go to <Link to="/job-seeker/profile">Profile</Link> and update skills.
            </li>
            <li>Upload your resume inside the Profile page.</li>
            <li>Search, open a job, then apply in one click.</li>
            <li>
              Track status in <Link to="/job-seeker/applied">Applied Jobs</Link> and save jobs for later.
            </li>
          </ol>
        </div>
      ) : null}

      {error ? <div className="card">{error}</div> : null}

      <form onSubmit={onFilter} className="card grid" style={{ gap: 12 }}>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label className="label">Search (job / company)</label>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g., Frontend, BlueWave"
            />
          </div>
          <div className="field">
            <label className="label">Location</label>
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Mumbai"
            />
          </div>
        </div>

        <details>
          <summary style={{ cursor: "pointer", fontWeight: 900 }}>Advanced filters</summary>
          <div className="grid grid-2" style={{ gap: 12, marginTop: 12 }}>
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
          </div>
        </details>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Search
          </button>
          <button
            type="button"
            className="btn"
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
          </button>
        </div>
      </form>

      {jobs.length === 0 ? (
        <div className="card">
          <div style={{ fontWeight: 900 }}>No jobs found</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Try clearing advanced filters, or broaden your search.
          </div>
        </div>
      ) : (
        <div className="grid">
          {jobs.map((job) => (
            <div key={job.id} className="card" style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{job.title}</div>
                  <div className="muted">
                    {job.companyName} • {job.location}
                  </div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                    {job.jobType.replace("_", " ")} • {job.minExperienceYears}+ yrs
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {job.openToFreshers ? <span className="badge badge-accent">Freshers</span> : null}
                  <span className="badge">{job.requiredSkills.length} skills</span>
                </div>
              </div>

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 800 }}>Details</summary>
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                  {profile ? (() => {
                    const m = matchFor(job);
                    return (
                      <div className="card card-ghost" style={{ padding: 12 }}>
                        <div className="label">Job match</div>
                        <div style={{ fontWeight: 900, fontSize: 18 }}>{m.pct}%</div>
                        {m.missing.length ? (
                          <div className="muted" style={{ marginTop: 6 }}>
                            Skill gaps: {m.missing.slice(0, 5).join(", ")}
                            {m.missing.length > 5 ? "…" : ""}
                          </div>
                        ) : (
                          <div className="muted" style={{ marginTop: 6 }}>Strong match based on your profile skills.</div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="muted">Update your profile skills to see match percentage.</div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {job.requiredSkills.map((s) => (
                      <span key={s} className="badge">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </details>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to={`/job-seeker/jobs/${job.id}`} className="btn">
                  Details
                </Link>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void apply(job.id)}>
                  Apply
                </button>
                <button type="button" className="btn" disabled={busy} onClick={() => void toggleSave(job.id)}>
                  {savedJobIds.has(job.id) ? "Unsave" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
