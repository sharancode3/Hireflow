import md5 from "md5";
import type { ExternalJobType, ExternalExperienceLevel, ExternalJobSource, IExternalJob } from "../models/ExternalJob";

type RawJobInput = {
  source: ExternalJobSource;
  externalId: string;
  title: string;
  company: string;
  city?: string;
  state?: string;
  country?: string;
  isRemote?: boolean;
  isHybrid?: boolean;
  jobType: string;
  description: string;
  skills?: string[];
  applyUrl: string;
  applicationDeadline?: Date | null;
  postedAt: Date;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
};

export function normalizeJob(raw: RawJobInput): Partial<IExternalJob> {
  const jobType = normalizeJobType(raw.jobType, raw.title);
  const skills = normalizeSkills(raw.skills || [], raw.description);
  const contentHash = md5(
    `${raw.company.toLowerCase()}|${raw.title.toLowerCase()}|${raw.city?.toLowerCase() || ""}`,
  );

  const location: IExternalJob["location"] = {
    country: raw.country || "India",
    isRemote: raw.isRemote || false,
    isHybrid: raw.isHybrid || false,
    isOnsite: !raw.isRemote && !raw.isHybrid,
    ...(raw.city ? { city: cleanText(raw.city) } : {}),
    ...(raw.state ? { state: cleanText(raw.state) } : {}),
  };

  const deadline = raw.applicationDeadline || undefined;
  const salaryMin = raw.salaryMin;
  const salaryMax = raw.salaryMax;

  return {
    externalId: raw.externalId,
    source: raw.source,
    title: cleanText(raw.title),
    company: cleanText(raw.company),
    location,
    jobType,
    experienceLevel: detectExperienceLevel(raw.title, raw.description),
    minExperienceYears: detectMinExperience(raw.description),
    description: cleanText(raw.description).slice(0, 5000),
    skills,
    ...(typeof salaryMin === "number" ? { salaryMin } : {}),
    ...(typeof salaryMax === "number" ? { salaryMax } : {}),
    salaryCurrency: raw.salaryCurrency || "INR",
    applyUrl: raw.applyUrl,
    ...(deadline ? { applicationDeadline: deadline } : {}),
    postedAt: raw.postedAt,
    fetchedAt: new Date(),
    isActive: isJobStillActive(raw.applicationDeadline, raw.postedAt),
    isVerified: false,
    contentHash,
  };
}

function normalizeJobType(type: string, title: string): ExternalJobType {
  const t = (type + " " + title).toLowerCase();
  if (t.includes("intern")) return "internship";
  if (t.includes("part") && t.includes("time")) return "part_time";
  if (t.includes("freelance")) return "freelance";
  if (t.includes("contract") || t.includes("consultant")) return "contract";
  return "full_time";
}

function detectExperienceLevel(title: string, desc: string): ExternalExperienceLevel {
  const text = (title + " " + desc).toLowerCase();
  if (text.includes("intern") || text.includes("fresher") || text.includes("0-1") || text.includes("entry")) {
    return "fresher";
  }
  if (text.includes("lead")) return "lead";
  if (text.includes("senior") || text.includes("staff")) return "senior";
  if (text.includes("junior") || text.includes("1-3 years") || text.includes("2 years")) return "junior";
  if (text.includes("mid") || text.includes("3-5 years") || text.includes("4 years")) return "mid";
  return "any";
}

function detectMinExperience(desc: string): number {
  const match = desc.match(/(\d+)\+?\s*(?:to\s*\d+)?\s*years?\s*(?:of\s*)?(?:experience)?/i);
  return match?.[1] ? Math.min(parseInt(match[1], 10), 20) : 0;
}

function isJobStillActive(deadline: Date | null | undefined, postedAt: Date): boolean {
  if (deadline && new Date() > deadline) return false;
  const maxAge = 60 * 24 * 60 * 60 * 1000;
  return Date.now() - postedAt.getTime() < maxAge;
}

const SKILL_KEYWORDS = [
  "react",
  "vue",
  "angular",
  "javascript",
  "typescript",
  "python",
  "java",
  "golang",
  "rust",
  "kotlin",
  "swift",
  "nodejs",
  "express",
  "fastapi",
  "django",
  "flask",
  "spring",
  "rails",
  "laravel",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "terraform",
  "ansible",
  "jenkins",
  "github actions",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "elasticsearch",
  "kafka",
  "rabbitmq",
  "html",
  "css",
  "tailwind",
  "sass",
  "figma",
  "machine learning",
  "deep learning",
  "nlp",
  "computer vision",
  "pytorch",
  "tensorflow",
  "scikit-learn",
  "sql",
  "nosql",
  "graphql",
  "rest api",
  "grpc",
  "microservices",
  "ci/cd",
  "agile",
  "scrum",
  "android",
  "ios",
  "flutter",
  "react native",
  "git",
  "linux",
  "bash",
  "data structures",
  "algorithms",
];

export function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(lower);
  });
}

function normalizeSkills(rawSkills: string[], description: string): string[] {
  const fromRaw = rawSkills.map((s) => s.toLowerCase().trim()).filter(Boolean);
  const fromDesc = extractSkillsFromText(description);
  return [...new Set([...fromRaw, ...fromDesc])].slice(0, 20);
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectJobType(title: string, desc: string): string {
  return normalizeJobType("", title + " " + (desc || ""));
}

export { detectJobType };

function mapJobType(employmentType: string): string {
  const t = (employmentType || "").toUpperCase();
  if (t === "FULLTIME" || t === "FULL_TIME") return "full_time";
  if (t === "PARTTIME" || t === "PART_TIME") return "part_time";
  if (t === "INTERN") return "internship";
  if (t === "CONTRACTOR") return "contract";
  return "full_time";
}

export { mapJobType };

function parseCity(location: string | undefined): string {
  if (!location) return "";
  return location.split(",")?.[0]?.trim() || "";
}

export { parseCity };

function parseSalary(salaryStr: string | undefined): { min?: number; max?: number } | null {
  if (!salaryStr) return null;
  const numbers = salaryStr.match(/[\d,]+/g)?.map((n) => parseInt(n.replace(/,/g, ""), 10));
  if (!numbers?.length) return null;
  const min = numbers[0];
  const max = numbers[1];
  return {
    ...(typeof min === "number" ? { min } : {}),
    ...(typeof max === "number" ? { max } : {}),
  };
}

export { parseSalary };

function parseRelativeDate(relativeStr: string | undefined): Date | null {
  if (!relativeStr) return null;
  const now = new Date();
  if (relativeStr.includes("hour") || relativeStr.includes("today")) return now;
  const days = parseInt(relativeStr.match(/(\d+)\s*day/)?.[1] || "0", 10);
  if (days) {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  }
  return null;
}

export { parseRelativeDate };

function parseHumanDate(str: string): Date | null {
  if (!str) return null;
  try {
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export { parseHumanDate };
