import { Router } from "express";
import path from "path";
import multer from "multer";
import { z } from "zod";
import { User } from "../../models/User";
import { JobSeekerProfile } from "../../models/JobSeekerProfile";
import { Resume } from "../../models/Resume";
import { Application } from "../../models/Application";
import { RecruiterProfile } from "../../models/RecruiterProfile";
import { Job } from "../../models/Job";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const jobSeekerResumeRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve(process.cwd(), "uploads", "resumes")),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${Math.random().toString(16).slice(2)}_${safe}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

jobSeekerResumeRouter.post("/job-seeker/resume", upload.single("resume"), async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    if (!req.file) throw new HttpError(400, "File required");

    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "JOB_SEEKER") throw new HttpError(403, "Forbidden");

    const profile = await JobSeekerProfile.findOne({ userId: user._id });
    if (!profile) throw new HttpError(403, "Forbidden");

    const resume = await Resume.create({
      jobSeekerId: profile._id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    res.status(201).json({ resume });
  } catch (err) {
    next(err);
  }
});

jobSeekerResumeRouter.get("/job-seeker/resume", async (req, res, next) => {
  try {
    const authed = req as AuthenticatedRequest;
    const user = await User.findById(authed.auth.userId).select("role");
    if (!user || user.role !== "JOB_SEEKER") throw new HttpError(403, "Forbidden");

    const profile = await JobSeekerProfile.findOne({ userId: user._id });
    if (!profile) throw new HttpError(403, "Forbidden");

    const resumes = await Resume.find({ jobSeekerId: profile._id }).sort({ createdAt: -1 });
    res.json({ resumes });
  } catch (err) {
    next(err);
  }
});

jobSeekerResumeRouter.get("/files/resume/:resumeId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const resumeId = z.string().min(1).parse(req.params.resumeId);

    const resume = await Resume.findById(resumeId);
    if (!resume) throw new HttpError(404, "Resume not found");

    const user = await User.findById(authed.auth.userId).select("role");
    if (!user) throw new HttpError(401, "Unauthorized");

    const isOwner = user.role === "JOB_SEEKER" &&
      (await JobSeekerProfile.findOne({ userId: user._id, _id: resume.jobSeekerId }));

    let recruiterCanAccess = false;
    if (user.role === "RECRUITER") {
      const rp = await RecruiterProfile.findOne({ userId: user._id });
      if (rp) {
        const recruiterJobs = await Job.find({ recruiterId: rp._id }).select("_id");
        const hasApp = await Application.findOne({
          jobSeekerId: resume.jobSeekerId,
          jobId: { $in: recruiterJobs.map((j) => j._id) },
        });
        recruiterCanAccess = Boolean(hasApp);
      }
    }

    if (!isOwner && !recruiterCanAccess) throw new HttpError(403, "Forbidden");

    const filePath = path.resolve(process.cwd(), "uploads", "resumes", resume.storedName);
    res.setHeader("Content-Type", resume.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${resume.originalName.replace(/"/g, "")}"`);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});
