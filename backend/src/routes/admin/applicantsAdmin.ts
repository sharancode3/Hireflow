import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../../middleware/auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../supabase";
import { HttpError } from "../../utils/httpError";

export const applicantsAdminRouter = Router();

const appStatusSchema = z.enum(["APPLIED", "SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED", "OFFERED", "HIRED"]);

applicantsAdminRouter.patch("/admin/applications/:applicationId", requireAdmin(), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new HttpError(503, "Supabase is not configured on the backend");
    }

    const { applicationId } = z.object({ applicationId: z.string().uuid() }).parse(req.params);
    const body = z.object({
      status: appStatusSchema,
      interviewAt: z.string().datetime().nullable().optional(),
    }).parse(req.body);

    const payload: Record<string, string | null> = {
      status: body.status,
      interview_at: body.status === "INTERVIEW_SCHEDULED" ? (body.interviewAt || null) : null,
    };

    const supabase = getSupabaseAdmin();
    const { data: updated, error } = await supabase
      .from("applications")
      .update(payload)
      .eq("id", applicationId)
      .select("id,status,interview_at")
      .single();

    if (error) throw new HttpError(500, error.message);

    res.json({ application: updated });
  } catch (err) {
    next(err);
  }
});
