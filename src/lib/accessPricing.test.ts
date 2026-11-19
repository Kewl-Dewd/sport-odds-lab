import { describe, expect, it } from "vitest";
import { STUDENT_ACCESS_PRICE_USD } from "./accessPricing";

describe("student access pricing", () => {
  it("charges $35 USD for one year of student access", () => {
    expect(STUDENT_ACCESS_PRICE_USD).toBe(35);
  });
});
