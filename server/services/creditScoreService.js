/**
 * Credit Score Rules:
 * - Base score: existing user creditScore
 * - On EMI payment: +5
 * - On loan completion: +20
 * - On missed EMI (future): -25
 * - Min score: 300
 * - Max score: 900
 */

exports.updateCreditScore = (currentScore, action) => {
  let score = currentScore;

  switch (action) {
    case "EMI_PAID":
      score += 5;
      break;

    case "LOAN_COMPLETED":
      score += 20;
      break;

    case "EMI_MISSED":
      score -= 25;
      break;

    default:
      break;
  }

  // Enforce bounds
  if (score > 900) score = 900;
  if (score < 300) score = 300;

  return score;
};
