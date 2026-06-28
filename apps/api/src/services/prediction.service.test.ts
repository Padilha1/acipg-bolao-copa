import assert from "node:assert/strict";
import test from "node:test";
import type { PredictionRepository } from "../repositories/prediction.repository.js";
import { PredictionService } from "./prediction.service.js";

function repository(startsAt = new Date("2099-01-01T12:00:00Z")) {
  return {
    findMatch: async () => ({
      id: 10n,
      startsAt,
      homeTeamId: 1n,
      awayTeamId: 2n,
      status: "scheduled",
      round: { phase: "round_32" },
    }),
    upsertPrediction: async (input: {
      entryId: bigint;
      matchId: bigint;
      homeScore: number;
      awayScore: number;
      qualifiedTeamId: bigint | null;
    }) => ({
      id: 20n,
      points: 0,
      createdAt: new Date(),
      updatedAt: null,
      ...input,
    }),
  } as unknown as PredictionRepository;
}

test("exige classificado no mata-mata", async () => {
  const service = new PredictionService(repository());
  await assert.rejects(
    service.upsert(1n, "10", { homeScore: 1, awayScore: 1 }),
    /Escolha o time que avanca/,
  );
});

test("aceita empate com classificado escolhido separadamente", async () => {
  const service = new PredictionService(repository());
  const saved = await service.upsert(1n, "10", {
    homeScore: 1,
    awayScore: 1,
    qualifiedTeamId: "2",
  });
  assert.equal(saved.qualifiedTeamId, "2");
});

test("rejeita classificado inconsistente com placar sem empate", async () => {
  const service = new PredictionService(repository());
  await assert.rejects(
    service.upsert(1n, "10", {
      homeScore: 2,
      awayScore: 0,
      qualifiedTeamId: "2",
    }),
    /nao combina com o placar/,
  );
});

test("bloqueia alteracao depois do inicio", async () => {
  const service = new PredictionService(repository(new Date("2020-01-01")));
  await assert.rejects(
    service.upsert(1n, "10", {
      homeScore: 1,
      awayScore: 0,
      qualifiedTeamId: "1",
    }),
    /Palpites encerrados/,
  );
});
