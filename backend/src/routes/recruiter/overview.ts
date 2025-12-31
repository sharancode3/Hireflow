import { Router } from "express";
import { prisma } from "../../prisma";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const recruiterOverviewRouter = Router();

recruiterOverviewRouter.get("/recruiter/overview", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, recruiterProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const recruiterId = user.recruiterProfile.id;

    const jobsCount = await prisma.job.count({ where: { recruiterId } });

    const applications = await prisma.application.findMany({
      where: { job: { recruiterId } },
      select: { status: true },
    });

    type AppRow = (typeof applications)[number];
    const counts = applications.reduce<Record<string, number>>((acc: Record<string, number>, a: AppRow) => {
      acc.total = (acc.total ?? 0) + 1;
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, { total: 0 });

    res.json({
      overview: {
        jobsCount,
        applicationsTotal: counts.total,
        shortlisted: counts.SHORTLISTED ?? 0,
        rejected: counts.REJECTED ?? 0,
        interviews: counts.INTERVIEW_SCHEDULED ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});
