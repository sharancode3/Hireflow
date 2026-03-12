function resolveApiBaseUrl() {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();

  if (!envUrl) return "/api";

  if (typeof window === "undefined") return envUrl;

  const host = window.location.hostname;
  const isBrowserLocal = host === "localhost" || host === "127.0.0.1";
  const isEnvLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(envUrl);

  // In remote previews/codespaces, localhost points to the user's machine, not the container backend.
  if (!isBrowserLocal && isEnvLocal) return "/api";

  return envUrl;
}

export const config = {
  apiBaseUrl: resolveApiBaseUrl(),
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim(),
} as const;
