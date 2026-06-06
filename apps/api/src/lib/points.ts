type Score = {
  homeScore: number;
  awayScore: number;
};

function outcome(score: Score) {
  if (score.homeScore > score.awayScore) return "home";
  if (score.homeScore < score.awayScore) return "away";
  return "draw";
}

export function calculatePredictionPoints(prediction: Score, result: Score) {
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

  return points;
}
