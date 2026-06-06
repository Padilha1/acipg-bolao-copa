import type { PrismaClient } from "../generated/prisma/index.js";

export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  upsertByEmail(email: string, name?: string) {
    return this.db.user.upsert({
      where: { email },
      update: name ? { name } : {},
      create: { email, name: name ?? null, role: "participant" },
    });
  }

  updateProfile(userId: bigint, data: { name?: string }) {
    return this.db.user.update({
      where: { id: userId },
      data,
    });
  }
}
