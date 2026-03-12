import cron from "node-cron";
import { ExternalJob, type IExternalJob } from "../models/ExternalJob";
import { fetchJSearchJobs, JSEARCH_INDIA_QUERIES } from "../fetchers/jsearch";
import { fetchAdzunaJobs, ADZUNA_KEYWORD_LIST } from "../fetchers/adzuna";
import { fetchGoogleJobs } from "../fetchers/serpapi";
import { fetchGreenhouseJobs, GREENHOUSE_BOARDS } from "../fetchers/greenhouse";
import { fetchLeverJobs, LEVER_COMPANIES } from "../fetchers/lever";
import { fetchSimplifyInternships } from "../fetchers/githubSimplify";
import { fetchPittCSCInternships } from "../fetchers/githubPittCSC";

async function upsertJobs(jobs: Partial<IExternalJob>[]) {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const job of jobs) {
    if (!job.externalId || !job.source || !job.applyUrl) {
      skipped++;
      continue;
    }

    try {
      const existing = await ExternalJob.exists({ source: job.source, externalId: job.externalId });
      await ExternalJob.findOneAndUpdate(
        { source: job.source, externalId: job.externalId },
        {
          $set: {
            ...job,
            fetchedAt: new Date(),
            isActive: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (existing) updated++;
      else inserted++;
    } catch (err: any) {
      if (err.code === 11000) skipped++;
      else console.error("[JobFetcher] Upsert error:", err.message);
    }
  }

  return { inserted, updated, skipped };
}

async function markExpiredJobs() {
  const result = await ExternalJob.updateMany(
    {
      isActive: true,
      $or: [
        { applicationDeadline: { $lt: new Date() } },
        {
          applicationDeadline: { $exists: false },
          postedAt: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        },
      ],
    },
    { $set: { isActive: false } },
  );
  console.log(`[JobFetcher] Marked ${result.modifiedCount} jobs as expired`);
}

export async function runFullJobFetch() {
  console.log("[JobFetcher] Starting full fetch cycle...");

  const results: Record<string, { inserted: number; updated: number; skipped: number }> = {};

  try {
    for (const query of JSEARCH_INDIA_QUERIES.slice(0, 5)) {
      const jobs = await fetchJSearchJobs(query);
      const r = await upsertJobs(jobs);
      results[`jsearch_${query}`] = r;
      await delay(1000);
    }
  } catch (err: any) {
    console.error("[JSearch]", err.message);
  }

  try {
    for (const keyword of ADZUNA_KEYWORD_LIST.slice(0, 5)) {
      const jobs = await fetchAdzunaJobs(keyword);
      const r = await upsertJobs(jobs);
      results[`adzuna_${keyword}`] = r;
      await delay(500);
    }
  } catch (err: any) {
    console.error("[Adzuna]", err.message);
  }

  try {
    const googleJobs = await fetchGoogleJobs("software developer India internship");
    results.serpapi = await upsertJobs(googleJobs.jobs);
  } catch (err: any) {
    console.error("[SerpApi]", err.message);
  }

  for (const board of GREENHOUSE_BOARDS) {
    try {
      const jobs = await fetchGreenhouseJobs(board);
      const r = await upsertJobs(jobs);
      results[`greenhouse_${board}`] = r;
      await delay(200);
    } catch {
      // no-op
    }
  }

  for (const company of LEVER_COMPANIES) {
    try {
      const jobs = await fetchLeverJobs(company);
      const r = await upsertJobs(jobs);
      results[`lever_${company}`] = r;
      await delay(200);
    } catch {
      // no-op
    }
  }

  try {
    const simplifyJobs = await fetchSimplifyInternships();
    results.github_simplify = await upsertJobs(simplifyJobs);
  } catch (err: any) {
    console.error("[GitHub Simplify]", err.message);
  }

  try {
    const pittJobs = await fetchPittCSCInternships();
    results.github_pittcsc = await upsertJobs(pittJobs);
  } catch (err: any) {
    console.error("[GitHub PittCSC]", err.message);
  }

  await markExpiredJobs();

  console.log("[JobFetcher] Fetch complete:", JSON.stringify(results, null, 2));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startJobFetchScheduler() {
  void runFullJobFetch();

  cron.schedule("0 */6 * * *", () => {
    void runFullJobFetch();
  });

  cron.schedule("0 * * * *", async () => {
    await markExpiredJobs();
  });

  console.log("[JobFetcher] Scheduler started - runs every 6 hours");
}
