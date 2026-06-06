import { updateMeSchema } from "@bolao-acipg/shared";
import type { FastifyRequest } from "fastify";
import { HttpError } from "../lib/http-error.js";
import type { MeService } from "../services/me.service.js";

export class MeController {
  constructor(private readonly meService: MeService) {}

  get = async (request: FastifyRequest) => {
    if (!request.auth) throw new HttpError(401, "Sessao ausente.");
    return this.meService.toDto(request.auth.user, request.auth.entry);
  };

  update = async (request: FastifyRequest) => {
    if (!request.auth) throw new HttpError(401, "Sessao ausente.");
    const body = updateMeSchema.parse(request.body);
    const user = await this.meService.update(request.auth.user.id, {
      name: body.name,
      displayName: body.displayName,
    });

    return this.meService.toDto(user, request.auth.entry);
  };
}
