import { HttpError } from "../lib/http-error.js";
import { idToString, stringToBigIntId } from "../lib/serializers.js";
import type { PredictionRepository } from "../repositories/prediction.repository.js";

export class PredictionService {
  constructor(private readonly predictionRepository: PredictionRepository) {}

  async listMine(entryId: bigint) {
    const predictions = await this.predictionRepository.listByEntry(entryId);
    return predictions.map((prediction) => ({
      id: idToString(prediction.id),
      matchId: idToString(prediction.matchId),
      entryId: idToString(prediction.entryId),
      homeScore: prediction.homeScore,
      awayScore: prediction.awayScore,
      points: prediction.points,
    }));
  }

  async upsert(
    entryId: bigint,
    matchId: string,
    input: { homeScore: number; awayScore: number },
  ) {
    const numericMatchId = stringToBigIntId(matchId);
    const match = await this.predictionRepository.findMatch(numericMatchId);
    if (!match) {
      throw new HttpError(404, "Jogo nao encontrado.");
    }

    if (match.startsAt <= new Date()) {
      throw new HttpError(409, "Palpites encerrados para este jogo.");
    }

    const prediction = await this.predictionRepository.upsertPrediction({
      entryId,
      matchId: numericMatchId,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
    });

    return {
      id: idToString(prediction.id),
      matchId: idToString(prediction.matchId),
      entryId: idToString(prediction.entryId),
      homeScore: prediction.homeScore,
      awayScore: prediction.awayScore,
      points: prediction.points,
    };
  }

  ranking() {
    return this.predictionRepository.ranking();
  }
}
