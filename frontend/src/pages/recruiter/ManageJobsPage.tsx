import { useEffect, useState } from "react";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { Job, JobType } from "../../types";
import { Link } from "react-router-dom";

function splitSkills(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

type EditState = {
  jobId: string;
  title: string;
  location: string;
  role: string;
  requiredSkills: string;
  jobType: JobType;
  minExperienceYears: number;
  description: string;
  openToFreshers: boolean;
};

export function RecruiterManageJobsPage() {
  const { token } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!token) return;
    const data = await apiJson<{ jobs: Job[] }>("/recruiter/jobs", { token });
    setJobs(data.jobs);
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
  }, [token]);

  async function remove(jobId: string) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson(`/recruiter/jobs/${jobId}`, { method: "DELETE", token });
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to delete job");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!token || !edit) return;
    setBusy(true);
    setError(null);

    try {
      await apiJson(`/recruiter/jobs/${edit.jobId}`, {
        method: "PATCH",
        token,
        body: {
          title: edit.title,
          location: edit.location,
          role: edit.role,
          requiredSkills: splitSkills(edit.requiredSkills),
          jobType: edit.jobType,
          minExperienceYears: edit.minExperienceYears,
          description: edit.description,
          openToFreshers: edit.openToFreshers,
        },
      });
      setEdit(null);
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to update job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Manage Jobs</h2>
        <p className="muted" style={{ margin: 0 }}>
          Update or remove job openings.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {jobs.length === 0 ? (
        <div className="card">No jobs posted yet.</div>
      ) : (
        <div className="grid">
          {jobs.map((job) => (
            <div key={job.id} className="card" style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{job.title}</div>
                  <div className="muted">
                    {job.companyName} • {job.location} • {job.role}
                  </div>
                </div>
                {job.openToFreshers ? <span className="badge badge-accent">Freshers</span> : null}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to={`/recruiter/applicants?jobId=${job.id}`} className="btn">
                  View applicants
                </Link>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    setEdit({
                      jobId: job.id,
                      title: job.title,
                      location: job.location,
                      role: job.role,
                      requiredSkills: job.requiredSkills.join(", "),
                      jobType: job.jobType,
                      minExperienceYears: job.minExperienceYears,
                      description: job.description,
                      openToFreshers: job.openToFreshers,
                    })
                  }
                >
                  Edit
                </button>
                <button type="button" className="btn" disabled={busy} onClick={() => void remove(job.id)}>
                  Delete
                </button>
              </div>

              {edit?.jobId === job.id ? (
                <div className="card" style={{ padding: 12 }}>
                  <div className="grid" style={{ gap: 10 }}>
                    <div className="grid grid-2" style={{ gap: 10 }}>
                      <div className="field">
                        <label className="label">Title</label>
                        <input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
                      </div>
                      <div className="field">
                        <label className="label">Location</label>
                        <input className="input" value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} />
                      </div>
                      <div className="field">
                        <label className="label">Role</label>
                        <input className="input" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })} />
                      </div>
                      <div className="field">
                        <label className="label">Skills</label>
                        <input className="input" value={edit.requiredSkills} onChange={(e) => setEdit({ ...edit, requiredSkills: e.target.value })} />
                      </div>

                      <div className="field">
                        <label className="label">Job type</label>
                        <select
                          className="select"
                          value={edit.jobType}
                          onChange={(e) => setEdit({ ...edit, jobType: e.target.value as JobType })}
                        >
                          <option value="FULL_TIME">Full-time</option>
                          <option value="INTERNSHIP">Internship</option>
                          <option value="CONTRACT">Contract</option>
                          <option value="PART_TIME">Part-time</option>
                        </select>
                      </div>

                      <div className="field">
                        <label className="label">Minimum experience (years)</label>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          max={60}
                          value={edit.minExperienceYears}
                          onChange={(e) => setEdit({ ...edit, minExperienceYears: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="label">Description</label>
                      <textarea className="textarea" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
                    </div>

                    <label className="badge badge-accent" style={{ width: "fit-content" }}>
                      <input type="checkbox" checked={edit.openToFreshers} onChange={(e) => setEdit({ ...edit, openToFreshers: e.target.checked })} />
                      Open to Freshers
                    </label>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void saveEdit()}>
                        Save changes
                      </button>
                      <button type="button" className="btn" disabled={busy} onClick={() => setEdit(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
