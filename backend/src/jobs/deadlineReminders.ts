import { prisma } from "../prisma";
import { sendDeadlineReminderEmail } from "../utils/emailAutomation";

async function runDeadlineReminderSweep() {
  // Current schema does not store explicit application deadlines.
  // This sweep uses most-recent recruiter activity as a proxy until a dedicated deadline field is added.
  const recentJobs = await prisma.job.findMany({
    where: {
      updatedAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        lte: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });

  for (const job of recentJobs) {
    const targets = await prisma.savedJob.findMany({
      where: { jobId: job.id },
      include: {
        jobSeeker: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
      take: 100,
    });

    for (const target of targets) {
      if (!target.jobSeeker.user?.email) continue;
      await sendDeadlineReminderEmail({
        to: target.jobSeeker.user.email,
        firstName: target.jobSeeker.fullName.split(/\s+/)[0] ?? "there",
        jobTitle: job.title,
        companyName: job.companyName,
        jobsUrl: `${process.env.CORS_ORIGIN ?? "http://localhost:5173"}/job-seeker/jobs/${job.id}`,
      });
    }
  }
}

export function startDeadlineReminderScheduler() {
  // Trigger once on startup, then run every 24 hours.
  void runDeadlineReminderSweep();
  const every24h = 1000 * 60 * 60 * 24;
  setInterval(() => {
    void runDeadlineReminderSweep();
  }, every24h);
}
