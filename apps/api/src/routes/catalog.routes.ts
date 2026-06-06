import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import type { CatalogController } from "../controllers/catalog.controller.js";

export async function catalogRoutes(
  app: FastifyInstance,
  controller: CatalogController,
  requireAuth: preHandlerHookHandler,
) {
  app.get("/teams", { preHandler: requireAuth }, controller.teams);
  app.get("/rounds", { preHandler: requireAuth }, controller.rounds);
  app.get("/matches", { preHandler: requireAuth }, controller.matches);
}
