import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateKnockoutPredictionPoints,
  calculatePredictionPoints,
} from "./points.js";

test("mantem a pontuacao atual na fase de grupos", () => {
  assert.equal(
    calculatePredictionPoints(
      { homeScore: 2, awayScore: 1 },
      { homeScore: 2, awayScore: 1 },
    ),
    7,
  );
  assert.equal(
    calculatePredictionPoints(
      { homeScore: 3, awayScore: 0 },
      { homeScore: 2, awayScore: 0 },
    ),
    4,
  );
});

test("soma 6 pelo placar exato e 8 pelo classificado no mata-mata", () => {
  assert.equal(
    calculateKnockoutPredictionPoints(
      { homeScore: 1, awayScore: 1, qualifiedTeamId: 1n },
      { homeScore: 1, awayScore: 1, qualifiedTeamId: 1n },
    ),
    14,
  );
  assert.equal(
    calculateKnockoutPredictionPoints(
      { homeScore: 1, awayScore: 1, qualifiedTeamId: 1n },
      { homeScore: 1, awayScore: 1, qualifiedTeamId: 2n },
    ),
    6,
  );
  assert.equal(
    calculateKnockoutPredictionPoints(
      { homeScore: 2, awayScore: 0, qualifiedTeamId: 1n },
      { homeScore: 3, awayScore: 0, qualifiedTeamId: 1n },
    ),
    10,
  );
  assert.equal(
    calculateKnockoutPredictionPoints(
      { homeScore: 2, awayScore: 0, qualifiedTeamId: 1n },
      { homeScore: 3, awayScore: 1, qualifiedTeamId: 2n },
    ),
    0,
  );
  assert.equal(
    calculateKnockoutPredictionPoints(
      { homeScore: 2, awayScore: 0, qualifiedTeamId: 2n },
      { homeScore: 2, awayScore: 1, qualifiedTeamId: 1n },
    ),
    2,
  );
});
