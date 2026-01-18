/**
 * EMI Calculation Formula:
 * EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]
 * P = principal
 * R = monthly interest rate
 * N = tenure in months
 */

exports.calculateEMI = (principal, annualRate, tenureMonths) => {
  const monthlyRate = annualRate / 12 / 100;

  const emi =
    (principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  return Math.round(emi);
};
