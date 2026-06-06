import type { PrismaClient, rounds_phase } from "@prisma/client";
import { stringToBigIntId } from "../lib/serializers.js";

export class AdminRepository {
  constructor(private readonly db: PrismaClient) {}

  private async findDefaultPoolId() {
    const pool = await this.db.pool.findFirst({
      where: { status: "active" },
      orderBy: { id: "asc" },
    });

    if (pool) return pool.id;

    const created = await this.db.pool.create({
      data: {
        name: "Bolao ACIPG Copa 2026",
        status: "active",
      },
    });

    return created.id;
  }

  async createRound(data: { name: string; kind: string; order: number }) {
    const poolId = await this.findDefaultPoolId();

    return this.db.round.create({
      data: {
        pool_id: poolId,
        name: data.name,
        phase: data.kind as rounds_phase,
        sort_order: data.order,
      },
    });
  }

  async createMatch(data: {
    roundId: string;
    homeTeamId: string;
    awayTeamId: string;
    startsAt: Date;
    venue?: string | null;
  }) {
    const poolId = await this.findDefaultPoolId();

    return this.db.match.create({
      data: {
        pool_id: poolId,
        roundId: stringToBigIntId(data.roundId),
        homeTeamId: stringToBigIntId(data.homeTeamId),
        awayTeamId: stringToBigIntId(data.awayTeamId),
        startsAt: data.startsAt,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  updateMatch(
    id: string,
    data: Partial<{
      roundId: bigint;
      homeTeamId: bigint;
      awayTeamId: bigint;
      startsAt: Date;
    }>,
  ) {
    return this.db.match.update({
      where: { id: stringToBigIntId(id) },
      data,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  updateMatchResult(
    id: string,
    data: { homeScore: number; awayScore: number },
  ) {
    return this.db.match.update({
      where: { id: stringToBigIntId(id) },
      data: {
        ...data,
        status: "finished",
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  findMatchWithPredictions(id: string) {
    return this.db.match.findUnique({
      where: { id: stringToBigIntId(id) },
      include: {
        predictions: true,
      },
    });
  }

  updatePredictionPoints(id: bigint, points: number) {
    return this.db.prediction.update({
      where: { id },
      data: { points },
    });
  }
}
