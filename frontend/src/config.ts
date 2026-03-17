function resolveApiBaseUrl() {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();
  const fallbackHostedApiUrl = (import.meta.env.VITE_FALLBACK_API_URL || "https://hireflow-backend.onrender.com").trim();

  const getHostedOverride = () => {
    if (typeof window === "undefined") return "";
    const host = window.location.hostname.toLowerCase();
    const isBrowserLocal = host === "localhost" || host === "127.0.0.1";
    const isStaticHost = host.endsWith("github.io") || host.endsWith("pages.dev") || host.endsWith("vercel.app") || host.endsWith("netlify.app");
    if (!isBrowserLocal && isStaticHost) {
      return fallbackHostedApiUrl;
    }
    return "";
  };

  if (!envUrl) {
    const hostedOverride = getHostedOverride();
    if (hostedOverride) return hostedOverride;
    return "/api";
  }

  if (typeof window === "undefined") return envUrl;

  // Relative API URLs rely on dev proxy; on static hosts they should target the real backend.
  if (envUrl.startsWith("/")) {
    const hostedOverride = getHostedOverride();
    if (hostedOverride) return hostedOverride;
  }

  const host = window.location.hostname;
  const isBrowserLocal = host === "localhost" || host === "127.0.0.1";
  const isEnvLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(envUrl);

  // In remote previews/codespaces, localhost points to the user's machine, not the container backend.
  if (!isBrowserLocal && isEnvLocal) return "/api";

  return envUrl;
}

function resolvePublicAppUrl() {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL || "").trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return `${window.location.origin}${(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}`;
  }

  return "";
}

export const config = {
  apiBaseUrl: resolveApiBaseUrl(),
  publicAppUrl: resolvePublicAppUrl(),
  adminEmails: (import.meta.env.VITE_ADMIN_EMAILS || "Sharan18x@gmail.com")
    .split(",")
    .map((item: string) => item.trim().toLowerCase())
    .filter(Boolean),
} as const;
