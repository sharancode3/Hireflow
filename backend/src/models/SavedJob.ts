import mongoose, { Schema, Document } from "mongoose";

export interface ISavedJob extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  jobSeekerId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SavedJobSchema = new Schema<ISavedJob>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    jobSeekerId: { type: Schema.Types.ObjectId, ref: "JobSeekerProfile", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SavedJobSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });
SavedJobSchema.index({ jobSeekerId: 1, createdAt: -1 });

export const SavedJob = mongoose.model<ISavedJob>("SavedJob", SavedJobSchema);
