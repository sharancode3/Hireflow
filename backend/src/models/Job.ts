import mongoose, { Schema, Document } from "mongoose";

export type JobReviewStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_REVISION";

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  title: string;
  companyName: string;
  location: string;
  role: string;
  requiredSkills: string[];
  description: string;
  openToFreshers: boolean;
  jobType: "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT";
  minExperienceYears: number;
  reviewStatus: JobReviewStatus;
  adminFeedback?: string;
  reviewedAt?: Date;
  applicationDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    recruiterId: { type: Schema.Types.ObjectId, ref: "RecruiterProfile", required: true },
    title: { type: String, required: true, minlength: 2 },
    companyName: { type: String, required: true },
    location: { type: String, required: true },
    role: { type: String, required: true },
    requiredSkills: [{ type: String, trim: true }],
    description: { type: String, required: true, minlength: 20, maxlength: 5000 },
    openToFreshers: { type: Boolean, default: false },
    jobType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"],
      default: "FULL_TIME",
    },
    minExperienceYears: { type: Number, default: 0, min: 0, max: 60 },
    reviewStatus: {
      type: String,
      enum: ["PENDING_REVIEW", "APPROVED", "REJECTED", "NEEDS_REVISION"],
      default: "PENDING_REVIEW",
    },
    adminFeedback: String,
    reviewedAt: Date,
    applicationDeadline: Date,
  },
  { timestamps: true }
);

JobSchema.index({ recruiterId: 1, createdAt: -1 });
JobSchema.index({ reviewStatus: 1, createdAt: -1 });

export const Job = mongoose.model<IJob>("Job", JobSchema);
