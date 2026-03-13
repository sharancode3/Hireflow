import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../env";
import { HttpError } from "../utils/httpError";
import { User } from "../models/User";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase";

const tokenPayloadSchema = z.object({
  userId: z.string().min(1),
});

export type AuthenticatedRequest = Request & { auth: { userId: string } };

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header) {
    return next(new HttpError(401, "Missing Authorization header"));
  }

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return next(new HttpError(401, "Invalid Authorization header"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const parsed = tokenPayloadSchema.parse(payload);
    (req as AuthenticatedRequest).auth = { userId: parsed.userId };
    return next();
  } catch {
    // Fall through to Supabase token verification.
  }

  if (!isSupabaseConfigured()) {
    return next(new HttpError(401, "Invalid or expired token"));
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return next(new HttpError(401, "Invalid or expired token"));
    }

    (req as AuthenticatedRequest).auth = { userId: data.user.id };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(role: "JOB_SEEKER" | "RECRUITER") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const anyReq = req as AuthenticatedRequest & { userRole?: string };
    if (!anyReq.userRole) {
      return next(new HttpError(500, "Auth role not loaded"));
    }
    if (anyReq.userRole !== role) {
      return next(new HttpError(403, "Forbidden"));
    }
    return next();
  };
}

export function requireAdmin() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const anyReq = req as AuthenticatedRequest;
    const user = await User.findById(anyReq.auth.userId).select("email");

    if (!user) {
      return next(new HttpError(401, "User not found"));
    }

    const allowlist = env.ADMIN_EMAILS.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (!allowlist.includes(user.email.toLowerCase())) {
      return next(new HttpError(403, "Admin access required"));
    }

    return next();
  };
}
