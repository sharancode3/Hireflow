import { Router } from "express";
import { z } from "zod";
import { User } from "../../models/User";
import { JobSeekerProfile } from "../../models/JobSeekerProfile";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const jobSeekerProfileRouter = Router();

jobSeekerProfileRouter.get("/job-seeker/profile", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role email");
    if (!user || user.role !== "JOB_SEEKER") throw new HttpError(403, "Forbidden");

    const profile = await JobSeekerProfile.findOne({ userId: user._id });
    if (!profile) throw new HttpError(404, "Profile not found");

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
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "JOB_SEEKER") throw new HttpError(403, "Forbidden");

    const profile = await JobSeekerProfile.findOneAndUpdate({ userId: user._id }, { $set: body }, { new: true });
    if (!profile) throw new HttpError(404, "Profile not found");

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});
