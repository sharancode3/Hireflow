import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./env";
import { connectMongoDB } from "./mongodb";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import { requireAdmin, requireAuth } from "./middleware/auth";
import { loadUserRole } from "./middleware/loadUserRole";

import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { trendsRouter } from "./routes/trends";
import { notificationsRouter } from "./routes/notifications";
import { externalJobsRouter } from "./routes/externalJobs";

import { jobSeekerProfileRouter } from "./routes/jobSeeker/profile";
import { jobSeekerJobsRouter } from "./routes/jobSeeker/jobs";
import { jobSeekerApplicationsRouter } from "./routes/jobSeeker/applications";
import { jobSeekerResumeRouter } from "./routes/jobSeeker/resume";

import { recruiterProfileRouter } from "./routes/recruiter/profile";
import { recruiterJobsRouter } from "./routes/recruiter/jobs";
import { recruiterOverviewRouter } from "./routes/recruiter/overview";
import { recruiterApplicationsRouter } from "./routes/recruiter/applications";
import { adminJobReviewRouter } from "./routes/admin/jobReview";

// import { startJobFetchScheduler } from "./jobs/jobFetcher";

async function bootstrap() {
  await connectMongoDB();

  const app = express();

  const configuredOrigins = env.CORS_ORIGIN
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const localOriginPattern = /^https?:\/\/localhost(?::\d+)?$/;
  const codespacesOriginPattern = /^https:\/\/[a-z0-9-]+\.(?:app\.github\.dev|githubpreview\.dev)$/i;

  app.use(
    cors({
      credentials: false,
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (configuredOrigins.includes("*") || configuredOrigins.includes(origin)) return callback(null, true);
        if (localOriginPattern.test(origin) || codespacesOriginPattern.test(origin)) return callback(null, true);
        return callback(new Error("CORS origin not allowed"));
      },
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  app.use(healthRouter);
  app.use(authRouter);
  app.use(trendsRouter);
  app.use(externalJobsRouter);

  app.use(requireAuth);
  app.use(loadUserRole);

  app.use(notificationsRouter);

  app.use(jobSeekerProfileRouter);
  app.use(jobSeekerJobsRouter);
  app.use(jobSeekerApplicationsRouter);
  app.use(jobSeekerResumeRouter);

  app.use(recruiterProfileRouter);
  app.use(recruiterJobsRouter);
  app.use(recruiterOverviewRouter);
  app.use(recruiterApplicationsRouter);

  app.use(requireAdmin());
  app.use(adminJobReviewRouter);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    console.log(`[Server] Running on port ${env.PORT}`);
  });

  // startJobFetchScheduler();
}

bootstrap().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
