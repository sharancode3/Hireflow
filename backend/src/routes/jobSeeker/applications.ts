import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";
import { csvToSkills } from "../../utils/csvSkills";

export const jobSeekerApplicationsRouter = Router();

jobSeekerApplicationsRouter.post("/job-seeker/applications", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const body = z.object({ jobId: z.string().min(1) }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, jobSeekerProfile: { select: { id: true, userId: true, fullName: true } } },
    });

    if (!user || user.role !== "JOB_SEEKER" || !user.jobSeekerProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const job = await prisma.job.findUnique({ where: { id: body.jobId } });
    if (!job) throw new HttpError(404, "Job not found");

    const app = await prisma.application.create({
      data: {
        jobId: body.jobId,
        jobSeekerId: user.jobSeekerProfile.id,
      },
    }).catch(() => {
      throw new HttpError(409, "Already applied");
    });

    // Notify job seeker
    await prisma.notification.create({
      data: {
        userId: authed.auth.userId,
        type: "APPLICATION",
        message: `Applied to ${job.title} at ${job.companyName}`,
      },
    });

    // Notify recruiter
    const recruiterUser = await prisma.recruiterProfile.findUnique({
      where: { id: job.recruiterId },
      select: { userId: true },
    });
    if (recruiterUser) {
      await prisma.notification.create({
        data: {
          userId: recruiterUser.userId,
          type: "APPLICANT",
          message: `${user.jobSeekerProfile.fullName} applied to ${job.title}`,
        },
      });
    }

    res.status(201).json({ application: app });
  } catch (err) {
    next(err);
  }
});

jobSeekerApplicationsRouter.get("/job-seeker/applications", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, jobSeekerProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "JOB_SEEKER" || !user.jobSeekerProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const applications = await prisma.application.findMany({
      where: { jobSeekerId: user.jobSeekerProfile.id },
      include: { job: true },
      orderBy: { createdAt: "desc" },
    });

    type AppRow = (typeof applications)[number];

    res.json({
      applications: applications.map((a: AppRow) => ({
        ...a,
        job: { ...a.job, requiredSkills: csvToSkills(a.job.requiredSkillsCsv) },
      })),
    });
  } catch (err) {
    next(err);
  }
});
