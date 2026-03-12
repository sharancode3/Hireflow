import { Router } from "express";
import { z } from "zod";
import { Job } from "../../models/Job";
import { Notification } from "../../models/Notification";
import { RecruiterProfile } from "../../models/RecruiterProfile";

export const adminJobReviewRouter = Router();

adminJobReviewRouter.get("/job-review", async (req, res, next) => {
  try {
    const query = z.object({
      status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED", "NEEDS_REVISION"]).optional(),
    }).parse(req.query);

    const filter = query.status ? { reviewStatus: query.status } : {};
    const jobs = await Job.find(filter).sort({ updatedAt: -1 });

    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

adminJobReviewRouter.patch("/job-review/:jobId", async (req, res, next) => {
  try {
    const { jobId } = z.object({ jobId: z.string().min(1) }).parse(req.params);
    const body = z.object({
      action: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]),
      feedback: z.string().trim().optional(),
    }).parse(req.body);

    if ((body.action === "REJECT" || body.action === "REQUEST_REVISION") && !body.feedback) {
      return res.status(400).json({ message: "Feedback required" });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const status = body.action === "APPROVE" ? "APPROVED"
      : body.action === "REJECT" ? "REJECTED" : "NEEDS_REVISION";

    const updated = await Job.findByIdAndUpdate(jobId, {
      $set: { reviewStatus: status, adminFeedback: body.feedback ?? null, reviewedAt: new Date() },
    }, { new: true });

    const recruiter = await RecruiterProfile.findById(job.recruiterId).populate<{ userId: { _id: string; email: string } }>("userId");
    if (recruiter) {
      await Notification.create({
        userId: recruiter.userId._id,
        type: "JOB_REVIEW",
        message: status === "APPROVED"
          ? `Your job \"${job.title}\" was approved.`
          : `Job \"${job.title}\" status: ${status}. ${body.feedback ?? ""}`,
      });
    }

    res.json({ job: updated });
  } catch (err) {
    next(err);
  }
});
