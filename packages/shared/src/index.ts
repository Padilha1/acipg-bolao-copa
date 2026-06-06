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
});

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
  homeTeamId: z.string().regex(/^\d+$/),
  awayTeamId: z.string().regex(/^\d+$/),
  startsAt: z.coerce.date(),
  venue: z.string().trim().max(120).optional().nullable(),
});

export const updateMatchSchema = createMatchSchema.partial();

export const updateMatchResultSchema = z.object({
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
});

export type AuthStartInput = z.infer<typeof authStartSchema>;
export type AuthVerifyInput = z.infer<typeof authVerifySchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type PredictionInput = z.infer<typeof predictionInputSchema>;
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
  status: "scheduled" | "finished";
  homeTeam: TeamDto;
  awayTeam: TeamDto;
  homeScore: number | null;
  awayScore: number | null;
};

export type PredictionDto = {
  id: string;
  matchId: string;
  entryId: string;
  homeScore: number;
  awayScore: number;
  points: number;
};

export type RankingRowDto = {
  position: number;
  entryId: string;
  userId: string;
  name: string;
  points: number;
};
