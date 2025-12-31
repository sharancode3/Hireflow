import { Router } from "express";
import { prisma } from "../prisma";
import { csvToSkills } from "../utils/csvSkills";

export const trendsRouter = Router();

function topN<T extends string>(items: T[], n: number): Array<{ key: T; count: number }> {
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

trendsRouter.get("/trends", async (_req, res) => {
  type TrendJob = {
    companyName: string;
    role: string;
    requiredSkillsCsv: string;
    openToFreshers: boolean;
  };

  const jobs = (await prisma.job.findMany({
    select: { companyName: true, role: true, requiredSkillsCsv: true, openToFreshers: true },
  })) as TrendJob[];

  const roles = jobs.map((j: TrendJob) => j.role);
  const companies = jobs.map((j: TrendJob) => j.companyName);
  const skills = jobs.flatMap((j: TrendJob) => csvToSkills(j.requiredSkillsCsv.toLowerCase()));

  const curatedProfessionsHiringSoon = [
    "Software Developer",
    "Data Analyst",
    "UI/UX Designer",
    "Cybersecurity Analyst",
    "Cloud Engineer",
  ];

  res.json({
    professionsHiringSoon: curatedProfessionsHiringSoon,
    topHiringRoles: topN(roles, 6),
    topHiringCompanies: topN(companies, 6),
    trendingSkills: topN(skills, 10),
    industryInsights: [
      { label: "Freshers-friendly openings", value: jobs.filter((j: TrendJob) => j.openToFreshers).length },
      { label: "Total active job posts", value: jobs.length },
    ],
  });
});
