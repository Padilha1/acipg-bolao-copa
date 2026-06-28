type Score = {
  homeScore: number;
  awayScore: number;
};

type KnockoutPrediction = Score & {
  qualifiedTeamId: bigint | null;
};

function outcome(score: Score) {
  if (score.homeScore > score.awayScore) return "home";
  if (score.homeScore < score.awayScore) return "away";
  return "draw";
}

export function calculatePredictionPoints(
  prediction: Score,
  result: Score,
  multiplier = 1,
) {
  let points = 0;

  if (
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore
  ) {
    points += 5;
  } else if (outcome(prediction) === outcome(result)) {
    points += 3;
  }

  if (prediction.homeScore === result.homeScore) points += 1;
  if (prediction.awayScore === result.awayScore) points += 1;

  return points * multiplier;
}

export function calculateKnockoutPredictionPoints(
  prediction: KnockoutPrediction,
  result: KnockoutPrediction,
) {
  let points = 0;

  if (
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore
  ) {
    points += 6;
  } else {
    if (prediction.homeScore === result.homeScore) points += 2;
    if (prediction.awayScore === result.awayScore) points += 2;
  }

  if (
    prediction.qualifiedTeamId !== null &&
    prediction.qualifiedTeamId === result.qualifiedTeamId
  ) {
    points += 8;
  }

  return points;
}
