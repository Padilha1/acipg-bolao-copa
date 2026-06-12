import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import type { PredictionController } from "../controllers/prediction.controller.js";

export async function predictionRoutes(
  app: FastifyInstance,
  controller: PredictionController,
  requireAuth: preHandlerHookHandler,
) {
  app.get("/predictions/me", { preHandler: requireAuth }, controller.mine);
  app.get(
    "/leaderboard-podium-prediction/top",
    { preHandler: requireAuth },
    controller.leaderboardPodiumTop,
  );
  app.get(
    "/leaderboard-podium-prediction/me",
    { preHandler: requireAuth },
    controller.leaderboardPodiumMine,
  );
  app.put(
    "/predictions/:matchId",
    { preHandler: requireAuth },
    controller.upsert,
  );
  app.put(
    "/leaderboard-podium-prediction/me",
    { preHandler: requireAuth },
    controller.upsertLeaderboardPodium,
  );
  app.get("/ranking", { preHandler: requireAuth }, controller.ranking);
}
