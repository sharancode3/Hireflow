import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth";
import { HttpError } from "../../utils/httpError";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../supabase";

export const recruiterSupabaseRouter = Router();

const appStatusSchema = z.enum(["APPLIED", "SHORTLISTED", "REJECTED", "INTERVIEW_SCHEDULED", "OFFERED", "HIRED"]);

const jobCreateSchema = z.object({
  title: z.string().trim().min(2),
  companyName: z.string().trim().min(2).optional(),
  location: z.string().trim().min(2),
  role: z.string().trim().min(2),
  requiredSkills: z.array(z.string().trim().min(1)).min(1).max(50),
  description: z.string().trim().min(20).max(5000),
  openToFreshers: z.boolean().default(false),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]).default("FULL_TIME"),
  minExperienceYears: z.number().int().min(0).max(60).default(0),
  applicationDeadline: z.string().datetime().nullable().optional(),
});

const recruiterProfileUpdateSchema = z.object({
  companyName: z.string().trim().min(2).optional(),
  website: z.string().trim().url().nullable().optional(),
  location: z.string().trim().min(2).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

type RecruiterContext = {
  userId: string;
  email: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  companyName: string;
};

async function getRecruiterContext(userId: string): Promise<RecruiterContext> {
  if (!isSupabaseConfigured()) {
    throw new HttpError(503, "Supabase is not configured on the backend");
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role,recruiter_approval_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw new HttpError(500, profileError.message);
  if (!profile) throw new HttpError(404, "Profile not found");
  if (profile.role !== "RECRUITER") throw new HttpError(403, "Forbidden");

  const { data: recruiterProfile, error: recruiterProfileError } = await supabase
    .from("recruiter_profiles")
    .select("company_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (recruiterProfileError) throw new HttpError(500, recruiterProfileError.message);

  return {
    userId,
    email: profile.email,
    approvalStatus: (profile.recruiter_approval_status || "PENDING") as RecruiterContext["approvalStatus"],
    companyName: recruiterProfile?.company_name || "Recruiter",
  };
}

function mapJob(row: any) {
  return {
    id: row.id,
    recruiterId: row.recruiter_id,
    title: row.title,
    companyName: row.company_name,
    location: row.location,
    role: row.role,
    requiredSkills: row.required_skills || [],
    jobType: row.job_type,
    minExperienceYears: row.min_experience_years,
    description: row.description,
    openToFreshers: row.open_to_freshers,
    reviewStatus: row.review_status,
    adminFeedback: row.admin_feedback,
    reviewedAt: row.reviewed_at,
    applicationDeadline: row.application_deadline,
    createdAt: row.created_at,
  };
}

recruiterSupabaseRouter.get("/recruiter/profile", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const ctx = await getRecruiterContext(authed.auth.userId);
    const supabase = getSupabaseAdmin();

    const [{ data: recruiterProfile, error: recruiterProfileError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from("recruiter_profiles")
        .select("company_name,company_website,designation,bio")
        .eq("user_id", ctx.userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("location")
        .eq("id", ctx.userId)
        .maybeSingle(),
    ]);

    if (recruiterProfileError) throw new HttpError(500, recruiterProfileError.message);
    if (profileError) throw new HttpError(500, profileError.message);

    res.json({
      profile: {
        id: ctx.userId,
        userId: ctx.userId,
        companyName: recruiterProfile?.company_name || ctx.companyName,
        website: recruiterProfile?.company_website || null,
        location: profile?.location || null,
        description: recruiterProfile?.bio || recruiterProfile?.designation || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

recruiterSupabaseRouter.patch("/recruiter/profile", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const body = recruiterProfileUpdateSchema.parse(req.body);
    const ctx = await getRecruiterContext(authed.auth.userId);
    const supabase = getSupabaseAdmin();

    const recruiterPayload: Record<string, string | null> = {};
    if (body.companyName !== undefined) recruiterPayload.company_name = body.companyName;
    if (body.website !== undefined) recruiterPayload.company_website = body.website;
    if (body.description !== undefined) {
      recruiterPayload.bio = body.description;
      recruiterPayload.designation = body.description;
    }

    if (Object.keys(recruiterPayload).length > 0) {
      const { error: recruiterError } = await supabase
        .from("recruiter_profiles")
        .upsert({ user_id: ctx.userId, ...recruiterPayload }, { onConflict: "user_id" });
      if (recruiterError) throw new HttpError(500, recruiterError.message);
    }

    if (body.location !== undefined) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ location: body.location })
        .eq("id", ctx.userId);
      if (profileError) throw new HttpError(500, profileError.message);
    }

    const [{ data: recruiterProfile, error: recruiterProfileError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from("recruiter_profiles")
        .select("company_name,company_website,designation,bio")
        .eq("user_id", ctx.userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("location")
        .eq("id", ctx.userId)
        .maybeSingle(),
    ]);

    if (recruiterProfileError) throw new HttpError(500, recruiterProfileError.message);
    if (profileError) throw new HttpError(500, profileError.message);

    res.json({
      profile: {
        id: ctx.userId,
        userId: ctx.userId,
        companyName: recruiterProfile?.company_name || ctx.companyName,
        website: recruiterProfile?.company_website || null,
        location: profile?.location || null,
        description: recruiterProfile?.bio || recruiterProfile?.designation || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

recruiterSupabaseRouter.get("/recruiter/jobs", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const ctx = await getRecruiterContext(authed.auth.userId);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("jobs")
      .select("id,recruiter_id,title,company_name,location,role,required_skills,job_type,min_experience_years,description,open_to_freshers,review_status,admin_feedback,reviewed_at,application_deadline,created_at")
      .eq("recruiter_id", ctx.userId)
      .order("created_at", { ascending: false });

    if (error) throw new HttpError(500, error.message);

    res.json({ jobs: (data || []).map(mapJob) });
  } catch (err) {
    next(err);
  }
});

recruiterSupabaseRouter.post("/recruiter/jobs", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const body = jobCreateSchema.parse(req.body);
    const ctx = await getRecruiterContext(authed.auth.userId);
    if (ctx.approvalStatus !== "APPROVED") {
      throw new HttpError(403, "Recruiter account is not approved yet");
    }

    const supabase = getSupabaseAdmin();
    const payload = {
      recruiter_id: ctx.userId,
      title: body.title,
      company_name: body.companyName || ctx.companyName,
      location: body.location,
      role: body.role,
      required_skills: body.requiredSkills,
      job_type: body.jobType,
      min_experience_years: body.minExperienceYears,
      description: body.description,
      open_to_freshers: body.openToFreshers,
      review_status: "PENDING_REVIEW",
      admin_feedback: null,
      reviewed_at: null,
      application_deadline: body.applicationDeadline || null,
    };

    const { data, error } = await supabase
      .from("jobs")
      .insert(payload)
      .select("id,recruiter_id,title,company_name,location,role,required_skills,job_type,min_experience_years,description,open_to_freshers,review_status,admin_feedback,reviewed_at,application_deadline,created_at")
      .single();

    if (error) throw new HttpError(500, error.message);
    res.status(201).json({ job: mapJob(data) });
  } catch (err) {
    next(err);
  }
});

recruiterSupabaseRouter.patch("/recruiter/jobs/:jobId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);
    const body = jobCreateSchema.partial().parse(req.body);
    const ctx = await getRecruiterContext(authed.auth.userId);
    if (ctx.approvalStatus !== "APPROVED") {
      throw new HttpError(403, "Recruiter account is not approved yet");
    }

    const supabase = getSupabaseAdmin();
    const payload: Record<string, unknown> = {
      review_status: "PENDING_REVIEW",
      admin_feedback: null,
      reviewed_at: null,
    };
    if (body.title !== undefined) payload.title = body.title;
    if (body.companyName !== undefined) payload.company_name = body.companyName;
    if (body.location !== undefined) payload.location = body.location;
    if (body.role !== undefined) payload.role = body.role;
    if (body.requiredSkills !== undefined) payload.required_skills = body.requiredSkills;
    if (body.jobType !== undefined) payload.job_type = body.jobType;
    if (body.minExperienceYears !== undefined) payload.min_experience_years = body.minExperienceYears;
    if (body.description !== undefined) payload.description = body.description;
    if (body.openToFreshers !== undefined) payload.open_to_freshers = body.openToFreshers;
    if (body.applicationDeadline !== undefined) payload.application_deadline = body.applicationDeadline;

    const { data, error } = await supabase
      .from("jobs")
      .update(payload)
      .eq("id", jobId)
      .eq("recruiter_id", ctx.userId)
      .select("id,recruiter_id,title,company_name,location,role,required_skills,job_type,min_experience_years,description,open_to_freshers,review_status,admin_feedback,reviewed_at,application_deadline,created_at")
      .maybeSingle();

    if (error) throw new HttpError(500, error.message);
    if (!data) throw new HttpError(404, "Job not found");

    res.json({ job: mapJob(data) });
  } catch (err) {
    next(err);
  }
});

recruiterSupabaseRouter.delete("/recruiter/jobs/:jobId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);
    const ctx = await getRecruiterContext(authed.auth.userId);
    if (ctx.approvalStatus !== "APPROVED") {
      throw new HttpError(403, "Recruiter account is not approved yet");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .eq("recruiter_id", ctx.userId)
      .select("id")
      .maybeSingle();

    if (error) throw new HttpError(500, error.message);
    if (!data) throw new HttpError(404, "Job not found");

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

recruiterSupabaseRouter.get("/recruiter/jobs/:jobId/applicants", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);
    const query = z.object({ skill: z.string().trim().optional() }).parse(req.query);
    const ctx = await getRecruiterContext(authed.auth.userId);

    const supabase = getSupabaseAdmin();
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("recruiter_id", ctx.userId)
      .maybeSingle();

    if (jobError) throw new HttpError(500, jobError.message);
    if (!job) throw new HttpError(404, "Job not found");

    const { data: apps, error: appsError } = await supabase
      .from("applications")
      .select("id,status,interview_at,created_at,job_seeker_id")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (appsError) throw new HttpError(500, appsError.message);

    const seekerIds = Array.from(new Set((apps || []).map((a) => a.job_seeker_id)));
    if (seekerIds.length === 0) {
      res.json({ applicants: [] });
      return;
    }

    const [{ data: profiles, error: profilesError }, { data: seekerProfiles, error: seekerProfilesError }] = await Promise.all([
      supabase.from("profiles").select("id,full_name").in("id", seekerIds),
      supabase.from("job_seeker_profiles").select("user_id,skills,experience_years").in("user_id", seekerIds),
    ]);

    if (profilesError) throw new HttpError(500, profilesError.message);
    if (seekerProfilesError) throw new HttpError(500, seekerProfilesError.message);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const seekerProfileMap = new Map((seekerProfiles || []).map((p: any) => [p.user_id, p]));

    const requiredSkill = query.skill?.toLowerCase() || "";
    const applicants = (apps || [])
      .map((app: any) => {
        const profile = profileMap.get(app.job_seeker_id);
        const seeker = seekerProfileMap.get(app.job_seeker_id);
        const skills = (seeker?.skills || []) as string[];
        return {
          applicationId: app.id,
          status: app.status,
          interviewAt: app.interview_at,
          candidate: {
            id: app.job_seeker_id,
            fullName: profile?.full_name || "Unknown Candidate",
            skills,
            experienceYears: seeker?.experience_years || 0,
            latestResume: null,
          },
        };
      })
      .filter((row) => !requiredSkill || row.candidate.skills.some((s) => s.toLowerCase().includes(requiredSkill)));

    res.json({ applicants });
  } catch (err) {
    next(err);
  }
});

recruiterSupabaseRouter.get("/recruiter/applications", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const q = z.object({ status: appStatusSchema.optional() }).parse(req.query);
    const ctx = await getRecruiterContext(authed.auth.userId);
    const supabase = getSupabaseAdmin();

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id,title,company_name,location,role,required_skills")
      .eq("recruiter_id", ctx.userId);
    if (jobsError) throw new HttpError(500, jobsError.message);

    const jobIds = (jobs || []).map((j: any) => j.id);
    if (jobIds.length === 0) {
      res.json({ applications: [] });
      return;
    }

    let appsQuery = supabase
      .from("applications")
      .select("id,status,interview_at,created_at,job_id,job_seeker_id")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });
    if (q.status) appsQuery = appsQuery.eq("status", q.status);

    const { data: apps, error: appsError } = await appsQuery;
    if (appsError) throw new HttpError(500, appsError.message);

    const seekerIds = Array.from(new Set((apps || []).map((a: any) => a.job_seeker_id)));
    const [{ data: profiles, error: profilesError }, { data: seekerProfiles, error: seekerProfilesError }] = await Promise.all([
      seekerIds.length
        ? supabase.from("profiles").select("id,full_name,location").in("id", seekerIds)
        : Promise.resolve({ data: [], error: null }),
      seekerIds.length
        ? supabase.from("job_seeker_profiles").select("user_id,skills,experience_years").in("user_id", seekerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesError) throw new HttpError(500, profilesError.message);
    if (seekerProfilesError) throw new HttpError(500, seekerProfilesError.message);

    const jobMap = new Map((jobs || []).map((j: any) => [j.id, j]));
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const seekerProfileMap = new Map((seekerProfiles || []).map((p: any) => [p.user_id, p]));

    const applications = (apps || []).map((app: any) => {
      const job = jobMap.get(app.job_id);
      const profile = profileMap.get(app.job_seeker_id);
      const seeker = seekerProfileMap.get(app.job_seeker_id);

      return {
        id: app.id,
        applicationId: app.id,
        status: app.status,
        interviewAt: app.interview_at,
        createdAt: app.created_at,
        job: {
          id: app.job_id,
          title: job?.title || "Unknown Role",
          companyName: job?.company_name || ctx.companyName,
          location: job?.location || "-",
          role: job?.role || "-",
          requiredSkills: job?.required_skills || [],
        },
        candidate: {
          id: app.job_seeker_id,
          fullName: profile?.full_name || "Unknown Candidate",
          location: profile?.location || null,
          skills: seeker?.skills || [],
          experienceYears: seeker?.experience_years || 0,
          latestResume: null,
        },
      };
    });

    res.json({ applications });
  } catch (err) {
    next(err);
  }
});

recruiterSupabaseRouter.patch("/recruiter/applications/:applicationId", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const { applicationId } = z.object({ applicationId: z.string().uuid() }).parse(req.params);
    const body = z.object({
      status: appStatusSchema,
      interviewAt: z.string().datetime().nullable().optional(),
    }).parse(req.body);

    const ctx = await getRecruiterContext(authed.auth.userId);
    if (ctx.approvalStatus !== "APPROVED") {
      throw new HttpError(403, "Recruiter account is not approved yet");
    }

    const supabase = getSupabaseAdmin();

    const { data: app, error: appError } = await supabase
      .from("applications")
      .select("id,job_id,job_seeker_id")
      .eq("id", applicationId)
      .maybeSingle();
    if (appError) throw new HttpError(500, appError.message);
    if (!app) throw new HttpError(404, "Application not found");

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id,title")
      .eq("id", app.job_id)
      .eq("recruiter_id", ctx.userId)
      .maybeSingle();
    if (jobError) throw new HttpError(500, jobError.message);
    if (!job) throw new HttpError(403, "Forbidden");

    const rpc = await supabase.rpc("recruiter_update_application_status", {
      p_application_id: applicationId,
      p_recruiter_user_id: ctx.userId,
      p_next_status: body.status,
      p_interview_at: body.status === "INTERVIEW_SCHEDULED" ? (body.interviewAt || null) : null,
    });

    // Backward-compatible fallback for environments where migration is not applied yet.
    if (rpc.error && rpc.error.code === "PGRST202") {
      const payload: Record<string, string | null> = { status: body.status };
      payload.interview_at = body.status === "INTERVIEW_SCHEDULED" ? (body.interviewAt || null) : null;

      const { data: updated, error: updateError } = await supabase
        .from("applications")
        .update(payload)
        .eq("id", applicationId)
        .select("id,status,interview_at")
        .single();
      if (updateError) throw new HttpError(500, updateError.message);

      await supabase.from("notifications").insert({
        user_id: app.job_seeker_id,
        type: "STATUS",
        message: `Your application status for ${job.title} is now ${body.status}.`,
        metadata: { applicationId, status: body.status },
      });

      res.json({ application: updated });
      return;
    }

    if (rpc.error) throw new HttpError(500, rpc.error.message);

    const updated = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    res.json({ application: updated });
  } catch (err) {
    next(err);
  }
});

