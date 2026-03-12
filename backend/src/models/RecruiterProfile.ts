import mongoose, { Schema, Document } from "mongoose";

export interface IRecruiterProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  companyName: string;
  website?: string;
  location?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecruiterProfileSchema = new Schema<IRecruiterProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, minlength: 2 },
    website: String,
    location: String,
    description: String,
  },
  { timestamps: true }
);

export const RecruiterProfile = mongoose.model<IRecruiterProfile>("RecruiterProfile", RecruiterProfileSchema);
