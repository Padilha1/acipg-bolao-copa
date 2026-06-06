import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

config({ path: resolve(apiRoot, ".env") });
config({ path: resolve(apiRoot, ".env.local"), override: true });

if (!process.env.DATABASE_URL) {
  console.error("Missing database config. Set DATABASE_URL.");
  process.exit(1);
}

const prisma = spawn("prisma", process.argv.slice(2), {
  stdio: "inherit",
  env: process.env,
});

prisma.on("exit", (code) => {
  process.exit(code ?? 1);
});
