import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { openResumePreview } from "../../utils/resumePreview";
import type { Job } from "../../types";

type ApplicantRow = {
  applicationId: string;
  status: string;
  interviewAt: string | null;
  candidate: {
    id: string;
    fullName: string;
    skills: string[];
    experienceYears: number;
    latestResume: { id: string; originalName: string } | null;
  };
};

export function RecruiterApplicantsPage() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const selectedJobId = params.get("jobId") ?? "";

  const [skill, setSkill] = useState<string>("");
  const [rows, setRows] = useState<ApplicantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, string>>({});

  const jobOptions = useMemo(() => jobs.map((j) => ({ id: j.id, label: `${j.title} (${j.location})` })), [jobs]);

  async function loadJobs() {
    if (!token) return;
    const data = await apiJson<{ jobs: Job[] }>("/recruiter/jobs", { token });
    setJobs(data.jobs);
  }

  async function loadApplicants(jobId: string) {
    if (!token || !jobId) return;
    const qs = new URLSearchParams();
    if (skill.trim()) qs.set("skill", skill.trim());
    const data = await apiJson<{ applicants: ApplicantRow[] }>(`/recruiter/jobs/${jobId}/applicants?${qs.toString()}`, {
      token,
    });
    setRows(data.applicants);
  }

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        setError(null);
        await loadJobs();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load jobs");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    (async () => {
      if (!selectedJobId) return;
      try {
        setError(null);
        await loadApplicants(selectedJobId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load applicants");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, token]);

  async function updateStatus(applicationId: string, status: string, interviewAt?: string | null) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const body: { status: string; interviewAt?: string | null } = { status };
      if (interviewAt !== undefined) body.interviewAt = interviewAt;
      await apiJson(`/recruiter/applications/${applicationId}`, {
        method: "PATCH",
        token,
        body,
      });
      if (selectedJobId) await loadApplicants(selectedJobId);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Applicants</h2>
        <p className="muted" style={{ margin: 0 }}>
          View applicant details, filter by skills, shortlist/reject, and schedule interviews.
        </p>
      </div>

      {error ? <div className="card">{error}</div> : null}

      <div className="card grid" style={{ gap: 12 }}>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label className="label">Job</label>
            <select
              className="select"
              value={selectedJobId}
              onChange={(e) => setParams((prev) => {
                prev.set("jobId", e.target.value);
                return prev;
              })}
            >
              <option value="">Select a job</option>
              {jobOptions.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Filter by skill</label>
            <input
              className="input"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g., react"
            />
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!selectedJobId || busy}
          onClick={() => void loadApplicants(selectedJobId)}
        >
          Apply
        </button>
      </div>

      {!selectedJobId ? (
        <div className="card">Select a job to view applicants.</div>
      ) : rows.length === 0 ? (
        <div className="card">No applicants yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Skills</th>
                <th>Experience</th>
                <th>Resume</th>
                <th>Status</th>
                <th>Actions</th>
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
                        disabled={busy}
                        onClick={() => void openResumePreview(r.candidate.latestResume!.id, token!)}
                      >
                        View
                      </button>
                    ) : (
                      <span className="muted">No resume</span>
                    )}
                  </td>
                  <td>
                    <span className={r.status === "APPLIED" ? "badge" : "badge badge-accent"}>{r.status}</span>
                    {r.interviewAt ? (
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        {new Date(r.interviewAt).toLocaleString()}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn"
                          disabled={busy}
                          onClick={() => void updateStatus(r.applicationId, "SHORTLISTED")}
                        >
                          Shortlist
                        </button>
                        <button
                          type="button"
                          className="btn"
                          disabled={busy}
                          onClick={() => void updateStatus(r.applicationId, "REJECTED")}
                        >
                          Reject
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input
                          className="input"
                          type="datetime-local"
                          value={schedule[r.applicationId] ?? ""}
                          onChange={(e) => setSchedule({ ...schedule, [r.applicationId]: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn"
                          disabled={busy || !(schedule[r.applicationId] ?? "")}
                          onClick={() => void updateStatus(r.applicationId, "INTERVIEW_SCHEDULED", new Date(schedule[r.applicationId]).toISOString())}
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
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
