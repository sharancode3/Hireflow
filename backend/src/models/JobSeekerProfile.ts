import mongoose, { Schema, Document } from "mongoose";

export interface IJobSeekerProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fullName: string;
  phone?: string;
  location?: string;
  experienceYears: number;
  skills: string[];
  desiredRole?: string;
  isFresher: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: Date;
  updatedAt: Date;
}

const JobSeekerProfileSchema = new Schema<IJobSeekerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true, minlength: 2 },
    phone: String,
    location: String,
    experienceYears: { type: Number, default: 0, min: 0, max: 60 },
    skills: [{ type: String, lowercase: true, trim: true }],
    desiredRole: String,
    isFresher: { type: Boolean, default: false },
    visibility: { type: String, enum: ["PUBLIC", "PRIVATE"], default: "PUBLIC" },
  },
  { timestamps: true }
);

export const JobSeekerProfile = mongoose.model<IJobSeekerProfile>("JobSeekerProfile", JobSeekerProfileSchema);
