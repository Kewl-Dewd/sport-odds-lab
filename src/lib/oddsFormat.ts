/**
 * Odds formatting helpers.
 *
 * Internally the engine prices outcomes as a probability between 0 and 1
 * (a $1 payout contract). Sportsbooks show that same number as American,
 * decimal or fractional odds — these helpers convert between them.
 */

export type OddsFormat = "american" | "decimal" | "fractional";

/** Probability (0-1) -> American odds string, e.g. -150 / +220 */
export function toAmerican(prob: number): string {
  const p = clampProb(prob);
  if (p >= 0.5) {
    const v = Math.round((p / (1 - p)) * 100);
    return `-${v}`;
  }
  const v = Math.round(((1 - p) / p) * 100);
  return `+${v}`;
}

/** Probability (0-1) -> decimal odds, e.g. 1.91 */
export function toDecimal(prob: number): string {
  return (1 / clampProb(prob)).toFixed(2);
}

/** Probability (0-1) -> fractional odds, e.g. 10/11 */
export function toFractional(prob: number): string {
  const p = clampProb(prob);
  const dec = 1 / p - 1;
  // approximate with a small denominator
  let best = { n: 1, d: 1, err: Infinity };
  for (let d = 1; d <= 20; d++) {
    const n = Math.round(dec * d);
    if (n < 1) continue;
    const err = Math.abs(n / d - dec);
    if (err < best.err) best = { n, d, err };
  }
  return `${best.n}/${best.d}`;
}

export function formatOdds(prob: number, format: OddsFormat = "american"): string {
  if (format === "decimal") return toDecimal(prob);
  if (format === "fractional") return toFractional(prob);
  return toAmerican(prob);
}

/** Implied win probability as a percentage string. */
export function impliedPct(prob: number, digits = 0): string {
  return `${(clampProb(prob) * 100).toFixed(digits)}%`;
}

/** Profit on a winning bet of `stake` at these odds (excludes the stake back). */
export function profitFromStake(prob: number, stake: number): number {
  const p = clampProb(prob);
  return stake * (1 / p - 1);
}

/** Total returned on a win (stake + profit). */
export function payoutFromStake(prob: number, stake: number): number {
  return stake / clampProb(prob);
}

function clampProb(p: number): number {
  if (!isFinite(p) || p <= 0) return 0.0001;
  if (p >= 1) return 0.9999;
  return p;
}
