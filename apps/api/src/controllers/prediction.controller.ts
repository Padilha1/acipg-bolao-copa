import {
  leaderboardPodiumPredictionInputSchema,
  predictionInputSchema,
} from "@bolao-acipg/shared";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import type { PredictionService } from "../services/prediction.service.js";

const paramsSchema = z.object({
  matchId: z.string().regex(/^\d+$/),
});

export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  mine = async (request: FastifyRequest) => {
    if (!request.auth?.entry) throw new HttpError(401, "Inscricao ausente.");
    return this.predictionService.listMine(request.auth.entry.id);
  };

  upsert = async (request: FastifyRequest) => {
    if (!request.auth?.entry) throw new HttpError(401, "Inscricao ausente.");
    const params = paramsSchema.parse(request.params);
    const body = predictionInputSchema.parse(request.body);

    return this.predictionService.upsert(
      request.auth.entry.id,
      params.matchId,
      {
        homeScore: body.homeScore,
        awayScore: body.awayScore,
      },
    );
  };

  ranking = () => this.predictionService.ranking();

  leaderboardPodiumTop = () =>
    this.predictionService.leaderboardPodiumVoteRanking();

  leaderboardPodiumMine = async (request: FastifyRequest) => {
    if (!request.auth?.entry) throw new HttpError(401, "Inscricao ausente.");
    return this.predictionService.getLeaderboardPodiumPrediction(
      request.auth.entry.id,
    );
  };

  upsertLeaderboardPodium = async (request: FastifyRequest) => {
    if (!request.auth?.entry) throw new HttpError(401, "Inscricao ausente.");
    const body = leaderboardPodiumPredictionInputSchema.parse(request.body);

    return this.predictionService.upsertLeaderboardPodiumPrediction(
      request.auth.entry.id,
      body,
    );
  };
}
