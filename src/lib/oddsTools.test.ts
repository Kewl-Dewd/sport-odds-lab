import { describe, it, expect } from "vitest";
import { americanToDecimal, decimalToAmerican, noVigTwoWay, parlayEdge, decimalToFractional } from "./oddsTools";

describe("oddsTools", () => {
  it("converts American to decimal", () => {
    expect(americanToDecimal(150)).toBeCloseTo(2.5);
    expect(americanToDecimal(-110)).toBeCloseTo(1.9091, 3);
  });
  it("converts decimal to American and fractional", () => {
    expect(decimalToAmerican(2.5)).toBeCloseTo(150);
    expect(decimalToAmerican(1.5)).toBeCloseTo(-200);
    expect(decimalToFractional(2.5)).toBe("3/2");
  });
  it("removes vig from -110/-110", () => {
    const r = noVigTwoWay(americanToDecimal(-110), americanToDecimal(-110));
    expect(r.fairA).toBeCloseTo(0.5);
    expect(r.overround).toBeCloseTo(0.0476, 3);
  });
  it("parlay edge compounds across legs", () => {
    const leg = { decimal: americanToDecimal(-110), overround: 0.0476 };
    const r = parlayEdge([leg, leg, leg]);
    expect(r.legEdges[0]).toBeCloseTo(0.0455, 3);
    expect(r.parlayEdge).toBeCloseTo(1 - (1 / 1.0476) ** 3, 4);
    expect(r.parlayEdge).toBeGreaterThan(r.legEdges[0] * 2.5);
  });
});
