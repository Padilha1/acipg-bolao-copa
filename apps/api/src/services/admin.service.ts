import { calculatePredictionPoints } from "../lib/points.js";
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
    homeTeamId: string;
    awayTeamId: string;
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
      homeTeamId: string;
      awayTeamId: string;
      startsAt: Date;
      venue: string | null;
    }>,
  ) {
    return this.adminRepository
      .updateMatch(id, {
        roundId: input.roundId ? stringToBigIntId(input.roundId) : undefined,
        homeTeamId: input.homeTeamId
          ? stringToBigIntId(input.homeTeamId)
          : undefined,
        awayTeamId: input.awayTeamId
          ? stringToBigIntId(input.awayTeamId)
          : undefined,
        startsAt: input.startsAt,
      })
      .then(matchToDto);
  }

  async updateResult(
    id: string,
    result: { homeScore: number; awayScore: number },
  ) {
    const match = await this.adminRepository.updateMatchResult(id, result);
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
          calculatePredictionPoints(
            {
              homeScore: prediction.homeScore,
              awayScore: prediction.awayScore,
            },
            {
              homeScore: match.homeScore as number,
              awayScore: match.awayScore as number,
            },
          ),
        ),
      ),
    );

    return { updated: match.predictions.length };
  }
}
