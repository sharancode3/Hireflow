import type { ApplicationStatus } from "./adminData";
import type { RecruiterApprovalStatus } from "./adminData";

export type JobReviewStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_REVISION";

export function recruiterBadgeVariant(status: RecruiterApprovalStatus): "amber" | "green" | "red" {
  if (status === "APPROVED") return "green";
  if (status === "REJECTED") return "red";
  return "amber";
}

export function applicationBadgeVariant(status: ApplicationStatus): "blue" | "amber" | "red" | "green" {
  if (status === "SHORTLISTED" || status === "HIRED") return "green";
  if (status === "REJECTED") return "red";
  if (status === "INTERVIEW_SCHEDULED") return "blue";
  if (status === "OFFERED") return "amber";
  return "blue";
}

export function jobReviewBadgeVariant(status: JobReviewStatus): "amber" | "green" | "red" {
  if (status === "APPROVED") return "green";
  if (status === "REJECTED") return "red";
  return "amber";
}
