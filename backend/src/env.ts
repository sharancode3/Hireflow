import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  EMAIL_MODE: z.enum(["log", "disabled"]).default("log"),
  EMAIL_FROM: z.string().email().default("no-reply@hireflow.local"),
  ADMIN_EMAILS: z.string().default(""),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  EMAIL_MODE: process.env.EMAIL_MODE,
  EMAIL_FROM: process.env.EMAIL_FROM,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
});
