import { config } from "../config";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const LEGACY_LOCAL_SESSION_KEY = "hireflow_local_auth_session";
const LEGACY_LOCAL_ACCOUNTS_KEY = "hireflow_local_auth_accounts";

function clearLegacyLocalAuthData() {
  try {
    localStorage.removeItem(LEGACY_LOCAL_SESSION_KEY);
    localStorage.removeItem(LEGACY_LOCAL_ACCOUNTS_KEY);
  } catch {
    // ignore storage access errors
  }
}

function toAuthMessage(error, fallback) {
  const message = String(error?.message || "").trim();
  if (!message) return fallback;
  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return "Network error. Please check your connection and try again.";
  }
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password. Please try again.";
  if (/email not confirmed/i.test(message)) return "Please verify your email before signing in.";
  if (/already registered|user already registered/i.test(message)) return "Email already registered.";
  return message;
}

function isAdminEmail(email) {
  return config.adminEmails.includes(String(email || "").trim().toLowerCase());
}

function requireSupabaseConfig() {
  if (isSupabaseConfigured) return;
  throw new Error("Authentication is temporarily unavailable. Deployment is missing Supabase configuration.");
}

function getEmailRedirectUrl(path = "") {
  if (!config.publicAppUrl) return undefined;
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base === "/" ? "" : base.replace(/\/$/, "");
  const lowerAppUrl = config.publicAppUrl.toLowerCase();
  const lowerPrefix = prefix.toLowerCase();
  const appBase = prefix && lowerAppUrl.endsWith(lowerPrefix)
    ? config.publicAppUrl
    : `${config.publicAppUrl}${prefix}`;
  if (!normalizedPath) return appBase;
  return `${appBase}/?/${normalizedPath}`;
}

async function ensureProfile(user, metadata = {}) {
  const role = metadata.role === "RECRUITER" ? "RECRUITER" : "JOB_SEEKER";

  const existingProfileResult = await supabase
    .from("profiles")
    .select("role,recruiter_approval_status")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileResult.error) throw existingProfileResult.error;

  const existingProfile = existingProfileResult.data;
  const profileRole = existingProfile?.role || role;
  const recruiterApprovalStatus = profileRole === "RECRUITER"
    ? (existingProfile?.recruiter_approval_status || "PENDING")
    : null;

  const profilePayload = {
    id: user.id,
    email: String(user.email || "").toLowerCase(),
    role: profileRole,
    full_name: metadata.fullName || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
    phone: metadata.phone || user.user_metadata?.phone || null,
    recruiter_approval_status: recruiterApprovalStatus,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });
  if (profileError) throw profileError;

  if (profileRole === "RECRUITER") {
    const companyName = metadata.companyName || user.user_metadata?.company_name || "Recruiter";
    const { error: recruiterError } = await supabase
      .from("recruiter_profiles")
      .upsert({ user_id: user.id, company_name: companyName }, { onConflict: "user_id" });
    if (recruiterError) throw recruiterError;
  } else {
    const { error: seekerError } = await supabase
      .from("job_seeker_profiles")
      .upsert({ user_id: user.id }, { onConflict: "user_id" });
    if (seekerError) throw seekerError;
  }
}

async function recordLoginEvent(userId) {
  await supabase.from("user_login_events").insert({ user_id: userId, source: "web" });
}

async function mapSessionUser(authUser) {
  if (!authUser) return null;

  let profile = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role,recruiter_approval_status")
      .eq("id", authUser.id)
      .maybeSingle();
    profile = data;
  } catch {
    profile = null;
  }

  const role = profile?.role === "RECRUITER" ? "RECRUITER" : "JOB_SEEKER";
  const isAdmin = isAdminEmail(authUser.email);

  return {
    id: authUser.id,
    email: authUser.email,
    role,
    isAdmin,
    recruiterApprovalStatus: role === "RECRUITER"
      ? (profile?.recruiter_approval_status || "PENDING")
      : undefined,
  };
}

export async function signInWithEmail(email, password) {
  requireSupabaseConfig();
  clearLegacyLocalAuthData();

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw new Error(toAuthMessage(error, "Unable to sign in right now."));
  }

  const authUser = data.user;
  const session = data.session;
  if (!authUser || !session) {
    throw new Error("Unable to establish session. Please try again.");
  }

  // Do not block login if profile/event sync is temporarily slow.
  void ensureProfile(authUser, {
    role: authUser.user_metadata?.role,
    fullName: authUser.user_metadata?.full_name,
    phone: authUser.user_metadata?.phone,
    companyName: authUser.user_metadata?.company_name,
  }).catch(() => undefined);

  void recordLoginEvent(authUser.id).catch(() => undefined);

  const user = await mapSessionUser(authUser);
  if (!user) throw new Error("Unable to load user profile.");

  return { token: session.access_token, user };
}

export async function signUpWithEmail(email, password, metadata = {}) {
  requireSupabaseConfig();
  clearLegacyLocalAuthData();

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const requestedRole = metadata.role === "RECRUITER" ? "RECRUITER" : "JOB_SEEKER";

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: getEmailRedirectUrl("auth/callback"),
      data: {
        full_name: metadata.fullName || "",
        role: requestedRole,
        phone: metadata.phone || null,
        company_name: metadata.companyName || null,
      },
    },
  });

  if (error) {
    throw new Error(toAuthMessage(error, "Unable to create account right now."));
  }

  const authUser = data.user;
  if (!authUser) {
    throw new Error("Signup succeeded but user is missing. Please try login.");
  }

  if (data.session?.access_token) {
    await supabase.auth.signOut();
  }

  return {
    token: "",
    user: {
      id: authUser.id,
      email: authUser.email,
      role: requestedRole,
      isAdmin: isAdminEmail(authUser.email),
      recruiterApprovalStatus: requestedRole === "RECRUITER" ? "PENDING" : undefined,
    },
  };
}

export async function resendVerificationEmail(email) {
  requireSupabaseConfig();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Please enter your email address.");

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
    options: {
      emailRedirectTo: getEmailRedirectUrl("auth/callback"),
    },
  });

  if (error) {
    throw new Error(toAuthMessage(error, "Unable to resend verification email right now."));
  }
}

export async function signOut() {
  requireSupabaseConfig();
  clearLegacyLocalAuthData();

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(toAuthMessage(error, "Unable to sign out right now."));
}

export async function getCurrentUser() {
  requireSupabaseConfig();
  clearLegacyLocalAuthData();

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return await mapSessionUser(data.user);
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback) {
  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }

    try {
      void ensureProfile(session.user, {
        role: session.user.user_metadata?.role,
        fullName: session.user.user_metadata?.full_name,
        phone: session.user.user_metadata?.phone,
        companyName: session.user.user_metadata?.company_name,
      }).catch(() => undefined);

      const mapped = await mapSessionUser(session.user);
      callback(mapped);
    } catch {
      callback(null);
    }
  });

  void getCurrentUser().then((user) => callback(user));

  return () => {
    sub.subscription.unsubscribe();
  };
}

export async function getCurrentSession() {
  requireSupabaseConfig();
  clearLegacyLocalAuthData();

  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ? await mapSessionUser(data.session.user) : null;
    return {
      token: data.session?.access_token || null,
      user,
    };
  } catch {
    return {
      token: null,
      user: null,
    };
  }
}
