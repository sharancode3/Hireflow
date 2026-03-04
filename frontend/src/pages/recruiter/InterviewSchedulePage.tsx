import { useEffect, useState } from "react";
import { apiJson } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/PageSkeleton";

type Row = {
  applicationId: string;
  status: string;
  interviewAt: string | null;
  job: { id: string; title: string; companyName: string; location: string };
  candidate: { fullName: string; skills: string[]; experienceYears: number };
};

function IconCalendar() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="10" height="9" rx="1.5"/><path d="M5 1.5v2M9 1.5v2M2 6.5h10"/></svg>;
}

export function RecruiterInterviewSchedulePage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        setError(null);
        const data = await apiJson<{ applications: Row[] }>("/recruiter/applications?status=INTERVIEW_SCHEDULED", { token });
        setRows(data.applications);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load interviews");
      }
    })();
  }, [token]);

  if (rows === null && !error) return <TableSkeleton cols={4} rows={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Interview Schedule</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">All upcoming scheduled interviews.</p>
      </div>

      {error && <Card className="border-[var(--danger)]/30 p-4 text-sm text-[var(--danger)]">{error}</Card>}

      {rows && rows.length === 0 ? (
        <EmptyState
          title="No interviews scheduled"
          description="Schedule interviews from the Applicants page."
          icon={
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-60">
              <rect x="16" y="20" width="48" height="40" rx="6" stroke="var(--border-active)" strokeWidth="2" strokeDasharray="4 3" />
              <path d="M28 12v10M52 12v10M16 34h48" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="40" cy="50" r="5" stroke="var(--accent-purple)" strokeWidth="2" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3 stagger-list">
          {rows?.map((r) => (
            <Card key={r.applicationId} className="p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[var(--accent-purple)]/10 flex items-center justify-center text-xs font-bold text-[var(--accent-purple)]">
                    {r.candidate.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">{r.candidate.fullName}</div>
                    <div className="text-xs text-[var(--muted)]">{r.job.title} &middot; {r.job.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="purple">Interview</Badge>
                  {r.interviewAt && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <IconCalendar />
                      {new Date(r.interviewAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              {r.candidate.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.candidate.skills.slice(0, 6).map((s) => (
                    <span key={s} className="rounded-full bg-[var(--surface-raised)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{s}</span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
