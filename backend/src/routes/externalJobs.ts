import { Router } from "express";
import { z } from "zod";
import { ExternalJob } from "../models/ExternalJob";

export const externalJobsRouter = Router();

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().optional(),
  jobType: z.enum(["full_time", "part_time", "internship", "contract", "freelance", "any"]).default("any"),
  location: z.string().optional(),
  isRemote: z.enum(["true", "false"]).optional(),
  skills: z.string().optional(),
  experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead", "any"]).default("any"),
  source: z.string().optional(),
  sortBy: z.enum(["date", "relevance"]).default("date"),
});

externalJobsRouter.get("/external-jobs", async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query);
    const skip = (q.page - 1) * q.limit;

    const filter: Record<string, unknown> = { isActive: true };

    if (q.q) {
      filter.$or = [
        { title: { $regex: q.q, $options: "i" } },
        { company: { $regex: q.q, $options: "i" } },
        { description: { $regex: q.q, $options: "i" } },
        { skills: { $in: [new RegExp(q.q, "i")] } },
      ];
    }

    if (q.jobType !== "any") filter.jobType = q.jobType;
    if (q.experienceLevel !== "any") filter.experienceLevel = q.experienceLevel;
    if (q.isRemote === "true") filter["location.isRemote"] = true;
    if (q.source) filter.source = q.source;

    if (q.location) {
      const locationOr = [
        { "location.city": { $regex: q.location, $options: "i" } },
        { "location.state": { $regex: q.location, $options: "i" } },
        { "location.country": { $regex: q.location, $options: "i" } },
      ];
      if (Array.isArray(filter.$and)) {
        filter.$and.push({ $or: locationOr });
      } else if (Array.isArray(filter.$or)) {
        filter.$and = [{ $or: filter.$or as any[] }, { $or: locationOr }];
        delete filter.$or;
      } else {
        filter.$or = locationOr;
      }
    }

    if (q.skills) {
      const skillList = q.skills
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      filter.skills = { $all: skillList };
    }

    const sortOrder = q.sortBy === "date" ? { postedAt: -1 as const } : { fetchedAt: -1 as const };

    const [jobs, total] = await Promise.all([
      ExternalJob.find(filter)
        .select("-description")
        .sort(sortOrder)
        .skip(skip)
        .limit(q.limit)
        .lean(),
      ExternalJob.countDocuments(filter),
    ]);

    res.json({
      jobs: jobs.map(formatJobForList),
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        pages: Math.ceil(total / q.limit),
        hasMore: q.page * q.limit < total,
      },
    });
  } catch (err) {
    next(err);
  }
});

externalJobsRouter.get("/external-jobs/:id", async (req, res, next) => {
  try {
    const job = await ExternalJob.findById(req.params.id).lean();
    if (!job || !job.isActive) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({ job: formatJobForDetail(job) });
  } catch (err) {
    next(err);
  }
});

externalJobsRouter.get("/external-jobs/meta/stats", async (_req, res, next) => {
  try {
    const [byType, byLocation, total] = await Promise.all([
      ExternalJob.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$jobType", count: { $sum: 1 } } }]),
      ExternalJob.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$location.city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ExternalJob.countDocuments({ isActive: true }),
    ]);

    res.json({ total, byType, topLocations: byLocation });
  } catch (err) {
    next(err);
  }
});

function formatJobForList(job: any) {
  return {
    _id: job._id,
    title: job.title,
    company: job.company,
    location: job.location,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    minExperienceYears: job.minExperienceYears,
    skills: job.skills,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    applyUrl: job.applyUrl,
    applicationDeadline: job.applicationDeadline,
    postedAt: job.postedAt,
    source: job.source,
    isActive: job.isActive,
  };
}

function formatJobForDetail(job: any) {
  return {
    ...formatJobForList(job),
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
  };
}
