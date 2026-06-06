import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import type { PredictionController } from "../controllers/prediction.controller.js";

export async function predictionRoutes(
  app: FastifyInstance,
  controller: PredictionController,
  requireAuth: preHandlerHookHandler,
) {
  app.get("/predictions/me", { preHandler: requireAuth }, controller.mine);
  app.put(
    "/predictions/:matchId",
    { preHandler: requireAuth },
    controller.upsert,
  );
  app.get("/ranking", { preHandler: requireAuth }, controller.ranking);
}
