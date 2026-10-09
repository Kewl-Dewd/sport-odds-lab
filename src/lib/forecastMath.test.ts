import { describe, expect, it } from "vitest";
import { brierScore, bucketIndex, calibrationBuckets, clvPct, expectedValue, impliedFromDecimal, noVigProb } from "./forecastMath";

describe("forecastMath", () => {
  it("implied probability from decimal odds", () => {
    expect(impliedFromDecimal(2)).toBeCloseTo(0.5);
  });
  it("no-vig removes overround across both sides (-110/-110 -> 50%)", () => {
    const p = 1 / 1.909;
    expect(noVigProb(p, [p, p])).toBeCloseTo(0.5);
  });
  it("no-vig includes the draw on three-way markets", () => {
    expect(noVigProb(0.5, [0.5, 0.3, 0.3])).toBeCloseTo(0.5 / 1.1);
  });
  it("expected value at forecast", () => {
    expect(expectedValue(10, 2.5, 0.5)).toBeCloseTo(2.5);
    expect(expectedValue(10, 2, 0.4)).toBeCloseTo(-2);
  });
  it("Brier score, lower is better", () => {
    expect(brierScore([{ forecast: 1, won: true }, { forecast: 0, won: false }])).toBe(0);
    expect(brierScore([{ forecast: 0.7, won: false }])).toBeCloseTo(0.49);
    expect(brierScore([])).toBeNull();
  });
  it("CLV positive when locked price beats closing fair price", () => {
    expect(clvPct(2.2, 0.5)).toBeCloseTo(10);
    expect(clvPct(1.8, 0.5)).toBeCloseTo(-10);
  });
  it("buckets forecasts into 10% bands", () => {
    expect(bucketIndex(0.05)).toBe(0);
    expect(bucketIndex(0.1)).toBe(1);
    expect(bucketIndex(1)).toBe(9);
    const b = calibrationBuckets([{ forecast: 0.65, won: true }, { forecast: 0.62, won: false }]);
    expect(b[6].count).toBe(2);
    expect(b[6].winRate).toBe(50);
  });
});
