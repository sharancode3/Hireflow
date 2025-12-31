import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const recruiterProfileRouter = Router();

recruiterProfileRouter.get("/recruiter/profile", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: {
        id: true,
        email: true,
        role: true,
        recruiterProfile: true,
      },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(404, "Recruiter profile not found");
    }

    res.json({ profile: user.recruiterProfile });
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  companyName: z.string().min(2).optional(),
  website: z.string().url().optional().nullable(),
  location: z.string().min(2).optional().nullable(),
  description: z.string().min(2).max(1000).optional().nullable(),
});

recruiterProfileRouter.patch("/recruiter/profile", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const body = updateSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, recruiterProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const data: Record<string, unknown> = {};
    if (body.companyName !== undefined) data.companyName = body.companyName;
    if (body.website !== undefined) data.website = body.website;
    if (body.location !== undefined) data.location = body.location;
    if (body.description !== undefined) data.description = body.description;

    const updated = await prisma.recruiterProfile.update({
      where: { id: user.recruiterProfile.id },
      data,
    });

    res.json({ profile: updated });
  } catch (err) {
    next(err);
  }
});
