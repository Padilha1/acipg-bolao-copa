import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import type { AdminController } from "../controllers/admin.controller.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";

export async function adminRoutes(
  app: FastifyInstance,
  controller: AdminController,
  requireAuth: preHandlerHookHandler,
) {
  const preHandler = [requireAuth, requireAdmin];

  app.post("/admin/rounds", { preHandler }, controller.createRound);
  app.post("/admin/matches", { preHandler }, controller.createMatch);
  app.patch("/admin/matches/:id", { preHandler }, controller.updateMatch);
  app.patch(
    "/admin/matches/:id/result",
    { preHandler },
    controller.updateResult,
  );
  app.post(
    "/admin/recalculate/:matchId",
    { preHandler },
    controller.recalculate,
  );
}
