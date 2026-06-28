import type {
  Entry,
  Match,
  Round,
  Team,
  User,
} from "../generated/prisma/index.js";

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
    homeTeam: Team | null;
    awayTeam: Team | null;
    qualifiedTeam: Team | null;
    round: Round;
  },
) {
  return {
    id: idToString(match.id),
    roundId: idToString(match.roundId),
    startsAt: match.startsAt.toISOString(),
    venue: null,
    phase: match.round.phase,
    bracketPosition: match.bracketPosition,
    externalId: match.externalId,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homeTeam: match.homeTeam ? teamToDto(match.homeTeam) : null,
    awayTeam: match.awayTeam ? teamToDto(match.awayTeam) : null,
    qualifiedTeam: match.qualifiedTeam ? teamToDto(match.qualifiedTeam) : null,
    homeSource:
      match.homeSourceMatchId && match.homeSourceOutcome
        ? {
            matchId: idToString(match.homeSourceMatchId),
            outcome: match.homeSourceOutcome,
          }
        : null,
    awaySource:
      match.awaySourceMatchId && match.awaySourceOutcome
        ? {
            matchId: idToString(match.awaySourceMatchId),
            outcome: match.awaySourceOutcome,
          }
        : null,
  };
}
