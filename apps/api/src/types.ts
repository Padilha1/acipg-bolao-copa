import type { Entry, User } from "@prisma/client";

export type AuthContext = {
  user: User;
  entry: Entry | null;
};

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}
