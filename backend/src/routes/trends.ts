import { Router } from "express";
import { Job } from "../models/Job";

export const trendsRouter = Router();

function topN(items: string[], n: number) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

trendsRouter.get("/trends", async (_req, res) => {
  const jobs = await Job.find().select("companyName role requiredSkills openToFreshers").lean();

  const roles = jobs.map((j) => j.role);
  const companies = jobs.map((j) => j.companyName);
  const skills = jobs.flatMap((j) => j.requiredSkills.map((s) => s.toLowerCase()));

  res.json({
    professionsHiringSoon: ["Software Developer", "Data Analyst", "UI/UX Designer", "Cloud Engineer", "ML Engineer"],
    topHiringRoles: topN(roles, 6),
    topHiringCompanies: topN(companies, 6),
    trendingSkills: topN(skills, 10),
    industryInsights: [
      { label: "Freshers-friendly openings", value: jobs.filter((j) => j.openToFreshers).length },
      { label: "Total active job posts", value: jobs.length },
    ],
  });
});
