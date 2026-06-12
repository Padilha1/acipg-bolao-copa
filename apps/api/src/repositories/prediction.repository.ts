import type { PrismaClient } from "../generated/prisma/index.js";
import { idToString } from "../lib/serializers.js";

type LeaderboardPodiumPredictionRow = {
  id: bigint;
  entryId: bigint;
  firstEntryId: bigint;
  secondEntryId: bigint;
  thirdEntryId: bigint;
  updatedAt: Date | null;
};

type LeaderboardPodiumVoteRow = {
  entryId: bigint;
  userId: bigint;
  name: string;
  votes: bigint | number | string;
};

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

  listEntriesByIds(entryIds: bigint[]) {
    return this.db.entry.findMany({
      where: {
        id: { in: entryIds },
      },
      select: { id: true },
    });
  }

  async leaderboardPodiumVoteRanking() {
    return this.db.$queryRaw<LeaderboardPodiumVoteRow[]>`
      select
        e.id as entryId,
        e.user_id as userId,
        coalesce(u.name, e.display_name, u.email) as name,
        count(*) as votes
      from (
        select first_entry_id as voted_entry_id
        from leaderboard_podium_predictions
        union all
        select second_entry_id as voted_entry_id
        from leaderboard_podium_predictions
        union all
        select third_entry_id as voted_entry_id
        from leaderboard_podium_predictions
      ) votes
      inner join entries e on e.id = votes.voted_entry_id
      inner join users u on u.id = e.user_id
      group by e.id, e.user_id, u.name, e.display_name, u.email
      order by votes desc, name asc
      limit 3
    `;
  }

  async findLeaderboardPodiumPrediction(entryId: bigint) {
    const rows = await this.db.$queryRaw<LeaderboardPodiumPredictionRow[]>`
      select
        id,
        entry_id as entryId,
        first_entry_id as firstEntryId,
        second_entry_id as secondEntryId,
        third_entry_id as thirdEntryId,
        updated_at as updatedAt
      from leaderboard_podium_predictions
      where entry_id = ${entryId}
      limit 1
    `;

    return rows[0] ?? null;
  }

  async upsertLeaderboardPodiumPrediction(input: {
    entryId: bigint;
    firstEntryId: bigint;
    secondEntryId: bigint;
    thirdEntryId: bigint;
  }) {
    await this.db.$executeRaw`
      insert into leaderboard_podium_predictions
        (entry_id, first_entry_id, second_entry_id, third_entry_id)
      values
        (
          ${input.entryId},
          ${input.firstEntryId},
          ${input.secondEntryId},
          ${input.thirdEntryId}
        )
      on duplicate key update
        first_entry_id = ${input.firstEntryId},
        second_entry_id = ${input.secondEntryId},
        third_entry_id = ${input.thirdEntryId},
        updated_at = current_timestamp
    `;

    const prediction = await this.findLeaderboardPodiumPrediction(input.entryId);
    if (!prediction) {
      throw new Error("Failed to save leaderboard podium prediction.");
    }

    return prediction;
  }
}
