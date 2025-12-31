import { useEffect, useState } from "react";
import { apiJson } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Link } from "react-router-dom";

type Overview = {
  jobsCount: number;
  applicationsTotal: number;
  shortlisted: number;
  rejected: number;
  interviews: number;
};

export function RecruiterOverviewPage() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(() => localStorage.getItem("talvion_rec_guide_dismissed") !== "1");

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        setError(null);
        const data = await apiJson<{ overview: Overview }>("/recruiter/overview", { token });
        setOverview(data.overview);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load overview");
      }
    })();
  }, [token]);

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Recruiter Overview</h2>
        <p className="muted" style={{ margin: 0 }}>
          Quick summary of your hiring workflow.
        </p>
      </div>

      {showGuide ? (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900 }}>Getting started (demo)</div>
              <div className="muted">A guided flow to show the full recruiter workflow.</div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                localStorage.setItem("talvion_rec_guide_dismissed", "1");
                setShowGuide(false);
              }}
            >
              Dismiss
            </button>
          </div>

          <ol className="muted" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            <li>
              Complete <Link to="/recruiter/profile">Company Profile</Link>.
            </li>
            <li>
              Post a job in <Link to="/recruiter/post-job">Post Job</Link>.
            </li>
            <li>
              Open <Link to="/recruiter/applicants">View Applicants</Link>, filter by skill, then Shortlist.
            </li>
            <li>
              Schedule interviews in <Link to="/recruiter/interviews">Interview Schedule</Link>.
            </li>
          </ol>
        </div>
      ) : null}

      {error ? <div className="card">{error}</div> : null}

      {!overview ? (
        <div className="card">Loading...</div>
      ) : (
        <div className="grid grid-2">
          <div className="card">
            <div className="label">Job posts</div>
            <div style={{ fontWeight: 900, fontSize: 24 }}>{overview.jobsCount}</div>
          </div>
          <div className="card">
            <div className="label">Total applicants</div>
            <div style={{ fontWeight: 900, fontSize: 24 }}>{overview.applicationsTotal}</div>
          </div>
          <div className="card">
            <div className="label">Shortlisted</div>
            <div style={{ fontWeight: 900, fontSize: 24 }}>{overview.shortlisted}</div>
          </div>
          <div className="card">
            <div className="label">Interviews scheduled</div>
            <div style={{ fontWeight: 900, fontSize: 24 }}>{overview.interviews}</div>
          </div>
        </div>
      )}
    </div>
  );
}
