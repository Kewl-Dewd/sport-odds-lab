// Pure math for forecast-based analysis: implied / no-vig probabilities,
// expected value, Brier score, closing line value and calibration buckets.

/** Implied probability from decimal odds (vig included). */
export function impliedFromDecimal(decimal: number): number {
  return decimal > 1 ? 1 / decimal : 0;
}

/**
 * No-vig ("fair") probability for one side, given implied probabilities for
 * every side of the market (two-way or three-way). Removes the overround
 * proportionally.
 */
export function noVigProb(sideImplied: number, allImplied: number[]): number {
  const sum = allImplied.reduce((t, p) => t + p, 0);
  return sum > 0 ? sideImplied / sum : 0;
}

/** Expected profit in dollars of a stake at decimal odds, if the true win chance is `forecast`. */
export function expectedValue(stake: number, decimal: number, forecast: number): number {
  return stake * (forecast * decimal - 1);
}

/** Mean squared error of forecasts against outcomes (1 = won, 0 = lost). Lower is better. */
export function brierScore(rows: { forecast: number; won: boolean }[]): number | null {
  if (rows.length === 0) return null;
  return rows.reduce((t, r) => t + (r.forecast - (r.won ? 1 : 0)) ** 2, 0) / rows.length;
}

/** Closing line value %: locked decimal price vs. the closing fair probability. */
export function clvPct(lockedDecimal: number, closingFairProb: number): number {
  return (lockedDecimal * closingFairProb - 1) * 100;
}

/** Bucket index 0..9 for a 0..1 forecast (100% falls in the top bucket). */
export function bucketIndex(forecast: number): number {
  return Math.min(9, Math.max(0, Math.floor(forecast * 10)));
}

export interface CalibrationBucket {
  label: string;
  midpoint: number;
  count: number;
  wins: number;
  winRate: number | null;
  avgForecast: number | null;
}

export function calibrationBuckets(rows: { forecast: number; won: boolean }[]): CalibrationBucket[] {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}–${i * 10 + 10}%`,
    midpoint: i * 10 + 5,
    count: 0,
    wins: 0,
    sum: 0,
  }));
  for (const r of rows) {
    const b = buckets[bucketIndex(r.forecast)];
    b.count += 1;
    b.sum += r.forecast;
    if (r.won) b.wins += 1;
  }
  return buckets.map(({ sum, ...b }) => ({
    ...b,
    winRate: b.count ? (b.wins / b.count) * 100 : null,
    avgForecast: b.count ? (sum / b.count) * 100 : null,
  }));
}
