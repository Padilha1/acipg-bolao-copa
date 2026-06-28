import { HttpError } from "../lib/http-error.js";
import {
  calculateKnockoutPredictionPoints,
  calculatePredictionPoints,
} from "../lib/points.js";
import {
  idToString,
  matchToDto,
  stringToBigIntId,
} from "../lib/serializers.js";
import type { AdminRepository } from "../repositories/admin.repository.js";

export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async createRound(input: { name: string; kind: string; order: number }) {
    const round = await this.adminRepository.createRound(input);
    return {
      id: idToString(round.id),
      name: round.name,
      kind: round.phase,
      order: round.sort_order,
    };
  }

  async createMatch(input: {
    roundId: string;
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    homeSourceMatchId?: string | null;
    awaySourceMatchId?: string | null;
    homeSourceOutcome?: "winner" | "loser" | null;
    awaySourceOutcome?: "winner" | "loser" | null;
    externalId?: string | null;
    bracketPosition?: number | null;
    startsAt: Date;
    venue?: string | null;
  }) {
    const match = await this.adminRepository.createMatch(input);
    return matchToDto(match);
  }

  updateMatch(
    id: string,
    input: Partial<{
      roundId: string;
      homeTeamId: string | null;
      awayTeamId: string | null;
      homeSourceMatchId: string | null;
      awaySourceMatchId: string | null;
      homeSourceOutcome: "winner" | "loser" | null;
      awaySourceOutcome: "winner" | "loser" | null;
      externalId: string | null;
      bracketPosition: number | null;
      startsAt: Date;
      venue: string | null;
    }>,
  ) {
    return this.adminRepository
      .updateMatch(id, {
        roundId: input.roundId ? stringToBigIntId(input.roundId) : undefined,
        homeTeamId:
          input.homeTeamId === undefined
            ? undefined
            : input.homeTeamId
              ? stringToBigIntId(input.homeTeamId)
              : null,
        awayTeamId:
          input.awayTeamId === undefined
            ? undefined
            : input.awayTeamId
              ? stringToBigIntId(input.awayTeamId)
              : null,
        homeSourceMatchId:
          input.homeSourceMatchId === undefined
            ? undefined
            : input.homeSourceMatchId
              ? stringToBigIntId(input.homeSourceMatchId)
              : null,
        awaySourceMatchId:
          input.awaySourceMatchId === undefined
            ? undefined
            : input.awaySourceMatchId
              ? stringToBigIntId(input.awaySourceMatchId)
              : null,
        homeSourceOutcome: input.homeSourceOutcome,
        awaySourceOutcome: input.awaySourceOutcome,
        externalId: input.externalId,
        bracketPosition: input.bracketPosition,
        startsAt: input.startsAt,
      })
      .then(matchToDto);
  }

  async updateResult(
    id: string,
    result: {
      homeScore: number;
      awayScore: number;
      qualifiedTeamId?: string | null;
    },
  ) {
    const current = await this.adminRepository.findMatchWithPredictions(id);
    if (!current) {
      throw new HttpError(404, "Jogo nao encontrado.");
    }
    const isKnockout = current.round.phase !== "group";
    if (isKnockout && !result.qualifiedTeamId) {
      throw new HttpError(400, "Informe o classificado do jogo eliminatorio.");
    }
    const qualifiedTeamId = result.qualifiedTeamId
      ? stringToBigIntId(result.qualifiedTeamId)
      : null;
    if (
      qualifiedTeamId &&
      qualifiedTeamId !== current.homeTeamId &&
      qualifiedTeamId !== current.awayTeamId
    ) {
      throw new HttpError(400, "O classificado deve participar do confronto.");
    }
    const scoreWinnerId =
      result.homeScore === result.awayScore
        ? null
        : result.homeScore > result.awayScore
          ? current.homeTeamId
          : current.awayTeamId;
    if (isKnockout && scoreWinnerId && qualifiedTeamId !== scoreWinnerId) {
      throw new HttpError(400, "O classificado nao combina com o placar.");
    }

    const match = await this.adminRepository.updateMatchResult(id, result);
    await this.adminRepository.propagateResult(id);
    await this.recalculate(id);
    return matchToDto(match);
  }

  async recalculate(matchId: string) {
    const match = await this.adminRepository.findMatchWithPredictions(matchId);
    if (!match || match.homeScore === null || match.awayScore === null) {
      return { updated: 0 };
    }

    await Promise.all(
      match.predictions.map((prediction) =>
        this.adminRepository.updatePredictionPoints(
          prediction.id,
          match.round.phase === "group"
            ? calculatePredictionPoints(
                {
                  homeScore: prediction.homeScore,
                  awayScore: prediction.awayScore,
                },
                {
                  homeScore: match.homeScore as number,
                  awayScore: match.awayScore as number,
                },
              )
            : calculateKnockoutPredictionPoints(
                {
                  homeScore: prediction.homeScore,
                  awayScore: prediction.awayScore,
                  qualifiedTeamId: prediction.qualifiedTeamId,
                },
                {
                  homeScore: match.homeScore as number,
                  awayScore: match.awayScore as number,
                  qualifiedTeamId: match.qualifiedTeamId,
                },
              ),
        ),
      ),
    );

    return { updated: match.predictions.length };
  }
}
