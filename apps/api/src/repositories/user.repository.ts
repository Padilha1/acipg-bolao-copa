import type { PrismaClient } from "../generated/prisma/index.js";

export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async upsertByEmail(email: string, name?: string) {
    const existing = await this.findByEmail(email);
    if (existing) return existing;

    return this.db.user.create({
      data: { email, name: name ?? null, role: "participant" },
    });
  }

  updateProfile(userId: bigint, data: { name?: string }) {
    return this.db.user.update({
      where: { id: userId },
      data,
    });
  }
}
