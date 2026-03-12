import mongoose, { Schema, Document } from "mongoose";

export interface IResume extends Document {
  _id: mongoose.Types.ObjectId;
  jobSeekerId: mongoose.Types.ObjectId;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    jobSeekerId: { type: Schema.Types.ObjectId, ref: "JobSeekerProfile", required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ResumeSchema.index({ jobSeekerId: 1, createdAt: -1 });

export const Resume = mongoose.model<IResume>("Resume", ResumeSchema);
