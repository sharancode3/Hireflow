import { useEffect, useState } from "react";
import { apiJson } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { ApplicationWithJob } from "../../types";

export function AppliedJobsPage() {
  const { token } = useAuth();
  const [apps, setApps] = useState<ApplicationWithJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        setError(null);
        const data = await apiJson<{ applications: ApplicationWithJob[] }>("/job-seeker/applications", { token });
        setApps(data.applications);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load applications");
      }
    })();
  }, [token]);

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Applied Jobs</h2>
        <p className="muted" style={{ margin: 0 }}>
          Track your application status.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {apps.length === 0 ? (
        <div className="card">No applications yet.</div>
      ) : (
        <div className="grid">
          {apps.map((a) => (
            <div key={a.id} className="card" style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{a.job.title}</div>
                  <div className="muted">
                    {a.job.companyName} • {a.job.location}
                  </div>
                </div>
                <span className={a.status === "APPLIED" ? "badge" : "badge badge-accent"}>{a.status}</span>
              </div>

              {a.interviewAt ? (
                <div className="muted">Interview: {new Date(a.interviewAt).toLocaleString()}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
