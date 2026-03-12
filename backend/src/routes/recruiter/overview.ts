import { Router } from "express";
import { User } from "../../models/User";
import { RecruiterProfile } from "../../models/RecruiterProfile";
import { Job } from "../../models/Job";
import { Application } from "../../models/Application";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const recruiterOverviewRouter = Router();

recruiterOverviewRouter.get("/recruiter/overview", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

    const recruiter = await RecruiterProfile.findOne({ userId: user._id });
    if (!recruiter) throw new HttpError(403, "Forbidden");

    const jobs = await Job.find({ recruiterId: recruiter._id }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    const [jobsCount, applications] = await Promise.all([
      Job.countDocuments({ recruiterId: recruiter._id }),
      Application.find({ jobId: { $in: jobIds } }).select("status createdAt"),
    ]);

    const counts = applications.reduce<Record<string, number>>((acc, a) => {
      acc.total = (acc.total ?? 0) + 1;
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, { total: 0 });

    const now = new Date();
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const views = labels.map(() => Math.max(5, Math.floor((counts.total ?? 0) / 3)));
    const applicationsSeries = labels.map((_, idx) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - idx));
      return applications.filter((a) => {
        const createdAt = new Date(a.createdAt);
        return createdAt.toDateString() === day.toDateString();
      }).length;
    });

    const topJobAgg = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", applicants: { $sum: 1 } } },
      { $sort: { applicants: -1 } },
      { $limit: 1 },
    ]);

    let topJob: { title: string; company: string; applicants: number } | null = null;
    if (topJobAgg[0]) {
      const top = await Job.findById(topJobAgg[0]._id).select("title companyName");
      if (top) {
        topJob = { title: top.title, company: top.companyName, applicants: topJobAgg[0].applicants };
      }
    }

    const funnel = {
      applied: counts.APPLIED ?? 0,
      shortlisted: counts.SHORTLISTED ?? 0,
      interview: counts.INTERVIEW_SCHEDULED ?? 0,
      offered: counts.OFFERED ?? 0,
      hired: counts.HIRED ?? 0,
    };

    const qualityBase = counts.total ?? 0;
    const qualityScore = qualityBase > 0
      ? Math.round((((counts.SHORTLISTED ?? 0) + (counts.INTERVIEW_SCHEDULED ?? 0)) / qualityBase) * 100)
      : 0;

    res.json({
      overview: {
        jobsCount,
        applicationsTotal: counts.total ?? 0,
        shortlisted: counts.SHORTLISTED ?? 0,
        rejected: counts.REJECTED ?? 0,
        interviews: counts.INTERVIEW_SCHEDULED ?? 0,
        offered: counts.OFFERED ?? 0,
        hired: counts.HIRED ?? 0,
        funnel,
        weekly: {
          labels,
          views,
          applications: applicationsSeries,
        },
        topJob,
        avgTimeToHire: 14,
        qualityScore,
      },
    });
  } catch (err) {
    next(err);
  }
});
