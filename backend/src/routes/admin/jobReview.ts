import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma";
import { sendTransactionalEmail } from "../../utils/emailAutomation";

export const adminJobReviewRouter = Router();

adminJobReviewRouter.get("/admin/job-review", async (req, res, next) => {
  try {
    const query = z
      .object({
        status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED", "NEEDS_REVISION"]).optional(),
      })
      .parse(req.query);

    const where = query.status ? { reviewStatus: query.status } : {};

    const jobs = await prisma.job.findMany({
      where,
      include: {
        recruiter: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    res.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        role: job.role,
        description: job.description,
        reviewStatus: job.reviewStatus,
        adminFeedback: job.adminFeedback,
        reviewedAt: job.reviewedAt,
        createdAt: job.createdAt,
        recruiter: {
          companyName: job.recruiter.companyName,
          email: job.recruiter.user.email,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
});

adminJobReviewRouter.patch("/admin/job-review/:jobId", async (req, res, next) => {
  try {
    const params = z.object({ jobId: z.string().min(1) }).parse(req.params);
    const body = z
      .object({
        action: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]),
        feedback: z.string().trim().optional(),
      })
      .parse(req.body);

    if ((body.action === "REJECT" || body.action === "REQUEST_REVISION") && !body.feedback) {
      return res.status(400).json({ message: "Feedback is required for reject or revision requests" });
    }

    const existing = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        recruiter: {
          include: {
            user: { select: { email: true, id: true } },
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Job not found" });
    }

    const status =
      body.action === "APPROVE"
        ? "APPROVED"
        : body.action === "REJECT"
          ? "REJECTED"
          : "NEEDS_REVISION";

    const updated = await prisma.job.update({
      where: { id: existing.id },
      data: {
        reviewStatus: status,
        adminFeedback: body.feedback ?? null,
        reviewedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: existing.recruiter.user.id,
        type: "JOB_REVIEW",
        message:
          status === "APPROVED"
            ? `Your job \"${existing.title}\" was approved.`
            : status === "REJECTED"
              ? `Your job \"${existing.title}\" was rejected. ${body.feedback ?? ""}`
              : `Revision requested for \"${existing.title}\". ${body.feedback ?? ""}`,
      },
    });

    await sendTransactionalEmail({
      to: existing.recruiter.user.email,
      category: "JOB_POSTED",
      subject: `Job Review Update: ${existing.title}`,
      text: [
        `Status: ${status}`,
        body.feedback ? `Feedback: ${body.feedback}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    res.json({
      job: updated,
    });
  } catch (err) {
    next(err);
  }
});
