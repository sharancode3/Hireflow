import axios from "axios";
import type { IExternalJob } from "../models/ExternalJob";
import { detectJobType, extractSkillsFromText, normalizeJob, parseRelativeDate, parseSalary } from "../utils/jobNormalizer";

const BASE_URL = "https://serpapi.com/search";

export async function fetchGoogleJobs(query = "software engineer India", nextPageToken?: string) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return { jobs: [] as ReturnType<typeof normalizeJob>[], nextPageToken: undefined as string | undefined };

  const params: Record<string, string> = {
    engine: "google_jobs",
    q: query,
    location: "India",
    gl: "in",
    hl: "en",
    api_key: apiKey,
    chips: "date_posted:today",
  };

  if (nextPageToken) params.next_page_token = nextPageToken;

  const response = await axios.get(BASE_URL, { params, timeout: 15000 });
  const jobs = response.data?.jobs_results || [];

  return {
    jobs: jobs
      .map((job: any) => {
        const city = String(job.location || "").split(",")[0]?.trim() || "";
        const state = String(job.location || "").split(",")?.[1]?.trim() || "";
        const parsedSalary = parseSalary(job.detected_extensions?.salary);
        const salaryMin = parsedSalary?.min;
        const salaryMax = parsedSalary?.max;

        return normalizeJob({
          source: "serpapi",
          externalId:
            String(job.job_id || "") ||
            `serp_${Buffer.from(String(job.title || "") + String(job.company_name || "")).toString("base64")}`,
          title: String(job.title || ""),
          company: String(job.company_name || "Unknown"),
          ...(city ? { city } : {}),
          ...(state ? { state } : {}),
          country: "India",
          isRemote: String(job.location || "").toLowerCase().includes("remote"),
          jobType: detectJobType(String(job.title || ""), String(job.description || "")),
          description: String(job.description || job.title || ""),
          skills:
            job.job_highlights?.Qualifications?.flatMap((q: string) => extractSkillsFromText(String(q || ""))) || [],
          applyUrl: String(job.related_links?.[0]?.link || job.share_link || ""),
          applicationDeadline: null,
          postedAt: parseRelativeDate(job.detected_extensions?.posted_at) || new Date(),
          ...(typeof salaryMin === "number" ? { salaryMin } : {}),
          ...(typeof salaryMax === "number" ? { salaryMax } : {}),
          salaryCurrency: "INR",
        });
      })
      .filter((job: Partial<IExternalJob>) => Boolean(job.applyUrl)),
    nextPageToken: response.data?.serpapi_pagination?.next_page_token as string | undefined,
  };
}