recruiterSupabaseRouter.get("/recruiter/overview", async (req, res, next) => {
  try {
    const authed = req as unknown as AuthenticatedRequest;
    const ctx = await getRecruiterContext(authed.auth.userId);
    const supabase = getSupabaseAdmin();

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id")
      .eq("recruiter_id", ctx.userId);
    if (jobsError) throw new HttpError(500, jobsError.message);

    const jobIds = (jobs || []).map((j: any) => j.id);
    const jobsCount = jobIds.length;

    const { data: apps, error: appsError } = jobIds.length
      ? await supabase
          .from("applications")
          .select("status,created_at,job_id")
          .in("job_id", jobIds)
      : { data: [], error: null };

    if (appsError) throw new HttpError(500, appsError.message);

    const counts = (apps || []).reduce<Record<string, number>>((acc, item: any) => {
      acc.total = (acc.total || 0) + 1;
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { total: 0 });

    const now = new Date();
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const views = labels.map(() => Math.max(5, Math.floor((counts.total || 0) / 3)));
    const applicationsSeries = labels.map((_, idx) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - idx));
      return (apps || []).filter((a: any) => {
        const createdAt = new Date(a.created_at);
        return createdAt.toDateString() === day.toDateString();
      }).length;
    });

    let topJob: { title: string; company: string; applicants: number } | null = null;
    if ((apps || []).length > 0) {
      const agg = new Map<string, number>();
      for (const a of apps as any[]) {
        agg.set(a.job_id, (agg.get(a.job_id) || 0) + 1);
      }

      const topEntry = Array.from(agg.entries()).sort((a, b) => b[1] - a[1])[0];
      if (topEntry) {
        const { data: topJobData, error: topJobError } = await supabase
          .from("jobs")
          .select("title,company_name")
          .eq("id", topEntry[0])
          .maybeSingle();
        if (topJobError) throw new HttpError(500, topJobError.message);
        if (topJobData) {
          topJob = {
            title: topJobData.title,
            company: topJobData.company_name,
            applicants: topEntry[1],
          };
        }
      }
    }

    const total = counts.total || 0;
    const qualityScore = total > 0
      ? Math.round((((counts.SHORTLISTED || 0) + (counts.INTERVIEW_SCHEDULED || 0)) / total) * 100)
      : 0;

    res.json({
      overview: {
        jobsCount,
        applicationsTotal: total,
        shortlisted: counts.SHORTLISTED || 0,
        rejected: counts.REJECTED || 0,
        interviews: counts.INTERVIEW_SCHEDULED || 0,
        offered: counts.OFFERED || 0,
        hired: counts.HIRED || 0,
        funnel: {
          applied: counts.APPLIED || 0,
          shortlisted: counts.SHORTLISTED || 0,
          interview: counts.INTERVIEW_SCHEDULED || 0,
          offered: counts.OFFERED || 0,
          hired: counts.HIRED || 0,
        },
        weekly: {
          labels,
          views,
          applications: applicationsSeries,
        },
        topJob,
        avgTimeToHire: 14,
        qualityScore,
      },
    });
  } catch (err) {
    next(err);
  }
});
