import type {
  PrismaClient,
  bracket_source_outcome,
  rounds_phase,
} from "../generated/prisma/index.js";
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
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    homeSourceMatchId?: string | null;
    awaySourceMatchId?: string | null;
    homeSourceOutcome?: bracket_source_outcome | null;
    awaySourceOutcome?: bracket_source_outcome | null;
    externalId?: string | null;
    bracketPosition?: number | null;
    startsAt: Date;
    venue?: string | null;
  }) {
    const poolId = await this.findDefaultPoolId();

    return this.db.match.create({
      data: {
        pool_id: poolId,
        roundId: stringToBigIntId(data.roundId),
        homeTeamId: data.homeTeamId ? stringToBigIntId(data.homeTeamId) : null,
        awayTeamId: data.awayTeamId ? stringToBigIntId(data.awayTeamId) : null,
        homeSourceMatchId: data.homeSourceMatchId
          ? stringToBigIntId(data.homeSourceMatchId)
          : null,
        awaySourceMatchId: data.awaySourceMatchId
          ? stringToBigIntId(data.awaySourceMatchId)
          : null,
        homeSourceOutcome: data.homeSourceOutcome,
        awaySourceOutcome: data.awaySourceOutcome,
        externalId: data.externalId,
        bracketPosition: data.bracketPosition,
        startsAt: data.startsAt,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        qualifiedTeam: true,
        round: true,
      },
    });
  }

  updateMatch(
    id: string,
    data: Partial<{
      roundId: bigint;
      homeTeamId: bigint | null;
      awayTeamId: bigint | null;
      homeSourceMatchId: bigint | null;
      awaySourceMatchId: bigint | null;
      homeSourceOutcome: bracket_source_outcome | null;
      awaySourceOutcome: bracket_source_outcome | null;
      externalId: string | null;
      bracketPosition: number | null;
      startsAt: Date;
    }>,
  ) {
    return this.db.match.update({
      where: { id: stringToBigIntId(id) },
      data,
      include: {
        homeTeam: true,
        awayTeam: true,
        qualifiedTeam: true,
        round: true,
      },
    });
  }

  updateMatchResult(
    id: string,
    data: {
      homeScore: number;
      awayScore: number;
      qualifiedTeamId?: string | null;
    },
  ) {
    return this.db.match.update({
      where: { id: stringToBigIntId(id) },
      data: {
        ...data,
        qualifiedTeamId: data.qualifiedTeamId
          ? stringToBigIntId(data.qualifiedTeamId)
          : null,
        status: "finished",
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        qualifiedTeam: true,
        round: true,
      },
    });
  }

  findMatchWithPredictions(id: string) {
    return this.db.match.findUnique({
      where: { id: stringToBigIntId(id) },
      include: {
        predictions: true,
        round: true,
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  async propagateResult(id: string) {
    const source = await this.db.match.findUnique({
      where: { id: stringToBigIntId(id) },
    });
    if (!source?.qualifiedTeamId || !source.homeTeamId || !source.awayTeamId) {
      return;
    }

    const loserTeamId =
      source.qualifiedTeamId === source.homeTeamId
        ? source.awayTeamId
        : source.homeTeamId;
    const dependents = await this.db.match.findMany({
      where: {
        OR: [
          { homeSourceMatchId: source.id },
          { awaySourceMatchId: source.id },
        ],
      },
    });

    for (const dependent of dependents) {
      const teamFor = (outcome: bracket_source_outcome | null) =>
        outcome === "loser" ? loserTeamId : source.qualifiedTeamId;
      await this.db.match.update({
        where: { id: dependent.id },
        data: {
          homeTeamId:
            dependent.homeSourceMatchId === source.id
              ? teamFor(dependent.homeSourceOutcome)
              : undefined,
          awayTeamId:
            dependent.awaySourceMatchId === source.id
              ? teamFor(dependent.awaySourceOutcome)
              : undefined,
        },
      });
    }
  }

  updatePredictionPoints(id: bigint, points: number) {
    return this.db.prediction.update({
      where: { id },
      data: { points },
    });
  }
}
