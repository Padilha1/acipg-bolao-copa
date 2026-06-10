import { createHash } from "node:crypto";

type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function writeLog(level: LogLevel, event: string, fields: LogFields = {}) {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function logInfo(event: string, fields?: LogFields) {
  writeLog("info", event, fields);
}

export function logWarn(event: string, fields?: LogFields) {
  writeLog("warn", event, fields);
}

export function logError(event: string, fields?: LogFields) {
  writeLog("error", event, fields);
}

export function emailLogFields(emailInput: unknown) {
  if (typeof emailInput !== "string") return {};

  const email = emailInput.trim().toLowerCase();
  const domain = email.includes("@") ? email.split("@").at(-1) : undefined;

  return {
    emailHash: createHash("sha256").update(email).digest("hex").slice(0, 16),
    emailDomain: domain,
  };
}

export function errorLogFields(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      errorMessage: String(error),
    };
  }

  const maybeErrorWithCode = error as Error & {
    code?: string;
    meta?: unknown;
  };

  return {
    errorName: error.name,
    errorMessage: error.message,
    errorCode: maybeErrorWithCode.code,
    errorMeta: maybeErrorWithCode.meta,
    stack: error.stack,
  };
}
