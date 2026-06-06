import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env.js";

export function generateCode() {
  return randomBytes(4)
    .readUInt32BE(0)
    .toString()
    .padStart(10, "0")
    .slice(0, 6);
}

export function generateToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSecret(value: string) {
  return createHash("sha256")
    .update(`${env.SESSION_SECRET}:${value}`)
    .digest("hex");
}

export function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}
