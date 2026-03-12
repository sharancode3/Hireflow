import axios from "axios";
import type { IExternalJob } from "../models/ExternalJob";
import { mapJobType, normalizeJob } from "../utils/jobNormalizer";

const BASE_URL = "https://jsearch.p.rapidapi.com/search";

export async function fetchJSearchJobs(query = "software developer India", page = 1) {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return [];

  const response = await axios.get(BASE_URL, {
    params: {
      query,
      page: page.toString(),
      num_pages: "1",
      country: "in",
      date_posted: "today",
    },
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
    timeout: 10000,
  });

  const jobs = response.data?.data || [];

  return jobs
    .map((job: any) =>
      normalizeJob({
        source: "jsearch",
        externalId: String(job.job_id || ""),
        title: String(job.job_title || ""),
        company: String(job.employer_name || "Unknown"),
        city: job.job_city,
        state: job.job_state,
        country: job.job_country || "India",
        isRemote: Boolean(job.job_is_remote),
        jobType: mapJobType(String(job.job_employment_type || "")),
        description: String(job.job_description || job.job_title || ""),
        skills: Array.isArray(job.job_required_skills) ? job.job_required_skills : [],
        applyUrl: String(job.job_apply_link || ""),
        applicationDeadline: job.job_offer_expiration_datetime_utc
          ? new Date(job.job_offer_expiration_datetime_utc)
          : null,
        postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : new Date(),
        salaryMin: typeof job.job_min_salary === "number" ? job.job_min_salary : undefined,
        salaryMax: typeof job.job_max_salary === "number" ? job.job_max_salary : undefined,
        salaryCurrency: "INR",
      }),
    )
    .filter((job: Partial<IExternalJob>) => Boolean(job.externalId && job.applyUrl));
}

export const JSEARCH_INDIA_QUERIES = [
  "software developer India",
  "frontend developer India",
  "backend developer India",
  "data analyst India",
  "product manager India",
  "UI UX designer India",
  "DevOps engineer India",
  "machine learning engineer India",
  "software internship India",
  "tech internship India 2025",
  "full stack developer India",
  "react developer India",
  "python developer India",
];
