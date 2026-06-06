import type {
  MatchDto,
  MeDto,
  PredictionDto,
  RankingRowDto,
  RoundDto,
  TeamDto,
} from "@bolao-acipg/shared";
import ky from "ky";

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3333",
  credentials: "include",
});

export const apiClient = {
  startAuth: (input: { email: string; name: string }) =>
    api.post("auth/start", { json: input }).json<MeDto>(),
  verifyAuth: (email: string, code: string) =>
    api.post("auth/verify", { json: { email, code } }).json<MeDto>(),
  me: () => api.get("me").json<MeDto>(),
  teams: () => api.get("teams").json<TeamDto[]>(),
  rounds: () => api.get("rounds").json<RoundDto[]>(),
  matches: () => api.get("matches").json<MatchDto[]>(),
  predictions: () => api.get("predictions/me").json<PredictionDto[]>(),
  savePrediction: (matchId: string, homeScore: number, awayScore: number) =>
    api
      .put(`predictions/${matchId}`, { json: { homeScore, awayScore } })
      .json<PredictionDto>(),
  ranking: () => api.get("ranking").json<RankingRowDto[]>(),
  createRound: (input: { name: string; kind: string; order: number }) =>
    api.post("admin/rounds", { json: input }).json<RoundDto>(),
  createMatch: (input: {
    roundId: string;
    homeTeamId: string;
    awayTeamId: string;
    startsAt: string;
    venue?: string;
  }) => api.post("admin/matches", { json: input }).json<MatchDto>(),
  updateResult: (
    matchId: string,
    input: { homeScore: number; awayScore: number },
  ) =>
    api
      .patch(`admin/matches/${matchId}/result`, { json: input })
      .json<MatchDto>(),
  recalculate: (matchId: string) =>
    api.post(`admin/recalculate/${matchId}`).json<{ updated: number }>(),
};
