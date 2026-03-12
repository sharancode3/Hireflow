import { Router } from "express";
import { Notification } from "../models/Notification";
import type { AuthenticatedRequest } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", async (req, res) => {
  const authed = req as AuthenticatedRequest;
  const notifications = await Notification.find({ userId: authed.auth.userId }).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
});

notificationsRouter.post("/notifications/:id/read", async (req, res) => {
  const authed = req as unknown as AuthenticatedRequest;
  await Notification.updateMany({ _id: req.params.id, userId: authed.auth.userId }, { $set: { isRead: true } });
  res.json({ ok: true });
});

notificationsRouter.post("/notifications/read-all", async (req, res) => {
  const authed = req as AuthenticatedRequest;
  await Notification.updateMany({ userId: authed.auth.userId, isRead: false }, { $set: { isRead: true } });
  res.json({ ok: true });
});
