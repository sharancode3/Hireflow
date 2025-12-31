import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";
import { csvToSkills, skillsToCsv } from "../../utils/csvSkills";

export const recruiterJobsRouter = Router();

const jobCreateSchema = z.object({
  title: z.string().min(2),
  location: z.string().min(2),
  role: z.string().min(2),
  requiredSkills: z.array(z.string().min(1)).min(1).max(50),
  description: z.string().min(20).max(5000),
  openToFreshers: z.boolean().default(false),
});

recruiterJobsRouter.post("/recruiter/jobs", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const body = jobCreateSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, recruiterProfile: { select: { id: true, companyName: true } } },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const job = await prisma.job.create({
      data: {
        recruiterId: user.recruiterProfile.id,
        companyName: user.recruiterProfile.companyName,
        title: body.title,
        location: body.location,
        role: body.role,
        requiredSkillsCsv: skillsToCsv(body.requiredSkills),
        description: body.description,
        openToFreshers: body.openToFreshers,
      },
    });

    res.status(201).json({
      job: { ...job, requiredSkills: csvToSkills(job.requiredSkillsCsv) },
    });
  } catch (err) {
    next(err);
  }
});

recruiterJobsRouter.get("/recruiter/jobs", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, recruiterProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const jobs = await prisma.job.findMany({
      where: { recruiterId: user.recruiterProfile.id },
      orderBy: { createdAt: "desc" },
    });

    type JobRow = (typeof jobs)[number];
    res.json({
      jobs: jobs.map((j: JobRow) => ({ ...j, requiredSkills: csvToSkills(j.requiredSkillsCsv) })),
    });
  } catch (err) {
    next(err);
  }
});

const jobUpdateSchema = jobCreateSchema.partial();

recruiterJobsRouter.patch("/recruiter/jobs/:jobId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const jobId = z.string().min(1).parse(req.params.jobId);
    const body = jobUpdateSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, recruiterProfile: { select: { id: true, companyName: true } } },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing || existing.recruiterId !== user.recruiterProfile.id) {
      throw new HttpError(404, "Job not found");
    }

    const data: Record<string, unknown> = {
      companyName: user.recruiterProfile.companyName,
    };
    if (body.title !== undefined) data.title = body.title;
    if (body.location !== undefined) data.location = body.location;
    if (body.role !== undefined) data.role = body.role;
    if (body.description !== undefined) data.description = body.description;
    if (body.openToFreshers !== undefined) data.openToFreshers = body.openToFreshers;
    if (body.requiredSkills !== undefined) data.requiredSkillsCsv = skillsToCsv(body.requiredSkills);

    const updated = await prisma.job.update({
      where: { id: jobId },
      data,
    });

    res.json({ job: { ...updated, requiredSkills: csvToSkills(updated.requiredSkillsCsv) } });
  } catch (err) {
    next(err);
  }
});

recruiterJobsRouter.delete("/recruiter/jobs/:jobId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const jobId = z.string().min(1).parse(req.params.jobId);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, recruiterProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing || existing.recruiterId !== user.recruiterProfile.id) {
      throw new HttpError(404, "Job not found");
    }

    await prisma.job.delete({ where: { id: jobId } });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

recruiterJobsRouter.get("/recruiter/jobs/:jobId/applicants", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const jobId = z.string().min(1).parse(req.params.jobId);
    const q = z.object({ skill: z.string().optional() }).parse(req.query);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, recruiterProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.recruiterId !== user.recruiterProfile.id) {
      throw new HttpError(404, "Job not found");
    }

    const apps = await prisma.application.findMany({
      where: { jobId },
      include: {
        jobSeeker: {
          include: {
            resumes: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const skill = q.skill?.trim().toLowerCase();

    type AppRow = (typeof apps)[number];
    const filtered = skill
      ? apps.filter((a: AppRow) =>
          a.jobSeeker.skillsCsv
            .toLowerCase()
            .split(",")
            .map((s: string) => s.trim())
            .includes(skill),
        )
      : apps;

    res.json({
      applicants: filtered.map((a: AppRow) => ({
        applicationId: a.id,
        status: a.status,
        interviewAt: a.interviewAt,
        candidate: {
          id: a.jobSeeker.id,
          fullName: a.jobSeeker.fullName,
          location: a.jobSeeker.location,
          skills: csvToSkills(a.jobSeeker.skillsCsv),
          isFresher: a.jobSeeker.isFresher,
          experienceYears: a.jobSeeker.experienceYears,
          visibility: a.jobSeeker.visibility,
          latestResume: a.jobSeeker.resumes[0]
            ? {
                id: a.jobSeeker.resumes[0].id,
                originalName: a.jobSeeker.resumes[0].originalName,
              }
            : null,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
});

const statusSchema = z.object({
  status: z.enum(["SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED", "OFFERED", "HIRED"]),
  interviewAt: z.string().datetime().optional().nullable(),
});

recruiterJobsRouter.patch("/recruiter/applications/:applicationId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const applicationId = z.string().min(1).parse(req.params.applicationId);
    const body = statusSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, recruiterProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!app || app.job.recruiterId !== user.recruiterProfile.id) {
      throw new HttpError(404, "Application not found");
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: body.status,
        interviewAt: body.interviewAt ? new Date(body.interviewAt) : body.status === "INTERVIEW_SCHEDULED" ? new Date() : null,
      },
    });

    // Notify job seeker
    const seekerUser = await prisma.jobSeekerProfile.findUnique({
      where: { id: app.jobSeekerId },
      select: { userId: true },
    });
    if (seekerUser) {
      const statusMessage =
        body.status === "INTERVIEW_SCHEDULED"
          ? `Interview scheduled for ${app.job.title}`
          : `Application status updated to ${body.status} for ${app.job.title}`;

      await prisma.notification.create({
        data: {
          userId: seekerUser.userId,
          type: "STATUS",
          message: statusMessage,
        },
      });
    }

    res.json({ application: updated });
  } catch (err) {
    next(err);
  }
});
