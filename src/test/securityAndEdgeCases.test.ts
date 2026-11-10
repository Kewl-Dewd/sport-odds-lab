import { describe, it, expect } from "vitest";
import { money, signedMoney, pct, signedPct } from "@/lib/money";
import { americanToDecimal, decimalToAmerican, noVigTwoWay, parlayEdge } from "@/lib/oddsTools";

describe("Commercial Resilience & Edge Case Tests", () => {
  describe("Currency & Numeric Formatting Sanitization", () => {
    it("safely handles NaN and non-finite values without corrupting output", () => {
      expect(money(NaN)).toBe("$0.00");
      expect(money(Infinity)).toBe("$0.00");
      expect(money(-Infinity)).toBe("$0.00");
      expect(money(null)).toBe("$0.00");
      expect(money(undefined)).toBe("$0.00");
    });

    it("safely formats signed currency with edge case inputs", () => {
      expect(signedMoney(NaN)).toBe("$0.00");
      expect(signedMoney(0)).toBe("+$0.00");
      expect(signedMoney(150.5)).toBe("+$150.50");
      expect(signedMoney(-50.25)).toBe("-$50.25");
    });

    it("safely formats percentages with boundary values", () => {
      expect(pct(NaN)).toBe("0.0%");
      expect(pct(null)).toBe("0.0%");
      expect(pct(50.5, 2)).toBe("50.50%");
      expect(signedPct(NaN)).toBe("+0.0%");
      expect(signedPct(-12.4, 1)).toBe("-12.4%");
      expect(signedPct(12.4, 1)).toBe("+12.4%");
    });
  });

  describe("Odds Mathematical Boundaries", () => {
    it("rejects invalid American odds within forbidden (-100, 100) range", () => {
      expect(Number.isNaN(americanToDecimal(0))).toBe(true);
      expect(Number.isNaN(americanToDecimal(50))).toBe(true);
      expect(Number.isNaN(americanToDecimal(-99))).toBe(true);
      expect(Number.isNaN(americanToDecimal(NaN))).toBe(true);
    });

    it("rejects decimal odds less than or equal to 1.0 (sub-parity impossible odds)", () => {
      expect(Number.isNaN(decimalToAmerican(1.0))).toBe(true);
      expect(Number.isNaN(decimalToAmerican(0.5))).toBe(true);
      expect(Number.isNaN(decimalToAmerican(-2))).toBe(true);
    });

    it("calculates two-way vig bounds cleanly", () => {
      const res = noVigTwoWay(2.0, 2.0); // even money both sides, 0 vig
      expect(res.fairA).toBe(0.5);
      expect(res.fairB).toBe(0.5);
      expect(res.overround).toBeCloseTo(0.0, 4);
    });

    it("prevents parlay edge calculation from producing negative probabilities", () => {
      const legs = [
        { decimal: 2.0, overround: 0.05 },
        { decimal: 1.9, overround: 0.0476 },
      ];
      const r = parlayEdge(legs);
      expect(r.fairProb).toBeGreaterThan(0);
      expect(r.fairProb).toBeLessThan(1);
      expect(r.parlayEdge).toBeGreaterThan(0);
    });
  });
});
