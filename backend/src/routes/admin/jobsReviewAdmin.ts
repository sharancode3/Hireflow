import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../../middleware/auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../supabase";
import { HttpError } from "../../utils/httpError";

export const jobsReviewAdminRouter = Router();

const reviewActionSchema = z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]);

jobsReviewAdminRouter.patch("/admin/jobs/:jobId/review", requireAdmin(), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new HttpError(503, "Supabase is not configured on the backend");
    }

    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);
    const body = z.object({
      action: reviewActionSchema,
      feedback: z.string().trim().nullable().optional(),
    }).parse(req.body);

    const reviewStatus =
      body.action === "APPROVE"
        ? "APPROVED"
        : body.action === "REJECT"
        ? "REJECTED"
        : "NEEDS_REVISION";

    const normalizedFeedback = body.feedback?.trim() || null;
    if ((body.action === "REJECT" || body.action === "REQUEST_REVISION") && !normalizedFeedback) {
      throw new HttpError(400, "Feedback is required for this action");
    }

    const supabase = getSupabaseAdmin();

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id,title,recruiter_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) throw new HttpError(500, jobError.message);
    if (!job) throw new HttpError(404, "Job not found");

    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update({
        review_status: reviewStatus,
        admin_feedback: normalizedFeedback,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select("id,review_status,admin_feedback,reviewed_at")
      .single();

    if (updateError) throw new HttpError(500, updateError.message);

    const notificationTitle =
      reviewStatus === "APPROVED"
        ? "Your job posting was approved"
        : reviewStatus === "REJECTED"
        ? "Your job posting was rejected"
        : "Revision requested on your posting";

    const notificationMessage =
      reviewStatus === "APPROVED"
        ? `Your posting for ${job.title} has been approved and is now live on Hireflow.`
        : reviewStatus === "REJECTED"
        ? `Your posting for ${job.title} was not approved. Reason: ${normalizedFeedback}.`
        : `The admin has requested changes to your posting for ${job.title}. Notes: ${normalizedFeedback}.`;

    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: job.recruiter_id,
      type: "JOB_STATUS_UPDATE",
      message: notificationMessage,
      metadata: {
        title: notificationTitle,
        link: "/recruiter/listings",
        jobId: job.id,
        status: reviewStatus,
      },
    });

    if (notificationError) throw new HttpError(500, notificationError.message);

    res.json({
      job: {
        id: updatedJob.id,
        reviewStatus: updatedJob.review_status,
        adminFeedback: updatedJob.admin_feedback,
        reviewedAt: updatedJob.reviewed_at,
      },
    });
  } catch (err) {
    next(err);
  }
});
