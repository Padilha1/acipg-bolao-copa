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

  async leaderboardPodiumVoteRanking() {
    const rows =
      await this.predictionRepository.leaderboardPodiumVoteRanking();

    return rows.map((row) => ({
      position: Number(row.podiumPosition),
      entryId: idToString(row.entryId),
      userId: idToString(row.userId),
      name: row.name,
      votes: Number(row.votes),
    }));
  }

  async getLeaderboardPodiumPrediction(entryId: bigint) {
    const prediction =
      await this.predictionRepository.findLeaderboardPodiumPrediction(entryId);

    if (!prediction) return null;

    return {
      id: idToString(prediction.id),
      entryId: idToString(prediction.entryId),
      firstEntryId: idToString(prediction.firstEntryId),
      secondEntryId: idToString(prediction.secondEntryId),
      thirdEntryId: idToString(prediction.thirdEntryId),
      updatedAt: prediction.updatedAt?.toISOString() ?? null,
    };
  }

  async upsertLeaderboardPodiumPrediction(
    entryId: bigint,
    input: {
      firstEntryId: string;
      secondEntryId: string;
      thirdEntryId: string;
    },
  ) {
    const entryIds = [
      stringToBigIntId(input.firstEntryId),
      stringToBigIntId(input.secondEntryId),
      stringToBigIntId(input.thirdEntryId),
    ];
    const existingEntries =
      await this.predictionRepository.listEntriesByIds(entryIds);

    if (existingEntries.length !== entryIds.length) {
      throw new HttpError(404, "Participante selecionado nao encontrado.");
    }

    const prediction =
      await this.predictionRepository.upsertLeaderboardPodiumPrediction({
        entryId,
        firstEntryId: entryIds[0],
        secondEntryId: entryIds[1],
        thirdEntryId: entryIds[2],
      });

    return {
      id: idToString(prediction.id),
      entryId: idToString(prediction.entryId),
      firstEntryId: idToString(prediction.firstEntryId),
      secondEntryId: idToString(prediction.secondEntryId),
      thirdEntryId: idToString(prediction.thirdEntryId),
      updatedAt: prediction.updatedAt?.toISOString() ?? null,
    };
  }
}
