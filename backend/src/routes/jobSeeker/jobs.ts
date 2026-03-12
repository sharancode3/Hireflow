import { Router } from "express";
import { z } from "zod";
import { Job } from "../../models/Job";
import { SavedJob } from "../../models/SavedJob";
import { User } from "../../models/User";
import { JobSeekerProfile } from "../../models/JobSeekerProfile";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const jobSeekerJobsRouter = Router();

jobSeekerJobsRouter.get("/jobs", async (req, res, next) => {
  try {
    const q = z.object({
      skills: z.string().optional(),
      location: z.string().optional(),
      role: z.string().optional(),
      freshersOnly: z.string().optional(),
    }).parse(req.query);

    const filter: Record<string, unknown> = { reviewStatus: "APPROVED" };
    if (q.location) filter.location = { $regex: q.location, $options: "i" };
    if (q.role) filter.role = { $regex: q.role, $options: "i" };
    if (q.freshersOnly === "true") filter.openToFreshers = true;

    let jobs = await Job.find(filter).sort({ createdAt: -1 }).lean();

    if (q.skills) {
      const skillsFilter = q.skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      jobs = jobs.filter((j) => skillsFilter.every((s) => j.requiredSkills.map((r) => r.toLowerCase()).includes(s)));
    }

    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

jobSeekerJobsRouter.get("/jobs/:jobId", async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, reviewStatus: "APPROVED" });
    if (!job) throw new HttpError(404, "Job not found");
    res.json({ job });
  } catch (err) {
    next(err);
  }
});

jobSeekerJobsRouter.get("/job-seeker/saved-jobs", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "JOB_SEEKER") throw new HttpError(403, "Forbidden");
    const profile = await JobSeekerProfile.findOne({ userId: user._id });
    if (!profile) throw new HttpError(403, "Forbidden");

    const saved = await SavedJob.find({ jobSeekerId: profile._id }).populate("jobId").sort({ createdAt: -1 });
    res.json({ savedJobs: saved });
  } catch (err) {
    next(err);
  }
});

jobSeekerJobsRouter.post("/job-seeker/saved-jobs", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const body = z.object({ jobId: z.string().min(1) }).parse(req.body);
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "JOB_SEEKER") throw new HttpError(403, "Forbidden");
    const profile = await JobSeekerProfile.findOne({ userId: user._id });
    if (!profile) throw new HttpError(403, "Forbidden");

    await SavedJob.findOneAndUpdate(
      { jobId: body.jobId, jobSeekerId: profile._id },
      { jobId: body.jobId, jobSeekerId: profile._id },
      { upsert: true }
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

jobSeekerJobsRouter.delete("/job-seeker/saved-jobs/:jobId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "JOB_SEEKER") throw new HttpError(403, "Forbidden");
    const profile = await JobSeekerProfile.findOne({ userId: user._id });
    if (!profile) throw new HttpError(403, "Forbidden");

    await SavedJob.deleteMany({ jobId: req.params.jobId, jobSeekerId: profile._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
