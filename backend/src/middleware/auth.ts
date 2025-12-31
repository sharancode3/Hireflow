import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../env";
import { HttpError } from "../utils/httpError";

const tokenPayloadSchema = z.object({
  userId: z.string().min(1),
});

export type AuthenticatedRequest = Request & { auth: { userId: string } };

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
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
