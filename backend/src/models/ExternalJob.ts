import mongoose, { Schema } from "mongoose";

export type ExternalJobSource =
  | "jsearch"
  | "adzuna"
  | "serpapi"
  | "greenhouse"
  | "lever"
  | "github_simplify"
  | "github_pittcsc";

export type ExternalJobType = "full_time" | "part_time" | "internship" | "contract" | "freelance";

export type ExternalExperienceLevel = "fresher" | "junior" | "mid" | "senior" | "lead" | "any";

export interface IExternalJob {
  externalId: string;
  source: ExternalJobSource;
  title: string;
  company: string;
  location: {
    city?: string;
    state?: string;
    country: string;
    isRemote: boolean;
    isHybrid: boolean;
    isOnsite: boolean;
  };
  jobType: ExternalJobType;
  experienceLevel: ExternalExperienceLevel;
  minExperienceYears: number;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  applyUrl: string;
  applicationDeadline?: Date;
  postedAt: Date;
  fetchedAt: Date;
  isActive: boolean;
  isVerified: boolean;
  contentHash: string;
}

const ExternalJobSchema = new Schema<IExternalJob>(
  {
    externalId: { type: String, required: true },
    source: {
      type: String,
      required: true,
      enum: ["jsearch", "adzuna", "serpapi", "greenhouse", "lever", "github_simplify", "github_pittcsc"],
    },
    title: { type: String, required: true, index: true },
    company: { type: String, required: true, index: true },
    location: {
      city: String,
      state: String,
      country: { type: String, default: "India" },
      isRemote: { type: Boolean, default: false },
      isHybrid: { type: Boolean, default: false },
      isOnsite: { type: Boolean, default: false },
    },
    jobType: { type: String, required: true },
    experienceLevel: { type: String, default: "any" },
    minExperienceYears: { type: Number, default: 0 },
    description: { type: String, required: true },
    responsibilities: [String],
    requirements: [String],
    skills: [{ type: String, lowercase: true, trim: true }],
    salaryMin: Number,
    salaryMax: Number,
    salaryCurrency: { type: String, default: "INR" },
    applyUrl: { type: String, required: true },
    applicationDeadline: Date,
    postedAt: { type: Date, required: true },
    fetchedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    contentHash: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "external_jobs",
  },
);

ExternalJobSchema.index({ source: 1, externalId: 1 }, { unique: true });
ExternalJobSchema.index({ isActive: 1, jobType: 1, postedAt: -1 });
ExternalJobSchema.index({ skills: 1, isActive: 1 });
ExternalJobSchema.index({ "location.country": 1, "location.city": 1, isActive: 1 });
ExternalJobSchema.index({ contentHash: 1 });
ExternalJobSchema.index({ applicationDeadline: 1 });

export const ExternalJob = mongoose.model<IExternalJob>("ExternalJob", ExternalJobSchema);
