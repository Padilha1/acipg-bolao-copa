import type { PrismaClient } from "@prisma/client";

export class PoolRepository {
  constructor(private readonly db: PrismaClient) {}

  findDefaultPool() {
    return this.db.pool.findFirst({
      where: { status: "active" },
      orderBy: { id: "asc" },
    });
  }

  async upsertDefaultPool() {
    const pool = await this.findDefaultPool();
    if (pool) return pool;

    return this.db.pool.create({
      data: {
        name: "Bolao ACIPG Copa 2026",
        status: "active",
      },
    });
  }

  findEntry(userId: bigint, poolId: bigint) {
    return this.db.entry.findUnique({
      where: {
        userId_poolId: {
          userId,
          poolId,
        },
      },
    });
  }

  upsertEntry(userId: bigint, poolId: bigint) {
    return this.db.entry.upsert({
      where: {
        userId_poolId: {
          userId,
          poolId,
        },
      },
      update: {},
      create: {
        userId,
        poolId,
        display_name: "Participante",
      },
    });
  }
}
