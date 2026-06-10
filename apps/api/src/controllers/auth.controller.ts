import { authStartSchema, authVerifySchema } from "@bolao-acipg/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { emailLogFields, logInfo } from "../lib/logger.js";
import type { AuthService } from "../services/auth.service.js";
import type { MeService } from "../services/me.service.js";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly meService: MeService,
  ) {}

  start = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = authStartSchema.parse(request.body);
    const logFields = {
      requestId: request.id,
      ...emailLogFields(body.email),
    };

    logInfo("auth.start.attempt", logFields);
    const auth = await this.authService.start(body.email, body.name, reply);
    logInfo("auth.start.success", {
      ...logFields,
      userId: auth.user.id.toString(),
      entryId: auth.entry?.id.toString(),
    });

    return {
      ...this.meService.toDto(auth.user, auth.entry),
      sessionToken: auth.sessionToken,
    };
  };

  verify = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = authVerifySchema.parse(request.body);
    const logFields = {
      requestId: request.id,
      ...emailLogFields(body.email),
    };

    logInfo("auth.verify.attempt", logFields);
    const auth = await this.authService.verify(body.email, body.code, reply);
    logInfo("auth.verify.success", {
      ...logFields,
      userId: auth.user.id.toString(),
      entryId: auth.entry?.id.toString(),
    });

    return {
      ...this.meService.toDto(auth.user, auth.entry),
      sessionToken: auth.sessionToken,
    };
  };
}
