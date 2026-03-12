import mongoose, { Schema, Document } from "mongoose";

export type ApplicationStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "REJECTED"
  | "INTERVIEW_SCHEDULED"
  | "OFFERED"
  | "HIRED";

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  jobSeekerId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  interviewAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    jobSeekerId: { type: Schema.Types.ObjectId, ref: "JobSeekerProfile", required: true },
    status: {
      type: String,
      enum: ["APPLIED", "SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED", "OFFERED", "HIRED"],
      default: "APPLIED",
    },
    interviewAt: Date,
  },
  { timestamps: true }
);

ApplicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });
ApplicationSchema.index({ jobSeekerId: 1, createdAt: -1 });
ApplicationSchema.index({ jobId: 1, createdAt: -1 });

export const Application = mongoose.model<IApplication>("Application", ApplicationSchema);
