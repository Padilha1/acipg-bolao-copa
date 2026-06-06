import {
  createMatchSchema,
  createRoundSchema,
  updateMatchResultSchema,
  updateMatchSchema,
} from "@bolao-acipg/shared";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import type { AdminService } from "../services/admin.service.js";

const idParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const matchIdParamsSchema = z.object({
  matchId: z.string().regex(/^\d+$/),
});

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  createRound = (request: FastifyRequest) => {
    const body = createRoundSchema.parse(request.body);
    return this.adminService.createRound(body);
  };

  createMatch = (request: FastifyRequest) => {
    const body = createMatchSchema.parse(request.body);
    return this.adminService.createMatch(body);
  };

  updateMatch = (request: FastifyRequest) => {
    const params = idParamsSchema.parse(request.params);
    const body = updateMatchSchema.parse(request.body);
    return this.adminService.updateMatch(params.id, body);
  };

  updateResult = (request: FastifyRequest) => {
    const params = idParamsSchema.parse(request.params);
    const body = updateMatchResultSchema.parse(request.body);
    return this.adminService.updateResult(params.id, body);
  };

  recalculate = (request: FastifyRequest) => {
    const params = matchIdParamsSchema.parse(request.params);
    return this.adminService.recalculate(params.matchId);
  };
}
