import { useEffect, useState } from "react";
import { apiJson } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

type Row = {
  applicationId: string;
  status: string;
  interviewAt: string | null;
  job: { id: string; title: string; companyName: string; location: string };
  candidate: { fullName: string; skills: string[]; experienceYears: number };
};

export function RecruiterInterviewSchedulePage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        setError(null);
        const data = await apiJson<{ applications: Row[] }>("/recruiter/applications?status=INTERVIEW_SCHEDULED", {
          token,
        });
        setRows(data.applications);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load interviews");
      }
    })();
  }, [token]);

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Interview Schedule</h2>
        <p className="muted" style={{ margin: 0 }}>
          Scheduled interviews.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {rows.length === 0 ? (
        <div className="card">No interviews scheduled yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job</th>
                <th>Time</th>
                <th>Skills</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.applicationId}>
                  <td style={{ fontWeight: 800 }}>{r.candidate.fullName}</td>
                  <td className="muted">
                    {r.job.title} • {r.job.location}
                  </td>
                  <td className="muted">{r.interviewAt ? new Date(r.interviewAt).toLocaleString() : "—"}</td>
                  <td className="muted">{r.candidate.skills.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
