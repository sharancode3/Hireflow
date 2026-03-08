import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";
import { csvToSkills } from "../../utils/csvSkills";

export const jobSeekerJobsRouter = Router();

jobSeekerJobsRouter.get("/jobs", async (req, res, next) => {
  try {
    // Public list of jobs, but still fine to be accessed when authenticated
    const querySchema = z.object({
      skills: z.string().optional(),
      location: z.string().optional(),
      role: z.string().optional(),
      freshersOnly: z.string().optional(),
    });

    const q = querySchema.parse(req.query);

    const where: any = { reviewStatus: "APPROVED" };
    if (q.location) where.location = { contains: q.location, mode: "insensitive" };
    if (q.role) where.role = { contains: q.role, mode: "insensitive" };
    if (q.freshersOnly === "true") where.openToFreshers = true;

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const skillsFilter = q.skills
      ? q.skills
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : [];

    type JobRow = (typeof jobs)[number];

    const filtered = skillsFilter.length
      ? jobs.filter((j: JobRow) => {
          const skills = csvToSkills(j.requiredSkillsCsv.toLowerCase());
          return skillsFilter.every((s) => skills.includes(s));
        })
      : jobs;

    res.json({
      jobs: filtered.map((j: JobRow) => ({
        ...j,
        requiredSkills: csvToSkills(j.requiredSkillsCsv),
      })),
    });
  } catch (err) {
    next(err);
  }
});

jobSeekerJobsRouter.get("/jobs/:jobId", async (req, res, next) => {
  try {
    const jobId = z.string().min(1).parse(req.params.jobId);
    const job = await prisma.job.findFirst({ where: { id: jobId, reviewStatus: "APPROVED" } });
    if (!job) throw new HttpError(404, "Job not found");

    res.json({
      job: {
        ...job,
        requiredSkills: csvToSkills(job.requiredSkillsCsv),
      },
    });
  } catch (err) {
    next(err);
  }
});

jobSeekerJobsRouter.get("/job-seeker/saved-jobs", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, jobSeekerProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "JOB_SEEKER" || !user.jobSeekerProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const saved = await prisma.savedJob.findMany({
      where: { jobSeekerId: user.jobSeekerProfile.id },
      include: { job: true },
      orderBy: { createdAt: "desc" },
    });

    type SavedRow = (typeof saved)[number];

    res.json({
      savedJobs: saved.map((s: SavedRow) => ({
        ...s,
        job: { ...s.job, requiredSkills: csvToSkills(s.job.requiredSkillsCsv) },
      })),
    });
  } catch (err) {
    next(err);
  }
});

jobSeekerJobsRouter.post("/job-seeker/saved-jobs", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const body = z.object({ jobId: z.string().min(1) }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, jobSeekerProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "JOB_SEEKER" || !user.jobSeekerProfile) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.savedJob.upsert({
      where: {
        jobId_jobSeekerId: { jobId: body.jobId, jobSeekerId: user.jobSeekerProfile.id },
      },
      update: {},
      create: { jobId: body.jobId, jobSeekerId: user.jobSeekerProfile.id },
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

jobSeekerJobsRouter.delete("/job-seeker/saved-jobs/:jobId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const jobId = req.params.jobId;

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, jobSeekerProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "JOB_SEEKER" || !user.jobSeekerProfile) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.savedJob.deleteMany({
      where: { jobId, jobSeekerId: user.jobSeekerProfile.id },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
