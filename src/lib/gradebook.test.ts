import { describe, it, expect } from "vitest";
import { finalGrade, forecastScore, clvScore, DEFAULT_WEIGHTS, gradebookCsv } from "./gradebook";
import { buildSchedule, COURSE_PLANS } from "@/data/coursePlans";
import { findCurriculumModule, GATE_LESSON_KEYS } from "@/data/curriculum";

const base = { name: "A", email: "a@x.ca", lessonsDone: 10, lessonsTotal: 10, journalPct: 100, brier: 0, avgClvPct: 5, forecasts: 3 };

describe("gradebook", () => {
  it("coin-flip Brier scores 50", () => expect(forecastScore(0.25)).toBe(50));
  it("zero CLV scores 50", () => expect(clvScore(0)).toBe(50));
  it("perfect student gets 100", () => expect(finalGrade(base, DEFAULT_WEIGHTS)).toBe(100));
  it("missing work counts as zero", () =>
    expect(finalGrade({ ...base, journalPct: null, brier: null, avgClvPct: null }, DEFAULT_WEIGHTS)).toBe(40));
  it("csv quotes commas", () => expect(gradebookCsv([{ ...base, name: "Doe, J" }], DEFAULT_WEIGHTS)).toContain('"Doe, J"'));
});

describe("course plans", () => {
  it("every plan key exists in the curriculum", () => {
    for (const p of COURSE_PLANS) for (const w of p.weeks) for (const k of w.modules) expect(findCurriculumModule(k), k).toBeTruthy();
  });
  it("gate lessons come first in every length", () => {
    for (const p of COURSE_PLANS) for (const len of ["weekend", "six-weeks", "semester"] as const) {
      const s = buildSchedule(p, len, new Date("2026-09-01"));
      expect(s.slice(0, 2).map((x) => x.module.key)).toEqual(GATE_LESSON_KEYS);
    }
  });
});
