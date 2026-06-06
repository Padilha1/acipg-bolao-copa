import type { PrismaClient } from "../generated/prisma/index.js";

export class CatalogRepository {
  constructor(private readonly db: PrismaClient) {}

  listTeams() {
    return this.db.team.findMany({
      orderBy: [{ group_code: "asc" }, { name: "asc" }],
    });
  }

  listRounds() {
    return this.db.round.findMany({
      orderBy: { sort_order: "asc" },
    });
  }

  listMatches() {
    return this.db.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        startsAt: "asc",
      },
    });
  }
}
