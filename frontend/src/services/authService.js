import { config } from "../config";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const TEMP_LOCAL_AUTH_MODE = true;
const LOCAL_SESSION_KEY = "hireflow_local_auth_session";
const LOCAL_ACCOUNTS_KEY = "hireflow_local_auth_accounts";
const ADMIN_EMAIL = "sharan18x@gmail.com";
const ADMIN_PASSWORD = "Sharan1@bmsce";

const AUTH_REQUEST_TIMEOUT_MS = 15000;
const SIGN_IN_TIMEOUT_MS = 30000;

function uid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getLocalAccounts() {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalAccounts(accounts) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function mapLocalSessionUser(sessionUser) {
  if (!sessionUser) return null;
  const email = normalizeEmail(sessionUser.email);
  const isAdmin = email === ADMIN_EMAIL || isAdminEmail(email);
  return {
    id: sessionUser.id,
    email,
    role: sessionUser.role === "RECRUITER" ? "RECRUITER" : "JOB_SEEKER",
    isAdmin,
    recruiterApprovalStatus: sessionUser.role === "RECRUITER"
      ? (sessionUser.recruiterApprovalStatus || "PENDING")
      : undefined,
  };
}

function setLocalSession(session) {
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
}

function clearLocalSession() {
  localStorage.removeItem(LOCAL_SESSION_KEY);
}

function getLocalSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || null,
      user: mapLocalSessionUser(parsed?.user || null),
    };
  } catch {
    return { token: null, user: null };
  }
}

class AuthTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthTimeoutError";
  }
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timer;
  return new Promise((resolve, reject) => {
    timer = window.setTimeout(() => {
      reject(new AuthTimeoutError(timeoutMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

async function trySignIn(email, password) {
  return withTimeout(
    supabase.auth.signInWithPassword({
      email,
      password,
    }),
    SIGN_IN_TIMEOUT_MS,
    "Sign in is taking too long. Please try again.",
  );
}

async function tryRecoverSessionUser(expectedEmail) {
  let data;
  try {
    ({ data } = await withTimeout(
      supabase.auth.getSession(),
      AUTH_REQUEST_TIMEOUT_MS,
      "Session lookup timed out.",
    ));
  } catch {
    return null;
  }

  const authUser = data.session?.user;
  const session = data.session;
  if (!authUser || !session) return null;

  const normalizedExpected = String(expectedEmail || "").trim().toLowerCase();
  const normalizedActual = String(authUser.email || "").trim().toLowerCase();
  if (normalizedExpected && normalizedExpected !== normalizedActual) return null;

  return { authUser, session };
}

function toAuthMessage(error, fallback) {
  const message = String(error?.message || "").trim();
  if (!message) return fallback;
  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return "Network error. Please check your connection and try again.";
  }
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password. Please try again.";
  if (/email not confirmed/i.test(message)) return "Please verify your email before signing in.";
  if (/already registered/i.test(message)) return "Email already registered.";
  return message;
}

function isAdminEmail(email) {
  return config.adminEmails.includes(String(email || "").trim().toLowerCase());
}

function requireSupabaseConfig() {
  if (TEMP_LOCAL_AUTH_MODE) return;
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
  // Use /?/path for static hosts (GitHub Pages) so SPA route restore works.
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
  if (TEMP_LOCAL_AUTH_MODE) {
    const normalizedEmail = normalizeEmail(email);
    const plainPassword = String(password || "");

    if (!normalizedEmail || !plainPassword) {
      throw new Error("Enter email and password.");
    }

    if (normalizedEmail === ADMIN_EMAIL) {
      if (plainPassword !== ADMIN_PASSWORD) {
        throw new Error("Incorrect email or password. Please try again.");
      }
      const adminUser = {
        id: "local-admin",
        email: ADMIN_EMAIL,
        role: "JOB_SEEKER",
        isAdmin: true,
      };
      const token = `local-admin-${Date.now()}`;
      setLocalSession({ token, user: adminUser });
      return { token, user: adminUser };
    }

    const accounts = getLocalAccounts();
    const existing = accounts[normalizedEmail];
    if (existing && existing.password !== plainPassword) {
      throw new Error("Incorrect email or password. Please try again.");
    }

    const nextAccount = existing || {
      id: uid(),
      email: normalizedEmail,
      password: plainPassword,
      role: "JOB_SEEKER",
      recruiterApprovalStatus: undefined,
    };
    accounts[normalizedEmail] = nextAccount;
    saveLocalAccounts(accounts);

    const user = mapLocalSessionUser(nextAccount);
    const token = `local-${nextAccount.id}-${Date.now()}`;
    setLocalSession({ token, user });
    return { token, user };
  }

  requireSupabaseConfig();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  let signInResult;
  try {
    signInResult = await trySignIn(normalizedEmail, password);
  } catch (error) {
    if (error instanceof AuthTimeoutError) {
      // If the first auth request is slow, retry once before failing.
      try {
        signInResult = await trySignIn(normalizedEmail, password);
      } catch (retryError) {
        if (retryError instanceof AuthTimeoutError) {
          const recovered = await tryRecoverSessionUser(normalizedEmail);
          if (recovered) {
            signInResult = {
              data: {
                user: recovered.authUser,
                session: recovered.session,
              },
              error: null,
            };
          } else {
            throw retryError;
          }
        } else {
          throw retryError;
        }
      }
    } else {
      throw error;
    }
  }

  const { data, error } = signInResult;

  if (error) {
    throw new Error(toAuthMessage(error, "Unable to sign in right now."));
  }

  const authUser = data.user;
  const session = data.session;
  if (!authUser || !session) {
    throw new Error("Unable to establish session. Please try again.");
  }

  // Profile sync and login events should not block successful authentication.
  void withTimeout(
    ensureProfile(authUser, {
      role: authUser.user_metadata?.role,
      fullName: authUser.user_metadata?.full_name,
      phone: authUser.user_metadata?.phone,
      companyName: authUser.user_metadata?.company_name,
    }),
    AUTH_REQUEST_TIMEOUT_MS,
    "Profile sync timed out.",
  ).catch(() => undefined);

  void withTimeout(
    recordLoginEvent(authUser.id),
    AUTH_REQUEST_TIMEOUT_MS,
    "Login tracking timed out.",
  ).catch(() => undefined);

  const user = await withTimeout(
    mapSessionUser(authUser),
    AUTH_REQUEST_TIMEOUT_MS,
    "Unable to load your account details right now. Please try again.",
  );
  if (!user) throw new Error("Unable to load user profile.");

  return { token: session.access_token, user };
}

export async function signUpWithEmail(email, password, metadata = {}) {
  if (TEMP_LOCAL_AUTH_MODE) {
    const normalizedEmail = normalizeEmail(email);
    const plainPassword = String(password || "");
    const requestedRole = metadata.role === "RECRUITER" ? "RECRUITER" : "JOB_SEEKER";

    if (!normalizedEmail || !plainPassword) {
      throw new Error("Email and password are required.");
    }

    if (normalizedEmail === ADMIN_EMAIL) {
      throw new Error("Email already registered.");
    }

    const accounts = getLocalAccounts();
    if (accounts[normalizedEmail]) {
      throw new Error("Email already registered.");
    }

    accounts[normalizedEmail] = {
      id: uid(),
      email: normalizedEmail,
      password: plainPassword,
      role: requestedRole,
      recruiterApprovalStatus: requestedRole === "RECRUITER" ? "PENDING" : undefined,
    };
    saveLocalAccounts(accounts);

    return {
      token: "",
      user: {
        id: accounts[normalizedEmail].id,
        email: normalizedEmail,
        role: requestedRole,
        isAdmin: false,
        recruiterApprovalStatus: requestedRole === "RECRUITER" ? "PENDING" : undefined,
      },
    };
  }

  requireSupabaseConfig();
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

  // Professional flow: always require email confirmation before login/profile writes.
  // Even if a session is returned (project setting differs), clear it to avoid partial onboarding states.
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
  if (TEMP_LOCAL_AUTH_MODE) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) throw new Error("Please enter your email address.");
    return;
  }

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
  if (TEMP_LOCAL_AUTH_MODE) {
    clearLocalSession();
    return;
  }

  requireSupabaseConfig();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(toAuthMessage(error, "Unable to sign out right now."));
}

export async function getCurrentUser() {
  if (TEMP_LOCAL_AUTH_MODE) {
    const { user } = getLocalSession();
    return user;
  }

  requireSupabaseConfig();
  let data;
  let error;
  try {
    ({ data, error } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_REQUEST_TIMEOUT_MS,
      "Session check timed out.",
    ));
  } catch {
    return null;
  }
  if (error) return null;
  try {
    return await withTimeout(
      mapSessionUser(data.user),
      AUTH_REQUEST_TIMEOUT_MS,
      "Profile lookup timed out.",
    );
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback) {
  if (TEMP_LOCAL_AUTH_MODE) {
    const emit = () => {
      const { user } = getLocalSession();
      callback(user);
    };

    emit();

    const listener = (event) => {
      if (event.key === LOCAL_SESSION_KEY) emit();
    };

    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("storage", listener);
    };
  }

  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }

    try {
      await ensureProfile(session.user, {
        role: session.user.user_metadata?.role,
        fullName: session.user.user_metadata?.full_name,
        phone: session.user.user_metadata?.phone,
        companyName: session.user.user_metadata?.company_name,
      });
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
  if (TEMP_LOCAL_AUTH_MODE) {
    return getLocalSession();
  }

  requireSupabaseConfig();
  let data;
  try {
    ({ data } = await withTimeout(
      supabase.auth.getSession(),
      AUTH_REQUEST_TIMEOUT_MS,
      "Session lookup timed out.",
    ));
  } catch {
    return { token: null, user: null };
  }

  let user = null;
  if (data.session?.user) {
    try {
      user = await withTimeout(
        mapSessionUser(data.session.user),
        AUTH_REQUEST_TIMEOUT_MS,
        "Profile lookup timed out.",
      );
    } catch {
      user = null;
    }
  }

  return {
    token: data.session?.access_token || null,
    user,
  };
}
