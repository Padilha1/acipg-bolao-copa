import type { Entry, User } from "./generated/prisma/index.js";

export type AuthContext = {
  user: User;
  entry: Entry | null;
};

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}
