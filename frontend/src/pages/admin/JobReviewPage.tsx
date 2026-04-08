import { useEffect, useMemo, useState } from "react";
import { fetchReviewJobs, reviewJob, type ReviewJobItem } from "../../admin/adminData";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { jobReviewBadgeVariant } from "../../admin/statusBadges";

type ReviewFilter = "ALL" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_REVISION";

function statusBadge(status: ReviewJobItem["reviewStatus"]) {
  if (status === "NEEDS_REVISION") return <Badge variant={jobReviewBadgeVariant(status)}>Revision Requested</Badge>;
  if (status === "PENDING_REVIEW") return <Badge variant={jobReviewBadgeVariant(status)}>Pending Review</Badge>;
  return <Badge variant={jobReviewBadgeVariant(status)}>{status === "APPROVED" ? "Approved" : "Rejected"}</Badge>;
}

export function AdminJobReviewPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<ReviewJobItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<{ jobId: string; action: "REJECT" | "REQUEST_REVISION" } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [filter, setFilter] = useState<ReviewFilter>("PENDING_REVIEW");

  async function load() {
    const data = await fetchReviewJobs();
    setJobs(data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(jobId: string, action: "APPROVE" | "REJECT" | "REQUEST_REVISION", note?: string) {
    setBusy(true);
    setError(null);
    try {
      await reviewJob(jobId, action, note);
      setModal(null);
      setFeedback("");
      const nextStatus: ReviewJobItem["reviewStatus"] =
        action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "NEEDS_REVISION";
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                reviewStatus: nextStatus,
                adminFeedback: note?.trim() || null,
                reviewedAt: new Date().toISOString(),
              }
            : job
        )
      );
      toast("success", action === "APPROVE" ? "Job approved" : action === "REJECT" ? "Job rejected" : "Revision requested");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to submit review action";
      setError(message);
      toast("error", "Could not submit review action. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const filteredJobs = useMemo(
    () => (filter === "ALL" ? jobs : jobs.filter((job) => job.reviewStatus === filter)),
    [jobs, filter]
  );

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-semibold">Admin Job Review</h1>
        <p className="text-sm text-text-secondary">Review queue for recruiter postings.</p>
      </Card>

      {error ? <Card className="border-danger/50 bg-danger/10 text-danger">{error}</Card> : null}

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="mb-1 block text-xs text-text-muted">Status</label>
            <select className="select" value={filter} onChange={(e) => setFilter(e.target.value as ReviewFilter)}>
              <option value="ALL">All</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_REVISION">Revision Requested</option>
            </select>
          </div>
        </div>
      </Card>

      {filteredJobs.length === 0 ? (
        <Card>No jobs in review queue.</Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{job.title}</div>
                  <div className="text-xs text-text-secondary">{job.companyName} · {job.location} · {job.role}</div>
                  <div className="text-xs text-text-muted">Recruiter: {job.recruiter.email}</div>
                </div>
                {statusBadge(job.reviewStatus)}
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{job.description}</p>
              {job.adminFeedback ? <div className="text-xs text-amber-300">Feedback: {job.adminFeedback}</div> : null}
              <div className="flex flex-wrap gap-2">
                <Button loading={busy} variant="primary" disabled={busy} onClick={() => void review(job.id, "APPROVE")}>Approve</Button>
                <Button loading={busy} variant="danger" disabled={busy} onClick={() => setModal({ jobId: job.id, action: "REJECT" })}>Reject</Button>
                <Button loading={busy} variant="secondary" disabled={busy} onClick={() => setModal({ jobId: job.id, action: "REQUEST_REVISION" })}>Request Revision</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)}>
        {modal ? (
          <div className="space-y-3 bg-[#12121A] p-8 min-w-[480px] -mt-24">
            <h3 className="text-lg font-semibold">{modal.action === "REJECT" ? "Reject this job posting" : "Request Revision"}</h3>
            <p className="text-sm text-text-secondary">Feedback is required.</p>
            <textarea
              className="input min-h-[120px]"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Explain the reason and what to fix."
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant={modal.action === "REJECT" ? "danger" : "primary"}
                loading={busy}
                disabled={busy || feedback.trim().length < 10}
                onClick={() => void review(modal.jobId, modal.action, feedback.trim())}
              >
                {modal.action === "REJECT" ? "Confirm Reject" : "Send Request"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
