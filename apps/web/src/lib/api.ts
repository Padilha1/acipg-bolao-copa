import type {
  AuthSessionDto,
  LeaderboardPodiumPredictionDto,
  LeaderboardPodiumPredictionInput,
  LeaderboardPodiumVoteRowDto,
  MatchDto,
  MeDto,
  PredictionDto,
  RankingRowDto,
  RoundDto,
  TeamDto,
} from "@bolao-acipg/shared";
import ky from "ky";

const SESSION_TOKEN_KEY = "bolao_session_token";

function getSessionToken() {
  return window.localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setSessionToken(token: string) {
  window.localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken() {
  window.localStorage.removeItem(SESSION_TOKEN_KEY);
}

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3333",
  credentials: "include",
  hooks: {
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          clearSessionToken();
        }
      },
    ],
    beforeRequest: [
      (request) => {
        const token = getSessionToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});

export const apiClient = {
  startAuth: (input: { email: string; name: string }) =>
    api.post("auth/start", { json: input }).json<AuthSessionDto>(),
  verifyAuth: (email: string, code: string) =>
    api.post("auth/verify", { json: { email, code } }).json<AuthSessionDto>(),
  me: () => api.get("me").json<MeDto>(),
  teams: () => api.get("teams").json<TeamDto[]>(),
  rounds: () => api.get("rounds").json<RoundDto[]>(),
  matches: () => api.get("matches").json<MatchDto[]>(),
  predictions: () => api.get("predictions/me").json<PredictionDto[]>(),
  savePrediction: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    qualifiedTeamId?: string | null,
  ) =>
    api
      .put(`predictions/${matchId}`, {
        json: { homeScore, awayScore, qualifiedTeamId },
      })
      .json<PredictionDto>(),
  ranking: () => api.get("ranking").json<RankingRowDto[]>(),
  leaderboardPodiumPrediction: () =>
    api
      .get("leaderboard-podium-prediction/me")
      .json<LeaderboardPodiumPredictionDto | null>(),
  leaderboardPodiumVoteRanking: () =>
    api
      .get("leaderboard-podium-prediction/top")
      .json<LeaderboardPodiumVoteRowDto[]>(),
  saveLeaderboardPodiumPrediction: (input: LeaderboardPodiumPredictionInput) =>
    api
      .put("leaderboard-podium-prediction/me", { json: input })
      .json<LeaderboardPodiumPredictionDto>(),
  createRound: (input: { name: string; kind: string; order: number }) =>
    api.post("admin/rounds", { json: input }).json<RoundDto>(),
  createMatch: (input: {
    roundId: string;
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    startsAt: string;
    venue?: string;
  }) => api.post("admin/matches", { json: input }).json<MatchDto>(),
  updateResult: (
    matchId: string,
    input: {
      homeScore: number;
      awayScore: number;
      qualifiedTeamId?: string | null;
    },
  ) =>
    api
      .patch(`admin/matches/${matchId}/result`, { json: input })
      .json<MatchDto>(),
  recalculate: (matchId: string) =>
    api.post(`admin/recalculate/${matchId}`).json<{ updated: number }>(),
};
