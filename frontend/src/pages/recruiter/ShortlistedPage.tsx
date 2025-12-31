import { useEffect, useState } from "react";
import { apiJson } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { openResumePreview } from "../../utils/resumePreview";

type Row = {
  applicationId: string;
  status: string;
  interviewAt: string | null;
  job: { id: string; title: string; companyName: string; location: string };
  candidate: {
    fullName: string;
    skills: string[];
    experienceYears: number;
    latestResume: { id: string; originalName: string } | null;
  };
};

export function RecruiterShortlistedPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        setError(null);
        const data = await apiJson<{ applications: Row[] }>("/recruiter/applications?status=SHORTLISTED", { token });
        setRows(data.applications);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load shortlisted" );
      }
    })();
  }, [token]);

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Shortlisted</h2>
        <p className="muted" style={{ margin: 0 }}>
          Candidates you shortlisted.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {rows.length === 0 ? (
        <div className="card">No shortlisted candidates yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Skills</th>
                <th>Experience</th>
                <th>Resume</th>
                <th>Job</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.applicationId}>
                  <td style={{ fontWeight: 800 }}>{r.candidate.fullName}</td>
                  <td className="muted">{r.candidate.skills.join(", ")}</td>
                  <td className="muted">{r.candidate.experienceYears} yrs</td>
                  <td>
                    {r.candidate.latestResume ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => void openResumePreview(r.candidate.latestResume!.id, token!)}
                      >
                        View
                      </button>
                    ) : (
                      <span className="muted">No resume</span>
                    )}
                  </td>
                  <td className="muted">
                    {r.job.title} • {r.job.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
