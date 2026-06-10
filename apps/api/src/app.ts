import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { AdminController } from "./controllers/admin.controller.js";
import { AuthController } from "./controllers/auth.controller.js";
import { CatalogController } from "./controllers/catalog.controller.js";
import { MeController } from "./controllers/me.controller.js";
import { PredictionController } from "./controllers/prediction.controller.js";
import { env } from "./lib/env.js";
import { HttpError } from "./lib/http-error.js";
import {
  emailLogFields,
  errorLogFields,
  logError,
  logWarn,
} from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { makeRequireAuth } from "./middlewares/auth.middleware.js";
import { AdminRepository } from "./repositories/admin.repository.js";
import { AuthRepository } from "./repositories/auth.repository.js";
import { CatalogRepository } from "./repositories/catalog.repository.js";
import { PoolRepository } from "./repositories/pool.repository.js";
import { PredictionRepository } from "./repositories/prediction.repository.js";
import { UserRepository } from "./repositories/user.repository.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { catalogRoutes } from "./routes/catalog.routes.js";
import { meRoutes } from "./routes/me.routes.js";
import { predictionRoutes } from "./routes/prediction.routes.js";
import { AdminService } from "./services/admin.service.js";
import { AuthService } from "./services/auth.service.js";
import { CatalogService } from "./services/catalog.service.js";
import { MeService } from "./services/me.service.js";
import { PredictionService } from "./services/prediction.service.js";

export async function buildApp() {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(cookie, {
    secret: env.SESSION_SECRET,
  });

  const authRepository = new AuthRepository(prisma);
  const userRepository = new UserRepository(prisma);
  const poolRepository = new PoolRepository(prisma);
  const catalogRepository = new CatalogRepository(prisma);
  const predictionRepository = new PredictionRepository(prisma);
  const adminRepository = new AdminRepository(prisma);

  const authService = new AuthService(
    authRepository,
    userRepository,
    poolRepository,
  );
  const meService = new MeService(userRepository);
  const catalogService = new CatalogService(catalogRepository);
  const predictionService = new PredictionService(predictionRepository);
  const adminService = new AdminService(adminRepository);

  const requireAuth = makeRequireAuth(authService);

  await authRoutes(app, new AuthController(authService, meService));
  await meRoutes(app, new MeController(meService), requireAuth);
  await catalogRoutes(app, new CatalogController(catalogService), requireAuth);
  await predictionRoutes(
    app,
    new PredictionController(predictionService),
    requireAuth,
  );
  await adminRoutes(app, new AdminController(adminService), requireAuth);

  app.get("/health", async () => ({ ok: true }));

  app.setErrorHandler((error, request, reply) => {
    const body = request.body as { email?: unknown } | undefined;
    const baseLogFields = {
      requestId: request.id,
      method: request.method,
      url: request.url,
      ...emailLogFields(body?.email),
    };

    if (error instanceof ZodError) {
      logWarn("request.validation_failed", {
        ...baseLogFields,
        issues: error.flatten(),
      });

      return reply.status(400).send({
        message: "Dados invalidos.",
        issues: error.flatten(),
      });
    }

    if (error instanceof HttpError) {
      logWarn("request.http_error", {
        ...baseLogFields,
        statusCode: error.statusCode,
        message: error.message,
      });

      return reply.status(error.statusCode).send({
        message: error.message,
      });
    }

    logError("request.unhandled_error", {
      ...baseLogFields,
      ...errorLogFields(error),
    });

    return reply.status(500).send({
      message: "Erro interno.",
    });
  });

  return app;
}
