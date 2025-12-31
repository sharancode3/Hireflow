import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";
import { csvToSkills, skillsToCsv } from "../../utils/csvSkills";

export const jobSeekerProfileRouter = Router();

jobSeekerProfileRouter.get("/job-seeker/profile", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: {
        id: true,
        email: true,
        role: true,
        jobSeekerProfile: true,
      },
    });

    if (!user || user.role !== "JOB_SEEKER" || !user.jobSeekerProfile) {
      throw new HttpError(404, "Job seeker profile not found");
    }

    const profile = {
      ...user.jobSeekerProfile,
      skills: csvToSkills(user.jobSeekerProfile.skillsCsv),
    };

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(7).max(20).optional().nullable(),
  location: z.string().min(2).optional().nullable(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  desiredRole: z.string().min(2).optional().nullable(),
  skills: z.array(z.string().min(1)).max(50).optional(),
  isFresher: z.boolean().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

jobSeekerProfileRouter.patch("/job-seeker/profile", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const body = updateSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, jobSeekerProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "JOB_SEEKER" || !user.jobSeekerProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.location !== undefined) data.location = body.location;
    if (body.experienceYears !== undefined) data.experienceYears = body.experienceYears;
    if (body.desiredRole !== undefined) data.desiredRole = body.desiredRole;
    if (body.isFresher !== undefined) data.isFresher = body.isFresher;
    if (body.visibility !== undefined) data.visibility = body.visibility;
    if (body.skills !== undefined) data.skillsCsv = skillsToCsv(body.skills);

    const updated = await prisma.jobSeekerProfile.update({
      where: { id: user.jobSeekerProfile.id },
      data,
    });

    res.json({
      profile: {
        ...updated,
        skills: csvToSkills(updated.skillsCsv),
      },
    });
  } catch (err) {
    next(err);
  }
});
