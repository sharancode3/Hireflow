import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { Job } from "../../types";

export function SavedJobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    const saved = await apiJson<{ savedJobs: Array<{ job: Job }> }>("/job-seeker/saved-jobs", { token });
    setJobs(saved.savedJobs.map((s) => s.job));
  }

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load saved jobs");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function remove(jobId: string) {
    if (!token) return;
    await apiJson(`/job-seeker/saved-jobs/${jobId}`, { method: "DELETE", token });
    await load();
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Saved Jobs</h2>
        <p className="muted" style={{ margin: 0 }}>
          Jobs you saved for later.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {jobs.length === 0 ? (
        <div className="card">No saved jobs yet.</div>
      ) : (
        <div className="grid">
          {jobs.map((job) => (
            <div key={job.id} className="card" style={{ display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 900 }}>{job.title}</div>
                <div className="muted">
                  {job.companyName} • {job.location}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to={`/job-seeker/jobs/${job.id}`} className="btn">
                  Details
                </Link>
                <button type="button" className="btn" onClick={() => void remove(job.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
