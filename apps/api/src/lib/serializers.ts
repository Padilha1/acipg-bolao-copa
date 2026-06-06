import type { Entry, Match, Team, User } from "@prisma/client";

export function idToString(id: bigint) {
  return id.toString();
}

export function stringToBigIntId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new Error("Invalid numeric id.");
  }

  return BigInt(id);
}

export function teamToDto(team: Team) {
  return {
    id: idToString(team.id),
    fifaCode: team.code,
    name: team.name,
    group: team.group_code,
  };
}

export function entryToDto(entry: Entry, points = 0) {
  return {
    id: idToString(entry.id),
    nickname: entry.display_name,
    points,
  };
}

export function userToDto(user: User, isAdmin: boolean) {
  return {
    id: idToString(user.id),
    email: user.email,
    name: user.name,
    displayName: user.name,
    isAdmin,
  };
}

export function matchToDto(
  match: Match & {
    homeTeam: Team;
    awayTeam: Team;
  },
) {
  return {
    id: idToString(match.id),
    roundId: idToString(match.roundId),
    startsAt: match.startsAt.toISOString(),
    venue: null,
    status: match.status === "finished" ? "finished" : "scheduled",
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homeTeam: teamToDto(match.homeTeam),
    awayTeam: teamToDto(match.awayTeam),
  };
}
