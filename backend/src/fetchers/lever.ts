import axios from "axios";
import type { IExternalJob } from "../models/ExternalJob";
import { detectJobType, extractSkillsFromText, normalizeJob } from "../utils/jobNormalizer";

export const LEVER_COMPANIES = [
  "airbnb",
  "stripe",
  "notion",
  "figma",
  "vercel",
  "netlify",
  "hasura",
  "setu-api",
  "ather-energy",
  "licious",
  "mamaearth",
  "wow-skin-science",
  "boat",
  "navi",
  "jupiter",
  "fi-money",
];

export async function fetchLeverJobs(company: string) {
  try {
    const response = await axios.get(`https://api.lever.co/v0/postings/${company}?mode=json`, {
      timeout: 8000,
    });

    return (response.data || [])
      .filter((job: any) => {
        const workplaceType = String(job.workplaceType || "");
        const location = String(job.categories?.location || "").toLowerCase();
        return location.includes("india") || workplaceType === "remote" || location.includes("remote");
      })
      .map((job: any) => {
        const city = String(job.categories?.location || "").split(",")[0]?.trim() || "";
        return normalizeJob({
          source: "lever",
          externalId: String(job.id || ""),
          title: String(job.text || ""),
          company,
          ...(city ? { city } : {}),
          country: "India",
          isRemote: job.workplaceType === "remote",
          isHybrid: job.workplaceType === "hybrid",
          jobType: detectJobType(String(job.text || ""), String(job.descriptionPlain || "")),
          description: String(job.descriptionPlain || job.description || ""),
          skills: extractSkillsFromText(String(job.descriptionPlain || "")),
          applyUrl: String(job.hostedUrl || ""),
          applicationDeadline: null,
          postedAt: job.createdAt ? new Date(job.createdAt) : new Date(),
          salaryCurrency: "INR",
        });
      })
      .filter((job: Partial<IExternalJob>) => Boolean(job.externalId && job.applyUrl));
  } catch (err: any) {
    console.warn(`[Lever] Company ${company} failed: ${err.message}`);
    return [];
  }
}
