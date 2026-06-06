import type { PrismaClient } from "../generated/prisma/index.js";
import { idToString } from "../lib/serializers.js";

export class PredictionRepository {
  constructor(private readonly db: PrismaClient) {}

  listByEntry(entryId: bigint) {
    return this.db.prediction.findMany({
      where: { entryId },
      orderBy: { createdAt: "desc" },
    });
  }

  findMatch(matchId: bigint) {
    return this.db.match.findUnique({
      where: { id: matchId },
    });
  }

  upsertPrediction(input: {
    entryId: bigint;
    matchId: bigint;
    homeScore: number;
    awayScore: number;
  }) {
    return this.db.prediction.upsert({
      where: {
        entryId_matchId: {
          entryId: input.entryId,
          matchId: input.matchId,
        },
      },
      update: {
        homeScore: input.homeScore,
        awayScore: input.awayScore,
      },
      create: input,
    });
  }

  async ranking() {
    const rows = await this.db.entry.findMany({
      include: {
        user: true,
        predictions: true,
      },
    });

    return rows
      .map((entry) => ({
        entryId: entry.id,
        userId: entry.userId,
        name: entry.user.name ?? entry.display_name ?? entry.user.email,
        points: entry.predictions.reduce(
          (sum, prediction) => sum + prediction.points,
          0,
        ),
      }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((row, index) => ({
        position: index + 1,
        entryId: idToString(row.entryId),
        userId: idToString(row.userId),
        name: row.name,
        points: row.points,
      }));
  }
}
