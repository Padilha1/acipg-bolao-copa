import { cp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(apiRoot, "src/generated/prisma");
const target = resolve(apiRoot, "dist/generated/prisma");

await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
