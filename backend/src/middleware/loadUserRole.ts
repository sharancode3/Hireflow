import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import type { AuthenticatedRequest } from "./auth";
import { User } from "../models/User";

export async function loadUserRole(req: Request, _res: Response, next: NextFunction) {
  const authed = req as AuthenticatedRequest;
  const user = await User.findById(authed.auth.userId).select("role");

  if (!user) {
    return next(new HttpError(401, "User not found"));
  }

  (req as AuthenticatedRequest & { userRole: string }).userRole = user.role;
  return next();
}
