import { Router } from "express";
import { z } from "zod";
import { User } from "../../models/User";
import { RecruiterProfile } from "../../models/RecruiterProfile";
import { Application } from "../../models/Application";
import { Job } from "../../models/Job";
import { JobSeekerProfile } from "../../models/JobSeekerProfile";
import { Resume } from "../../models/Resume";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const recruiterApplicationsRouter = Router();

recruiterApplicationsRouter.get("/recruiter/applications", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const q = z
      .object({
        status: z.enum(["APPLIED", "SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED", "OFFERED", "HIRED"]).optional(),
      })
      .parse(req.query);

    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const recruiter = await RecruiterProfile.findOne({ userId: user._id });
    if (!recruiter) throw new HttpError(403, "Forbidden");

    const recruiterJobs = await Job.find({ recruiterId: recruiter._id }).select("_id title companyName location role requiredSkills");
    const recruiterJobIdSet = new Set(recruiterJobs.map((j) => String(j._id)));

    const applications = await Application.find({ ...(q.status ? { status: q.status } : {}) })
      .populate("jobId")
      .populate("jobSeekerId")
      .sort({ createdAt: -1 });

    const filtered = applications.filter((a) => {
      const job = a.jobId as any;
      return recruiterJobIdSet.has(String(job?._id));
    });

    const mapped = await Promise.all(
      filtered.map(async (a) => {
        const job = a.jobId as any;
        const candidate = a.jobSeekerId as any;
        const latestResume = await Resume.findOne({ jobSeekerId: candidate._id }).sort({ createdAt: -1 });

        return {
          id: String(a._id),
          applicationId: String(a._id),
          status: a.status,
          interviewAt: a.interviewAt,
          createdAt: a.createdAt,
          job: {
            id: String(job._id),
            title: job.title,
            companyName: job.companyName,
            location: job.location,
            role: job.role,
            requiredSkills: job.requiredSkills,
          },
          candidate: {
            id: String(candidate._id),
            fullName: candidate.fullName,
            location: candidate.location,
            skills: candidate.skills ?? [],
            experienceYears: candidate.experienceYears ?? 0,
            latestResume: latestResume
              ? {
                  id: String(latestResume._id),
                  originalName: latestResume.originalName,
                }
              : null,
          },
        };
      })
    );

    res.json({ applications: mapped });
  } catch (err) {
    next(err);
  }
});
