import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  role: "JOB_SEEKER" | "RECRUITER";
  recruiterApprovalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["JOB_SEEKER", "RECRUITER"] },
    recruiterApprovalStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"] },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
