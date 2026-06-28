import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();

export const authStartSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2).max(120),
});

export const authVerifySchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/),
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  displayName: z.string().trim().min(1).max(80).optional(),
});

export const predictionInputSchema = z.object({
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  qualifiedTeamId: z.string().regex(/^\d+$/).nullable().optional(),
});

export const leaderboardPodiumPredictionInputSchema = z
  .object({
    firstEntryId: z.string().regex(/^\d+$/),
    secondEntryId: z.string().regex(/^\d+$/),
    thirdEntryId: z.string().regex(/^\d+$/),
  })
  .refine(
    (input) =>
      new Set([input.firstEntryId, input.secondEntryId, input.thirdEntryId])
        .size === 3,
    "Escolha participantes diferentes para cada posicao.",
  );

export const createRoundSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z
    .enum([
      "group",
      "round_32",
      "round_16",
      "quarter",
      "semi",
      "third_place",
      "final",
    ])
    .default("group"),
  order: z.coerce.number().int().min(1),
});

export const createMatchSchema = z.object({
  roundId: z.string().regex(/^\d+$/),
  homeTeamId: z.string().regex(/^\d+$/).nullable().optional(),
  awayTeamId: z.string().regex(/^\d+$/).nullable().optional(),
  homeSourceMatchId: z.string().regex(/^\d+$/).nullable().optional(),
  awaySourceMatchId: z.string().regex(/^\d+$/).nullable().optional(),
  homeSourceOutcome: z.enum(["winner", "loser"]).nullable().optional(),
  awaySourceOutcome: z.enum(["winner", "loser"]).nullable().optional(),
  externalId: z.string().trim().min(1).max(100).nullable().optional(),
  bracketPosition: z.coerce.number().int().min(1).nullable().optional(),
  startsAt: z.coerce.date(),
  venue: z.string().trim().max(120).optional().nullable(),
});

export const updateMatchSchema = createMatchSchema.partial();

export const updateMatchResultSchema = z.object({
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  qualifiedTeamId: z.string().regex(/^\d+$/).nullable().optional(),
});

export type AuthStartInput = z.infer<typeof authStartSchema>;
export type AuthVerifyInput = z.infer<typeof authVerifySchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type PredictionInput = z.infer<typeof predictionInputSchema>;
export type LeaderboardPodiumPredictionInput = z.infer<
  typeof leaderboardPodiumPredictionInputSchema
>;
export type CreateRoundInput = z.infer<typeof createRoundSchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type UpdateMatchResultInput = z.infer<typeof updateMatchResultSchema>;

export type UserDto = {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  isAdmin: boolean;
};

export type EntryDto = {
  id: string;
  nickname: string | null;
  points: number;
};

export type MeDto = {
  user: UserDto;
  entry: EntryDto | null;
};

export type AuthSessionDto = MeDto & {
  sessionToken: string;
};

export type TeamDto = {
  id: string;
  fifaCode: string;
  name: string;
  group: string | null;
};

export type RoundDto = {
  id: string;
  name: string;
  kind: string;
  order: number;
};

export type MatchDto = {
  id: string;
  roundId: string;
  startsAt: string;
  venue: string | null;
  phase:
    | "group"
    | "round_32"
    | "round_16"
    | "quarter"
    | "semi"
    | "third_place"
    | "final";
  bracketPosition: number | null;
  externalId: string | null;
  status: "scheduled" | "locked" | "finished";
  homeTeam: TeamDto | null;
  awayTeam: TeamDto | null;
  qualifiedTeam: TeamDto | null;
  homeSource: BracketSourceDto | null;
  awaySource: BracketSourceDto | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type BracketSourceDto = {
  matchId: string;
  outcome: "winner" | "loser";
};

export type PredictionDto = {
  id: string;
  matchId: string;
  entryId: string;
  homeScore: number;
  awayScore: number;
  qualifiedTeamId: string | null;
  points: number;
};

export type RankingRowDto = {
  position: number;
  entryId: string;
  userId: string;
  name: string;
  points: number;
};

export type LeaderboardPodiumPredictionDto = {
  id: string;
  entryId: string;
  firstEntryId: string;
  secondEntryId: string;
  thirdEntryId: string;
  updatedAt: string | null;
};

export type LeaderboardPodiumVoteRowDto = {
  position: number;
  entryId: string;
  userId: string;
  name: string;
  votes: number;
};
