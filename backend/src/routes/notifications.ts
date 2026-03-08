import { Router } from "express";
import { prisma } from "../prisma";
import type { AuthenticatedRequest } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", async (req, res) => {
  const authed = req as unknown as AuthenticatedRequest;

  const notifications = await prisma.notification.findMany({
    where: { userId: authed.auth.userId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ notifications });
});

notificationsRouter.post("/notifications/:id/read", async (req, res) => {
  const authed = req as unknown as AuthenticatedRequest;
  const id = req.params.id;

  await prisma.notification.updateMany({
    where: { id, userId: authed.auth.userId },
    data: { isRead: true },
  });

  res.json({ ok: true });
});

notificationsRouter.post("/notifications/read-all", async (req, res) => {
  const authed = req as unknown as AuthenticatedRequest;

  await prisma.notification.updateMany({
    where: { userId: authed.auth.userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ ok: true });
});
