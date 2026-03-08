import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../prisma";
import { HttpError } from "../utils/httpError";
import { signAccessToken } from "../utils/authTokens";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["JOB_SEEKER", "RECRUITER"]),
  jobSeeker: z
    .object({
      fullName: z.string().min(2),
    })
    .optional(),
  recruiter: z
    .object({
      companyName: z.string().min(2),
    })
    .optional(),
});

authRouter.post("/auth/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    if (body.role === "JOB_SEEKER" && !body.jobSeeker) {
      throw new HttpError(400, "Job seeker details required");
    }
    if (body.role === "RECRUITER" && !body.recruiter) {
      throw new HttpError(400, "Recruiter details required");
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new HttpError(409, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: body.role,
        ...(body.role === "JOB_SEEKER"
          ? {
              jobSeekerProfile: {
                create: {
                  fullName: body.jobSeeker!.fullName,
                },
              },
            }
          : {}),
        ...(body.role === "RECRUITER"
          ? {
              recruiterProfile: {
                create: {
                  companyName: body.recruiter!.companyName,
                },
              },
            }
          : {}),
      },
      select: { id: true, role: true, email: true },
    });

    const token = signAccessToken(user.id);

    res.status(201).json({
      token,
      user,
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

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "Invalid credentials");
    }

    if (body.role && user.role !== body.role) {
      throw new HttpError(403, "Selected role does not match this account");
    }

    const token = signAccessToken(user.id);

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/auth/me", async (req, res, next) => {
  try {
    const header = req.header("authorization");
    if (!header) throw new HttpError(401, "Missing Authorization header");

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) throw new HttpError(401, "Invalid Authorization header");

    // Delegate verification to middleware-style helper
    // (kept inline here to avoid circular deps)
    const jwt = await import("jsonwebtoken");
    const { env } = await import("../env");
    const payload: unknown = jwt.default.verify(token, env.JWT_SECRET);
    const parsed = z.object({ userId: z.string().min(1) }).parse(payload);

    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new HttpError(401, "User not found");

    res.json({ user });
  } catch (err) {
    next(err);
  }
});
