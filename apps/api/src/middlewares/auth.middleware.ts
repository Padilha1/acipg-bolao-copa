import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../lib/env.js";
import { HttpError } from "../lib/http-error.js";
import {
  type AuthService,
  SESSION_COOKIE_NAME,
} from "../services/auth.service.js";

export function makeRequireAuth(authService: AuthService) {
  return async function requireAuth(request: FastifyRequest) {
    const bearerToken =
      request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    request.auth = await authService.authenticate(
      request.cookies[SESSION_COOKIE_NAME] ?? bearerToken,
    );
  };
}

export async function requireAdmin(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  if (!request.auth) {
    throw new HttpError(401, "Sessao ausente.");
  }

  if (request.auth.user.email.toLowerCase() !== env.ADMIN_EMAIL) {
    throw new HttpError(403, "Acesso restrito ao admin.");
  }
}
