import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { z } from "zod";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

config({ path: resolve(apiRoot, ".env") });
config({ path: resolve(apiRoot, ".env.local"), override: true });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  ADMIN_EMAIL: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  WEB_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
});

export const env = envSchema.parse(process.env);

export const webOrigins = env.WEB_ORIGIN.split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean)
  .map((normalizedOrigin) => {
    const parsedOrigin = new URL(normalizedOrigin);

    if (parsedOrigin.origin !== normalizedOrigin) {
      throw new Error(
        `WEB_ORIGIN must contain only origins: ${normalizedOrigin}`,
      );
    }

    return normalizedOrigin;
  });

if (webOrigins.length === 0) {
  throw new Error("WEB_ORIGIN must contain at least one origin.");
}
