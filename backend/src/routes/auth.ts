import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { JobSeekerProfile } from "../models/JobSeekerProfile";
import { RecruiterProfile } from "../models/RecruiterProfile";
import { HttpError } from "../utils/httpError";
import { signAccessToken } from "../utils/authTokens";
import { env } from "../env";
import { sendTransactionalEmail } from "../utils/emailAutomation";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["JOB_SEEKER", "RECRUITER"]).optional(),
  fullName: z.string().min(2).optional(),
  jobSeeker: z.object({ fullName: z.string().min(2) }).optional(),
  recruiter: z.object({ companyName: z.string().min(2) }).optional(),
});

authRouter.get("/auth/check-email", async (req, res, next) => {
  try {
    const email = z.string().email().parse(req.query.email);
    const existing = await User.findOne({ email: email.toLowerCase() });
    res.json({ exists: Boolean(existing) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/auth/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const role = body.role ?? "JOB_SEEKER";
    const jobSeekerFullName = body.jobSeeker?.fullName ?? body.fullName;

    if (role === "JOB_SEEKER" && !jobSeekerFullName) throw new HttpError(400, "Job seeker details required");
    if (role === "RECRUITER" && !body.recruiter) throw new HttpError(400, "Recruiter details required");

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) throw new HttpError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({ email: body.email.toLowerCase(), passwordHash, role });

    if (role === "JOB_SEEKER") {
      const fullName = jobSeekerFullName as string;
      await JobSeekerProfile.create({ userId: user._id, fullName });
    } else {
      await RecruiterProfile.create({ userId: user._id, companyName: body.recruiter!.companyName });
    }

    const token = signAccessToken(user._id.toString());
    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

const recruiterRegisterSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[A-Za-z][A-Za-z\s'-]{1,79}$/, "Please enter a valid full name (letters and spaces only)."),
  email: z.string().trim().email(),
  password: z.string().min(8),
  companyName: z.string().trim().min(2).max(100),
  companyWebsite: z
    .string()
    .trim()
    .url("Please enter a valid URL, e.g. https://yourcompany.com")
    .regex(/^https?:\/\//i, "Please enter a valid URL, e.g. https://yourcompany.com"),
  designation: z.string().trim().min(3),
  phone: z.string().trim().min(8),
});

authRouter.post("/auth/recruiter/register", async (req, res, next) => {
  try {
    const body = recruiterRegisterSchema.parse(req.body);
    const email = body.email.toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) throw new HttpError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      email,
      passwordHash,
      role: "RECRUITER",
      recruiterApprovalStatus: "PENDING",
    } as any);

    await RecruiterProfile.create({
      userId: user._id,
      companyName: body.companyName,
      website: body.companyWebsite,
      description: body.designation,
      phone: body.phone,
    } as any);

    const token = signAccessToken(user._id.toString());
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        recruiterApprovalStatus: "PENDING",
      },
    });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["JOB_SEEKER", "RECRUITER"]).optional(),
});

authRouter.post("/auth/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");
    if (body.role && user.role !== body.role) throw new HttpError(403, "Role mismatch");

    const token = signAccessToken(user._id.toString());
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, recruiterApprovalStatus: (user as any).recruiterApprovalStatus } });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/auth/me", async (req, res, next) => {
  try {
    const header = req.header("authorization");
    if (!header) throw new HttpError(401, "Missing Authorization header");
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) throw new HttpError(401, "Invalid header");

    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };

    const user = await User.findById(payload.userId).select("email role recruiterApprovalStatus");
    if (!user) throw new HttpError(401, "User not found");

    res.json({ user: { id: user._id, email: user.email, role: user.role, recruiterApprovalStatus: (user as any).recruiterApprovalStatus } });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/auth/recruiter/resend-verification", async (req, res, next) => {
  try {
    const header = req.header("authorization");
    if (!header) throw new HttpError(401, "Missing Authorization header");
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) throw new HttpError(401, "Invalid header");

    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await User.findById(payload.userId).select("email role recruiterApprovalStatus");
    if (!user) throw new HttpError(401, "User not found");
    if (user.role !== "RECRUITER") throw new HttpError(403, "Forbidden");
    if ((user as any).recruiterApprovalStatus !== "PENDING") {
      throw new HttpError(400, "Verification email can only be resent for pending recruiter accounts");
    }

    await sendTransactionalEmail({
      to: user.email,
      category: "APPLICATION_STATUS_UPDATED",
      subject: "Recruiter verification review in progress",
      text: "Your recruiter application is still under review. We will notify you once approved.",
    });

    res.json({ ok: true, message: "Verification email resent" });
  } catch (err) {
    next(err);
  }
});
