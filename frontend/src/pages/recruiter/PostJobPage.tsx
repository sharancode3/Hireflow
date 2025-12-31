import { useState } from "react";
import type { FormEvent } from "react";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { Job, JobType } from "../../types";

function splitSkills(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function RecruiterPostJobPage() {
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [openToFreshers, setOpenToFreshers] = useState(false);
  const [jobType, setJobType] = useState<JobType>("FULL_TIME");
  const [minExperienceYears, setMinExperienceYears] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createdJob, setCreatedJob] = useState<Job | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setBusy(true);
    setError(null);
    setCreatedJob(null);

    try {
      const data = await apiJson<{ job: Job }>("/recruiter/jobs", {
        method: "POST",
        token,
        body: {
          title,
          location,
          role,
          requiredSkills: splitSkills(skills),
          jobType,
          minExperienceYears,
          description,
          openToFreshers,
        },
      });

      setCreatedJob(data.job);
      setTitle("");
      setLocation("");
      setRole("");
      setSkills("");
      setDescription("");
      setOpenToFreshers(false);
      setJobType("FULL_TIME");
      setMinExperienceYears(0);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to post job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Post Job</h2>
        <p className="muted" style={{ margin: 0 }}>
          Create a new job opening.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {createdJob ? (
        <div className="card">
          <span className="badge badge-accent">Posted</span>
          <div style={{ fontWeight: 900, marginTop: 8 }}>{createdJob.title}</div>
          <div className="muted">
            {createdJob.companyName} • {createdJob.location}
          </div>
        </div>
      ) : null}

      <form className="card grid" onSubmit={onSubmit}>
        <div className="grid grid-2">
          <div className="field">
            <label className="label">Job title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Location</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Role</label>
            <input className="input" value={role} onChange={(e) => setRole(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Required skills (comma separated)</label>
            <input className="input" value={skills} onChange={(e) => setSkills(e.target.value)} required />
          </div>

          <div className="field">
            <label className="label">Job type</label>
            <select className="select" value={jobType} onChange={(e) => setJobType(e.target.value as JobType)}>
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
              value={minExperienceYears}
              onChange={(e) => setMinExperienceYears(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Description</label>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Clear job details..."
          />
        </div>

        <label className="badge badge-accent" style={{ width: "fit-content" }}>
          <input
            type="checkbox"
            checked={openToFreshers}
            onChange={(e) => setOpenToFreshers(e.target.checked)}
          />
          Open to Freshers
        </label>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Posting..." : "Post job"}
        </button>
      </form>
    </div>
  );
}
