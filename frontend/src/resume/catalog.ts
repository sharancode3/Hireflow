import type { ResumeSettings, ResumeTemplate } from "../types";

export type ResumeTemplateMeta = {
  id: ResumeTemplate;
  label: string;
  description: string;
};

export const templateCatalog: ResumeTemplateMeta[] = [
  {
    id: "MODERN",
    label: "ATS Modern (recommended)",
    description: "ATS-friendly, clean one-column layout optimized for readability and parsing.",
  },
  {
    id: "CLASSIC",
    label: "Professional (skill bars)",
    description: "Two-column professional layout with section dividers and optional skill bars.",
  },
  {
    id: "MINIMAL",
    label: "Technical (creative)",
    description: "Creative technical layout with highlights, timelines, and optional charts.",
  },
];

export function defaultResumeSettings(): ResumeSettings {
  return {
    sectionOrder: ["SUMMARY", "SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION", "CERTIFICATIONS", "ACHIEVEMENTS", "LANGUAGES"],
    hiddenSections: {},
    density: "NORMAL",
    accent: "ACCENT",
    showSkillBars: true,
    showCharts: true,
    showTimeline: true,
  };
}
