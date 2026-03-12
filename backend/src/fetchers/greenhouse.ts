import axios from "axios";
import type { IExternalJob } from "../models/ExternalJob";
import { detectJobType, extractSkillsFromText, normalizeJob, parseCity } from "../utils/jobNormalizer";

export const GREENHOUSE_BOARDS = [
  "swiggy",
  "zomato",
  "razorpay",
  "freshworks",
  "browserstack",
  "chargebee",
  "postman",
  "clevertap",
  "unacademy",
  "vedantu",
  "cred-club",
  "slice",
  "zepto",
  "meesho",
  "sharechat",
  "groww",
  "smallcase",
  "cashfree",
  "cashkaro",
  "moengage",
];

export async function fetchGreenhouseJobs(boardToken: string) {
  try {
    const response = await axios.get(
      `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`,
      { timeout: 8000 },
    );

    const jobs = response.data?.jobs || [];

    return jobs
      .filter((job: any) => {
        const location = String(job.location?.name || "").toLowerCase();
        return (
          location.includes("india") ||
          location.includes("remote") ||
          location.includes("bangalore") ||
          location.includes("mumbai") ||
          location.includes("hyderabad") ||
          location.includes("pune") ||
          location.includes("chennai") ||
          location.includes("delhi")
        );
      })
      .map((job: any) =>
        normalizeJob({
          source: "greenhouse",
          externalId: `gh_${boardToken}_${job.id}`,
          title: String(job.title || ""),
          company: boardToken.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          city: parseCity(job.location?.name),
          country: "India",
          isRemote: String(job.location?.name || "").toLowerCase().includes("remote"),
          jobType: detectJobType(String(job.title || ""), String(job.content || "")),
          description: String(job.content || job.title || ""),
          skills: extractSkillsFromText(String(job.content || "")),
          applyUrl: String(job.absolute_url || ""),
          applicationDeadline: null,
          postedAt: job.updated_at ? new Date(job.updated_at) : new Date(),
          salaryCurrency: "INR",
        }),
      )
        .filter((job: Partial<IExternalJob>) => Boolean(job.applyUrl));
  } catch (err: any) {
    console.warn(`[Greenhouse] Board ${boardToken} fetch failed: ${err.message}`);
    return [];
  }
}
