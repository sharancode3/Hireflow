import axios from "axios";
import type { IExternalJob } from "../models/ExternalJob";
import { extractSkillsFromText, normalizeJob } from "../utils/jobNormalizer";

const SIMPLIFY_URL =
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json";

export async function fetchSimplifyInternships() {
  try {
    const response = await axios.get(SIMPLIFY_URL, { timeout: 15000 });
    const listings = response.data || [];

    return listings
      .filter((job: any) => {
        return job.active !== false && job.url && job.url !== "🔒" && String(job.url).startsWith("http");
      })
      .map((job: any) =>
        normalizeJob({
          source: "github_simplify",
          externalId:
            String(job.id || "") ||
            `simplify_${Buffer.from(String(job.company_name || "") + String(job.title || "")).toString("base64").slice(0, 16)}`,
          title: String(job.title || "Software Engineering Intern"),
          company: String(job.company_name || "Unknown"),
          city: parseLocationFromArray(job.locations),
          country: "India",
          isRemote: Boolean(job.locations?.some((l: string) => String(l).toLowerCase().includes("remote"))),
          jobType: "internship",
          description: `${job.title || "Internship"} internship at ${job.company_name || "Unknown"}. ${job.notes || ""}`,
          skills: extractSkillsFromText([job.title, job.notes || ""].join(" ")),
          applyUrl: String(job.url || ""),
          applicationDeadline: null,
          postedAt: job.date_updated ? new Date(job.date_updated * 1000) : new Date(),
          salaryCurrency: "INR",
        }),
      )
        .filter((job: Partial<IExternalJob>) => Boolean(job.applyUrl));
  } catch (err: any) {
    console.error("[GitHub Simplify] Fetch failed:", err.message);
    return [];
  }
}

function parseLocationFromArray(locations: string[] | undefined): string {
  if (!locations?.length) return "";
  return String(locations[0] || "").split(",")?.[0]?.trim() || "";
}
