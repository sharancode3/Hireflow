import axios from "axios";
import { extractSkillsFromText, normalizeJob, parseHumanDate } from "../utils/jobNormalizer";

const PITTCSC_README_URL = "https://raw.githubusercontent.com/pittcsc/Summer2026-Internships/dev/README.md";

export async function fetchPittCSCInternships() {
  try {
    const response = await axios.get(PITTCSC_README_URL, { timeout: 15000 });
    const markdown = String(response.data || "");

    const rows = markdown
      .split("\n")
      .filter((line) => line.startsWith("| ") && !line.includes("---") && !line.includes("Company"))
      .map((line) => {
        const cols = line
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
        return {
          company: stripMarkdown(cols[0] || ""),
          title: stripMarkdown(cols[1] || ""),
          location: stripMarkdown(cols[2] || ""),
          applicationStatus: cols[3] || "",
          datePosted: stripMarkdown(cols[4] || ""),
          notes: cols[5] ? stripMarkdown(cols[5]) : "",
        };
      })
      .filter((row) => row.applicationStatus && !row.applicationStatus.includes("🔒") && row.company && row.title);

    return rows
      .map((row) => {
        const linkMatch = row.applicationStatus.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
        const applyUrl = linkMatch?.[1] || null;
        if (!applyUrl) return null;

        return normalizeJob({
          source: "github_pittcsc",
          externalId: `pittcsc_${Buffer.from(row.company + row.title).toString("base64").slice(0, 16)}`,
          title: row.title,
          company: row.company,
          city: row.location?.split(",")?.[0]?.trim() || "",
          country: "India",
          isRemote: row.location?.toLowerCase().includes("remote") || false,
          jobType: "internship",
          description: `${row.title} at ${row.company}. Location: ${row.location}. ${row.notes}`,
          skills: extractSkillsFromText(`${row.title} ${row.notes}`),
          applyUrl,
          applicationDeadline: null,
          postedAt: parseHumanDate(row.datePosted) || new Date(),
          salaryCurrency: "INR",
        });
      })
      .filter((j): j is NonNullable<typeof j> => Boolean(j));
  } catch (err: any) {
    console.error("[GitHub PittCSC] Fetch failed:", err.message);
    return [];
  }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .trim();
}
