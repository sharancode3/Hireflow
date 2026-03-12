import { Router } from "express";
import { z } from "zod";
import { User } from "../../models/User";
import { JobSeekerProfile } from "../../models/JobSeekerProfile";
import { Job } from "../../models/Job";
import { Application } from "../../models/Application";
import { Notification } from "../../models/Notification";
import { RecruiterProfile } from "../../models/RecruiterProfile";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";
import { sendApplicationConfirmationEmail } from "../../utils/emailAutomation";

export const jobSeekerApplicationsRouter = Router();

jobSeekerApplicationsRouter.post("/job-seeker/applications", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const body = z.object({ jobId: z.string().min(1) }).parse(req.body);

    const user = await User.findById(authed.auth.userId).select("role email");
    if (!user || user.role !== "JOB_SEEKER") throw new HttpError(403, "Forbidden");

    const profile = await JobSeekerProfile.findOne({ userId: user._id });
    if (!profile) throw new HttpError(403, "Forbidden");

    const job = await Job.findById(body.jobId);
    if (!job) throw new HttpError(404, "Job not found");
    if (job.reviewStatus !== "APPROVED") throw new HttpError(400, "Job not open for applications");

    const existing = await Application.findOne({ jobId: body.jobId, jobSeekerId: profile._id });
    if (existing) throw new HttpError(409, "Already applied");

    const app = await Application.create({ jobId: body.jobId, jobSeekerId: profile._id });

    await Notification.create({
      userId: user._id,
      type: "APPLICATION",
      message: `Applied to ${job.title} at ${job.companyName}`,
    });

    const recruiter = await RecruiterProfile.findById(job.recruiterId).populate<{ userId: { _id: string; email: string } }>("userId");
    if (recruiter) {
      const recruiterUserId = (recruiter.userId as any)?._id ?? recruiter.userId;
      await Notification.create({
        userId: recruiterUserId,
        type: "APPLICANT",
        message: `${profile.fullName} applied to ${job.title}`,
      });
    }

    await sendApplicationConfirmationEmail({
      to: user.email,
      applicantName: profile.fullName,
      jobTitle: job.title,
      companyName: job.companyName,
      applicationsUrl: `${process.env.CORS_ORIGIN ?? "http://localhost:5173"}/job-seeker/applied`,
    });

    res.status(201).json({ application: app });
  } catch (err) {
    next(err);
  }
});

jobSeekerApplicationsRouter.get("/job-seeker/applications", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "JOB_SEEKER") throw new HttpError(403, "Forbidden");

    const profile = await JobSeekerProfile.findOne({ userId: user._id });
    if (!profile) throw new HttpError(403, "Forbidden");

    const applications = await Application.find({ jobSeekerId: profile._id }).populate("jobId").sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    next(err);
  }
});
