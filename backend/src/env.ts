import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: z.string().default("hireflow"),
  EMAIL_MODE: z.enum(["log", "disabled"]).default("log"),
  EMAIL_FROM: z.string().email().default("no-reply@hireflow.local"),
  ADMIN_EMAILS: z.string().default(""),
  JSEARCH_API_KEY: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  SERPAPI_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  JSEARCH_API_KEY: process.env.JSEARCH_API_KEY,
  ADZUNA_APP_ID: process.env.ADZUNA_APP_ID,
  ADZUNA_APP_KEY: process.env.ADZUNA_APP_KEY,
  SERPAPI_KEY: process.env.SERPAPI_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  EMAIL_MODE: process.env.EMAIL_MODE,
  EMAIL_FROM: process.env.EMAIL_FROM,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
});
