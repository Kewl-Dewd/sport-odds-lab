// Pure helpers for the Tools page calculators.

export function americanToDecimal(a: number): number {
  if (!isFinite(a) || (a > -100 && a < 100)) return NaN;
  return a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a);
}

export function decimalToAmerican(d: number): number {
  if (!(d > 1)) return NaN;
  return d >= 2 ? (d - 1) * 100 : -100 / (d - 1);
}

export function fractionalToDecimal(num: number, den: number): number {
  if (!(num > 0) || !(den > 0)) return NaN;
  return 1 + num / den;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function decimalToFractional(d: number): string {
  if (!(d > 1)) return "—";
  const den = 100;
  const num = Math.round((d - 1) * den);
  const g = gcd(num, den) || 1;
  return `${num / g}/${den / g}`;
}

/** Two-way market: returns fair (no-vig) probabilities and the overround. */
export function noVigTwoWay(decA: number, decB: number) {
  const ia = 1 / decA;
  const ib = 1 / decB;
  const total = ia + ib;
  return { impliedA: ia, impliedB: ib, fairA: ia / total, fairB: ib / total, overround: total - 1 };
}

/**
 * Parlay: each leg has posted decimal odds and an overround (vig) for its market.
 * House edge of a single leg = 1 - 1/(1+overround). The parlay's fair probability is
 * the product of each leg's fair probability, so its edge compounds.
 */
export function parlayEdge(legs: { decimal: number; overround: number }[]) {
  const legEdges = legs.map((l) => 1 - 1 / (1 + l.overround));
  const parlayDecimal = legs.reduce((p, l) => p * l.decimal, 1);
  const fairProb = legs.reduce((p, l) => p * (1 / l.decimal / (1 + l.overround)), 1);
  const parlayEdge = 1 - fairProb * parlayDecimal;
  return { legEdges, parlayDecimal, fairProb, parlayEdge };
}
