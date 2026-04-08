import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import {
  fetchRecruiters,
  type RecruiterApprovalStatus,
  type RecruiterItem,
  updateRecruiterStatus,
} from "../../admin/adminData";
import { useToast } from "../../components/ui/Toast";
import { recruiterBadgeVariant } from "../../admin/statusBadges";

const statuses: Array<"ALL" | RecruiterApprovalStatus> = ["ALL", "PENDING", "APPROVED", "REJECTED"];

export function RecruiterVerificationPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<RecruiterItem[]>([]);
  const [allRows, setAllRows] = useState<RecruiterItem[]>([]);
  const [status, setStatus] = useState<"ALL" | RecruiterApprovalStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [filteredData, allData] = await Promise.all([
        fetchRecruiters(status, search),
        fetchRecruiters("ALL", search),
      ]);
      setAllRows(allData);
      const data = status === "ALL" ? allData : filteredData;
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load recruiters");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  async function updateStatus(userId: string, nextStatus: RecruiterApprovalStatus) {
    setBusyUserId(userId);
    setError(null);
    try {
      await updateRecruiterStatus(userId, nextStatus);
      setAllRows((prev) =>
        prev.map((row) =>
          row.userId === userId
            ? { ...row, status: nextStatus, updatedAt: new Date().toISOString() }
            : row
        )
      );
      setRows((prev) => {
        const updated = prev
          .map((row) =>
            row.userId === userId
              ? { ...row, status: nextStatus, updatedAt: new Date().toISOString() }
              : row
          );
        return status === "ALL" ? updated : updated.filter((row) => row.status === status);
      });
      if (nextStatus === "APPROVED") toast("success", "Recruiter approved successfully");
      if (nextStatus === "REJECTED") toast("success", "Recruiter rejected");
      if (nextStatus === "PENDING") toast("success", "Recruiter marked as pending");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update recruiter status";
      setError(message);
      toast("error", "Could not update recruiter status. Please try again.");
    } finally {
      setBusyUserId(null);
    }
  }

  const statusCounts = useMemo(() => {
    return {
      ALL: allRows.length,
      PENDING: allRows.filter((r) => r.status === "PENDING").length,
      APPROVED: allRows.filter((r) => r.status === "APPROVED").length,
      REJECTED: allRows.filter((r) => r.status === "REJECTED").length,
    };
  }, [allRows]);

  return (
    <div className="space-y-6">
      <Card className="space-y-1">
        <h1 className="text-2xl font-semibold">Recruiter Verification</h1>
        <p className="text-sm text-text-secondary">Approve or reject recruiter accounts before they can post jobs.</p>
      </Card>

      {error ? <Card className="border-danger/60 bg-danger/10 text-danger">{error}</Card> : null}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs text-text-muted">Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item} ({statusCounts[item] ?? 0})
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[260px] flex-1">
            <label className="mb-1 block text-xs text-text-muted">Search</label>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name/email"
            />
          </div>
          <Button variant="secondary" onClick={() => void load()}>
            Search
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-sm text-text-secondary">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-text-secondary">No recruiters found.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.userId} className="rounded-xl border border-border bg-surface-raised p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-text">{row.fullName || "Unnamed recruiter"}</div>
                    <div className="text-xs text-text-secondary">{row.email}</div>
                    <div className="mt-1 text-xs text-text-muted">
                      {row.companyName} {row.designation !== "-" ? `- ${row.designation}` : ""}
                    </div>
                    <div className="text-xs text-text-muted">{row.website}</div>
                  </div>
                  <Badge variant={recruiterBadgeVariant(row.status)}>
                    {row.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    disabled={busyUserId === row.userId}
                    loading={busyUserId === row.userId}
                    onClick={() => void updateStatus(row.userId, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    disabled={busyUserId === row.userId}
                    loading={busyUserId === row.userId}
                    onClick={() => void updateStatus(row.userId, "REJECTED")}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busyUserId === row.userId}
                    loading={busyUserId === row.userId}
                    onClick={() => void updateStatus(row.userId, "PENDING")}
                  >
                    Mark Pending
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
