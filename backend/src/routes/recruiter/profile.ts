import { Router } from "express";
import { z } from "zod";
import { User } from "../../models/User";
import { RecruiterProfile } from "../../models/RecruiterProfile";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const recruiterProfileRouter = Router();

recruiterProfileRouter.get("/recruiter/profile", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role email");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const profile = await RecruiterProfile.findOne({ userId: user._id });
    if (!profile) throw new HttpError(404, "Profile not found");

    res.json({ profile });
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
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const profile = await RecruiterProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: body },
      { new: true }
    );
    if (!profile) throw new HttpError(404, "Profile not found");

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});
