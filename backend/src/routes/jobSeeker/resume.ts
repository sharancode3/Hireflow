import { Router } from "express";
import path from "path";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../../prisma";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";

export const jobSeekerResumeRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.cwd(), "uploads", "resumes"));
  },
  filename: (_req, file, cb) => {
    const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    cb(null, `${unique}_${safeBase}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

jobSeekerResumeRouter.post(
  "/job-seeker/resume",
  upload.single("resume"),
  async (req, res, next) => {
    try {
      const authed = req as unknown as AuthenticatedRequest;
      if (!req.file) throw new HttpError(400, "Resume file required");

      const user = await prisma.user.findUnique({
        where: { id: authed.auth.userId },
        select: { role: true, jobSeekerProfile: { select: { id: true } } },
      });

      if (!user || user.role !== "JOB_SEEKER" || !user.jobSeekerProfile) {
        throw new HttpError(403, "Forbidden");
      }

      const resume = await prisma.resume.create({
        data: {
          jobSeekerId: user.jobSeekerProfile.id,
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
        },
      });

      res.status(201).json({ resume });
    } catch (err) {
      next(err);
    }
  },
);

jobSeekerResumeRouter.get("/job-seeker/resume", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, jobSeekerProfile: { select: { id: true } } },
    });

    if (!user || user.role !== "JOB_SEEKER" || !user.jobSeekerProfile) {
      throw new HttpError(403, "Forbidden");
    }

    const resumes = await prisma.resume.findMany({
      where: { jobSeekerId: user.jobSeekerProfile.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ resumes });
  } catch (err) {
    next(err);
  }
});

// Secure download: owner OR recruiter with an application can access.
jobSeekerResumeRouter.get("/files/resume/:resumeId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const resumeId = z.string().min(1).parse(req.params.resumeId);

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) throw new HttpError(404, "Resume not found");

    const user = await prisma.user.findUnique({
      where: { id: authed.auth.userId },
      select: { role: true, jobSeekerProfile: { select: { id: true } }, recruiterProfile: { select: { id: true } } },
    });
    if (!user) throw new HttpError(401, "User not found");

    const isOwner = user.role === "JOB_SEEKER" && user.jobSeekerProfile?.id === resume.jobSeekerId;

    let canRecruiterAccess = false;
    if (user.role === "RECRUITER" && user.recruiterProfile) {
      const anyApp = await prisma.application.findFirst({
        where: {
          jobSeekerId: resume.jobSeekerId,
          job: { recruiterId: user.recruiterProfile.id },
        },
        select: { id: true },
      });
      canRecruiterAccess = Boolean(anyApp);
    }

    if (!isOwner && !canRecruiterAccess) {
      throw new HttpError(403, "Forbidden");
    }

    const filePath = path.resolve(process.cwd(), "uploads", "resumes", resume.storedName);
    res.setHeader("Content-Type", resume.mimeType);
    res.setHeader("Content-Disposition", `inline; filename=\"${resume.originalName.replace(/\"/g, "") }\"`);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});
