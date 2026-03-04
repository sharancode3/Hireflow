import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./env";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";
import { loadUserRole } from "./middleware/loadUserRole";

import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { trendsRouter } from "./routes/trends";
import { notificationsRouter } from "./routes/notifications";

import { jobSeekerProfileRouter } from "./routes/jobSeeker/profile";
import { jobSeekerJobsRouter } from "./routes/jobSeeker/jobs";
import { jobSeekerApplicationsRouter } from "./routes/jobSeeker/applications";
import { jobSeekerResumeRouter } from "./routes/jobSeeker/resume";

import { recruiterProfileRouter } from "./routes/recruiter/profile";
import { recruiterJobsRouter } from "./routes/recruiter/jobs";
import { recruiterOverviewRouter } from "./routes/recruiter/overview";
import { recruiterApplicationsRouter } from "./routes/recruiter/applications";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: false,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.use(healthRouter);
app.use(authRouter);
app.use(trendsRouter);

// Everything below requires authentication
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

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT);
