import type { FastifyInstance } from "fastify";
import type { AuthController } from "../controllers/auth.controller.js";

export async function authRoutes(
  app: FastifyInstance,
  controller: AuthController,
) {
  app.post("/auth/start", controller.start);
  app.post("/auth/verify", controller.verify);
}
