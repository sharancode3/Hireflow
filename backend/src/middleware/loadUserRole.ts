import type { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma";
import { HttpError } from "../utils/httpError";
import type { AuthenticatedRequest } from "./auth";

export async function loadUserRole(req: Request, _res: Response, next: NextFunction) {
  const authed = req as AuthenticatedRequest;
  const user = await prisma.user.findUnique({
    where: { id: authed.auth.userId },
    select: { role: true },
  });

  if (!user) {
    return next(new HttpError(401, "User not found"));
  }

  (req as AuthenticatedRequest & { userRole: string }).userRole = user.role;
  return next();
}
