import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import type { MeController } from "../controllers/me.controller.js";

export async function meRoutes(
  app: FastifyInstance,
  controller: MeController,
  requireAuth: preHandlerHookHandler,
) {
  app.get("/me", { preHandler: requireAuth }, controller.get);
  app.patch("/me", { preHandler: requireAuth }, controller.update);
}
