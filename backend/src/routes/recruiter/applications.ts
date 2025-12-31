import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";
import { csvToSkills } from "../../utils/csvSkills";

export const recruiterApplicationsRouter = Router();

recruiterApplicationsRouter.get("/recruiter/applications", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const q = z
      .object({
        status: z
          .enum(["APPLIED", "SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED", "OFFERED", "HIRED"])
          .optional(),
      })
      .parse(req.query);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, recruiterProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const recruiterId = user.recruiterProfile.id;

    const applications = await prisma.application.findMany({
      where: {
        ...(q.status ? { status: q.status } : {}),
        job: { recruiterId },
      },
      include: {
        job: true,
        jobSeeker: {
          include: {
            resumes: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    type Row = (typeof applications)[number];

    res.json({
      applications: applications.map((a: Row) => ({
        applicationId: a.id,
        status: a.status,
        interviewAt: a.interviewAt,
        job: {
          id: a.job.id,
          title: a.job.title,
          companyName: a.job.companyName,
          location: a.job.location,
          role: a.job.role,
          requiredSkills: csvToSkills(a.job.requiredSkillsCsv),
        },
        candidate: {
          id: a.jobSeeker.id,
          fullName: a.jobSeeker.fullName,
          location: a.jobSeeker.location,
          skills: csvToSkills(a.jobSeeker.skillsCsv),
          experienceYears: a.jobSeeker.experienceYears,
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
