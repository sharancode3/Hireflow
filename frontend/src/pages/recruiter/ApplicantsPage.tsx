import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiJson, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { openResumePreview } from "../../utils/resumePreview";
import type { Job } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/PageSkeleton";

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

const STATUS_BADGE: Record<string, { variant: "blue" | "teal" | "purple" | "amber" | "red"; label: string }> = {
  APPLIED: { variant: "blue", label: "Applied" },
  SHORTLISTED: { variant: "teal", label: "Shortlisted" },
  INTERVIEW_SCHEDULED: { variant: "purple", label: "Interview" },
  OFFERED: { variant: "amber", label: "Offered" },
  REJECTED: { variant: "red", label: "Rejected" },
  HIRED: { variant: "teal", label: "Hired" },
};

export function RecruiterApplicantsPage() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const selectedJobId = params.get("jobId") ?? "";
  const [skill, setSkill] = useState("");
  const [rows, setRows] = useState<ApplicantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, string>>({});

  const jobOptions = useMemo(() => jobs.map((j) => ({ id: j.id, label: `${j.title} (${j.location})` })), [jobs]);

  async function loadJobs() {
    if (!token) return;
    const data = await apiJson<{ jobs: Job[] }>("/recruiter/jobs", { token });
    setJobs(data.jobs);
  }

  async function loadApplicants(jobId: string) {
    if (!token || !jobId) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (skill.trim()) qs.set("skill", skill.trim());
    const data = await apiJson<{ applicants: ApplicantRow[] }>(`/recruiter/jobs/${jobId}/applicants?${qs.toString()}`, { token });
    setRows(data.applicants);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      if (!token) return;
      try { setError(null); await loadJobs(); } catch (e) { setError(e instanceof Error ? e.message : "Failed to load jobs"); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    (async () => {
      if (!selectedJobId) return;
      try { setError(null); await loadApplicants(selectedJobId); } catch (e) { setError(e instanceof Error ? e.message : "Failed to load applicants"); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, token]);

  async function updateStatus(applicationId: string, status: string, interviewAt?: string | null) {
    if (!token) return;
    setBusy(true); setError(null);
    try {
      const body: { status: string; interviewAt?: string | null } = { status };
      if (interviewAt !== undefined) body.interviewAt = interviewAt;
      await apiJson(`/recruiter/applications/${applicationId}`, { method: "PATCH", token, body });
      if (selectedJobId) await loadApplicants(selectedJobId);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Failed to update status");
    } finally { setBusy(false); }
  }

  const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Applicants</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Review candidates, shortlist, reject, or schedule interviews.</p>
      </div>

      {error && <Card className="border-[var(--danger)]/30 p-4 text-sm text-[var(--danger)]">{error}</Card>}

      {/* Filters */}
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-3 items-end">
          <div>
            <label className="text-xs font-medium text-[var(--muted)] mb-1.5 block">Job</label>
            <select
              className={inputCls}
              value={selectedJobId}
              onChange={(e) => setParams((prev) => { prev.set("jobId", e.target.value); return prev; })}
            >
              <option value="">Select a job</option>
              {jobOptions.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted)] mb-1.5 block">Filter by Skill</label>
            <input className={inputCls} value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="e.g. React" />
          </div>
          <Button variant="primary" disabled={!selectedJobId || busy} onClick={() => void loadApplicants(selectedJobId)} className="h-10">
            Apply Filter
          </Button>
        </div>
      </Card>

      {/* Results */}
      {!selectedJobId ? (
        <EmptyState title="Select a job" description="Choose a job from the dropdown above to view applicants." />
      ) : loading ? (
        <TableSkeleton cols={5} rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState title="No applicants yet" description="No one has applied to this position yet." />
      ) : (
        <div className="space-y-3 stagger-list">
          {rows.map((r) => {
            const sb = STATUS_BADGE[r.status] ?? { variant: "blue" as const, label: r.status };
            return (
              <Card key={r.applicationId} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Candidate info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                        {r.candidate.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)]">{r.candidate.fullName}</div>
                        <div className="text-xs text-[var(--muted)]">{r.candidate.experienceYears} yrs experience</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.candidate.skills.slice(0, 6).map((s) => (
                        <span key={s} className="rounded-full bg-[var(--surface-raised)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <Badge variant={sb.variant}>{sb.label}</Badge>
                    {r.interviewAt && <div className="text-[10px] text-[var(--muted)]">{new Date(r.interviewAt).toLocaleString()}</div>}
                    <div className="flex gap-2 flex-wrap">
                      {r.candidate.latestResume ? (
                        <Button variant="ghost" className="text-xs" onClick={() => void openResumePreview(r.candidate.latestResume!.id, token!)}>Resume</Button>
                      ) : <span className="text-xs text-[var(--muted)]">No resume</span>}
                      <Button variant="secondary" className="text-xs" disabled={busy} onClick={() => void updateStatus(r.applicationId, "SHORTLISTED")}>Shortlist</Button>
                      <Button variant="danger" className="text-xs" disabled={busy} onClick={() => void updateStatus(r.applicationId, "REJECTED")}>Reject</Button>
                    </div>
                    {/* Schedule interview */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        type="datetime-local"
                        className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] min-w-0"
                        value={schedule[r.applicationId] ?? ""}
                        onChange={(e) => setSchedule({ ...schedule, [r.applicationId]: e.target.value })}
                      />
                      <Button
                        variant="secondary"
                        className="text-xs"
                        disabled={busy || !(schedule[r.applicationId] ?? "")}
                        onClick={() => void updateStatus(r.applicationId, "INTERVIEW_SCHEDULED", new Date(schedule[r.applicationId]).toISOString())}
                      >
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
