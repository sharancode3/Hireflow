import { config } from "../config";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: JsonValue;
};

async function getFreshAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${config.apiBaseUrl}${normalizedPath}`;
}

async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return text ? { message: text } : {};
}

function isLikelyHtml(payload: unknown): boolean {
  if (typeof payload !== "string") return false;
  const sample = payload.trim().slice(0, 300).toLowerCase();
  return sample.includes("<html") || sample.includes("<body") || sample.includes("<!doctype html");
}

function getFriendlyHttpErrorMessage(status: number): string {
  if (status === 405) {
    return "API endpoint rejected this request (405). Check that VITE_API_URL points to your backend API.";
  }
  if (status >= 500) {
    return "Server error. Please try again in a moment.";
  }
  return `Request failed (${status})`;
}

export async function apiJson<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  let token = options.token ?? null;
  const body = options.body;

  const execute = async (requestToken: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (requestToken) {
      headers.Authorization = `Bearer ${requestToken}`;
    }

    return fetch(toAbsoluteUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response: Response;
  try {
    response = await execute(token);
  } catch {
    throw new ApiError(0, "Failed to fetch");
  }

  if (response.status === 401 && token) {
    const refreshedToken = await getFreshAccessToken();
    if (refreshedToken && refreshedToken !== token) {
      token = refreshedToken;
      try {
        response = await execute(token);
      } catch {
        throw new ApiError(0, "Failed to fetch");
      }
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const rawMessage = typeof data?.message === "string" ? data.message : null;
    const htmlLikeMessage = isLikelyHtml(rawMessage);
    const message =
      (!htmlLikeMessage && rawMessage) ||
      (typeof data?.error === "string" && data.error) ||
      getFriendlyHttpErrorMessage(response.status);
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export async function apiFormData<T>(path: string, formData: FormData, token: string): Promise<T> {
  const execute = async (requestToken: string): Promise<Response> =>
    fetch(toAbsoluteUrl(path), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requestToken}`,
      },
      body: formData,
    });

  let authToken = token;
  let response: Response;
  try {
    response = await execute(authToken);
  } catch {
    throw new ApiError(0, "Failed to fetch");
  }

  if (response.status === 401) {
    const refreshedToken = await getFreshAccessToken();
    if (refreshedToken && refreshedToken !== authToken) {
      authToken = refreshedToken;
      try {
        response = await execute(authToken);
      } catch {
        throw new ApiError(0, "Failed to fetch");
      }
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      `Upload failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}
