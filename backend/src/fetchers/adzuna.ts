import axios from "axios";
import type { IExternalJob } from "../models/ExternalJob";
import { extractSkillsFromText, normalizeJob } from "../utils/jobNormalizer";

const BASE_URL = "https://api.adzuna.com/v1/api/jobs/in/search";

export async function fetchAdzunaJobs(keywords = "developer", page = 1) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const response = await axios.get(`${BASE_URL}/${page}`, {
    params: {
      app_id: appId,
      app_key: appKey,
      results_per_page: 20,
      what: keywords,
      where: "India",
      content_type: "application/json",
      sort_by: "date",
    },
    timeout: 10000,
  });

  const results = response.data?.results || [];

  return results
    .map((job: any) =>
      normalizeJob({
        source: "adzuna",
        externalId: String(job.id || ""),
        title: String(job.title || ""),
        company: String(job.company?.display_name || "Unknown"),
        city: job.location?.area?.[2] || job.location?.display_name,
        country: "India",
        isRemote: String(job.title || "").toLowerCase().includes("remote"),
        jobType:
          job.contract_type === "permanent"
            ? "full_time"
            : job.contract_type === "contract"
              ? "contract"
              : "full_time",
        description: String(job.description || job.title || ""),
        skills: extractSkillsFromText(String(job.description || "")),
        applyUrl: String(job.redirect_url || ""),
        applicationDeadline: null,
        postedAt: job.created ? new Date(job.created) : new Date(),
        salaryMin: typeof job.salary_min === "number" ? job.salary_min : undefined,
        salaryMax: typeof job.salary_max === "number" ? job.salary_max : undefined,
        salaryCurrency: "INR",
      }),
    )
    .filter((job: Partial<IExternalJob>) => Boolean(job.externalId && job.applyUrl));
}

export const ADZUNA_KEYWORD_LIST = [
  "software engineer",
  "frontend developer",
  "backend developer",
  "full stack",
  "data scientist",
  "product manager",
  "UX designer",
  "android developer",
  "ios developer",
  "cloud engineer",
];
