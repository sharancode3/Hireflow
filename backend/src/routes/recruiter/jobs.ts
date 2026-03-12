import { Router } from "express";
import { z } from "zod";
import { User } from "../../models/User";
import { RecruiterProfile } from "../../models/RecruiterProfile";
import { JobSeekerProfile } from "../../models/JobSeekerProfile";
import { Job } from "../../models/Job";
import { Application } from "../../models/Application";
import { Notification } from "../../models/Notification";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const recruiterJobsRouter = Router();

const jobCreateSchema = z.object({
  title: z.string().min(2),
  location: z.string().min(2),
  role: z.string().min(2),
  requiredSkills: z.array(z.string().min(1)).min(1).max(50),
  description: z.string().min(20).max(5000),
  openToFreshers: z.boolean().default(false),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]).default("FULL_TIME"),
  minExperienceYears: z.number().int().min(0).max(60).default(0),
  applicationDeadline: z.string().datetime().optional().nullable(),
});

recruiterJobsRouter.post("/recruiter/jobs", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const body = jobCreateSchema.parse(req.body);
    const user = await User.findById(authed.auth.userId).select("role email");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const recruiter = await RecruiterProfile.findOne({ userId: user._id });
    if (!recruiter) throw new HttpError(403, "Forbidden");

    const createBody: Record<string, unknown> = {
      recruiterId: recruiter._id,
      companyName: recruiter.companyName,
      title: body.title,
      location: body.location,
      role: body.role,
      requiredSkills: body.requiredSkills,
      description: body.description,
      openToFreshers: body.openToFreshers,
      jobType: body.jobType,
      minExperienceYears: body.minExperienceYears,
      reviewStatus: "PENDING_REVIEW",
    };
    if (body.applicationDeadline) createBody.applicationDeadline = new Date(body.applicationDeadline);

    const job = await Job.create(createBody);

    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
});

recruiterJobsRouter.get("/recruiter/jobs", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const recruiter = await RecruiterProfile.findOne({ userId: user._id });
    if (!recruiter) throw new HttpError(403, "Forbidden");

    const jobs = await Job.find({ recruiterId: recruiter._id }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

recruiterJobsRouter.patch("/recruiter/jobs/:jobId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const body = jobCreateSchema.partial().parse(req.body);
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const recruiter = await RecruiterProfile.findOne({ userId: user._id });
    if (!recruiter) throw new HttpError(403, "Forbidden");

    const job = await Job.findOneAndUpdate(
      { _id: req.params.jobId, recruiterId: recruiter._id },
      { $set: { ...body, reviewStatus: "PENDING_REVIEW", adminFeedback: undefined, reviewedAt: undefined } },
      { new: true }
    );
    if (!job) throw new HttpError(404, "Job not found");

    res.json({ job });
  } catch (err) {
    next(err);
  }
});

recruiterJobsRouter.delete("/recruiter/jobs/:jobId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const recruiter = await RecruiterProfile.findOne({ userId: user._id });
    if (!recruiter) throw new HttpError(403, "Forbidden");

    const deleted = await Job.findOneAndDelete({ _id: req.params.jobId, recruiterId: recruiter._id });
    if (!deleted) throw new HttpError(404, "Job not found");

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

recruiterJobsRouter.get("/recruiter/jobs/:jobId/applicants", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const recruiter = await RecruiterProfile.findOne({ userId: user._id });
    if (!recruiter) throw new HttpError(403, "Forbidden");

    const job = await Job.findOne({ _id: req.params.jobId, recruiterId: recruiter._id });
    if (!job) throw new HttpError(404, "Job not found");

    const apps = await Application.find({ jobId: job._id })
      .populate("jobSeekerId")
      .sort({ createdAt: -1 });

    const applicants = await Promise.all(
      apps.map(async (a) => {
        const profile = a.jobSeekerId as any;
        const latestResume = await import("../../models/Resume").then(({ Resume }) =>
          Resume.findOne({ jobSeekerId: profile._id }).sort({ createdAt: -1 })
        );
        return {
          applicationId: a._id,
          status: a.status,
          interviewAt: a.interviewAt,
          candidate: {
            id: profile._id,
            fullName: profile.fullName,
            skills: profile.skills ?? [],
            experienceYears: profile.experienceYears ?? 0,
            latestResume: latestResume
              ? {
                  id: latestResume._id,
                  originalName: latestResume.originalName,
                }
              : null,
          },
        };
      })
    );

    res.json({ applicants });
  } catch (err) {
    next(err);
  }
});

recruiterJobsRouter.patch("/recruiter/applications/:applicationId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const body = z.object({
      status: z.enum(["SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED", "OFFERED", "HIRED"]),
      interviewAt: z.string().datetime().optional().nullable(),
    }).parse(req.body);

    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const app = await Application.findById(req.params.applicationId);
    if (!app) throw new HttpError(404, "Application not found");

    const updated = await Application.findByIdAndUpdate(
      app._id,
      {
        $set: {
          status: body.status,
          interviewAt: body.interviewAt ? new Date(body.interviewAt) : undefined,
        },
      },
      { new: true }
    );

    const seeker = await JobSeekerProfile.findById(app.jobSeekerId).populate<{ userId: { _id: string; email: string } }>("userId");
    if (seeker) {
      const seekerUserId = (seeker.userId as any)?._id ?? seeker.userId;
      await Notification.create({
        userId: seekerUserId,
        type: "STATUS",
        message: `Application status updated to ${body.status}`,
      });
    }

    res.json({ application: updated });
  } catch (err) {
    next(err);
  }
});
