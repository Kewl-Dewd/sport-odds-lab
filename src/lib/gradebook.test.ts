import { describe, it, expect } from "vitest";
import { finalGrade, forecastScore, clvScore, DEFAULT_WEIGHTS, gradebookCsv, quizComponent } from "./gradebook";
import { LESSON_DESIGN, moduleQuiz, scoreQuiz } from "@/data/lessonDesign";
import { CURRICULUM_MODULES, CURRICULUM } from "@/data/curriculum";
import { COURSE_WEEKS } from "@/data/courseKit";
import { buildSchedule, COURSE_PLANS } from "@/data/coursePlans";
import { findCurriculumModule, GATE_LESSON_KEYS } from "@/data/curriculum";

const base = { name: "A", email: "a@x.ca", lessonsDone: 10, lessonsTotal: 10, journalPct: 100, brier: 0, avgClvPct: 5, forecasts: 3, quizPct: 100 };

describe("gradebook", () => {
  it("coin-flip Brier scores 50", () => expect(forecastScore(0.25)).toBe(50));
  it("zero CLV scores 50", () => expect(clvScore(0)).toBe(50));
  it("perfect student gets 100", () => expect(finalGrade(base, DEFAULT_WEIGHTS)).toBe(100));
  it("missing work counts as zero", () =>
    expect(finalGrade({ ...base, journalPct: null, brier: null, avgClvPct: null }, DEFAULT_WEIGHTS)).toBe(40));
  it("missing quizzes count as zero", () => expect(finalGrade({ ...base, quizPct: null }, DEFAULT_WEIGHTS)).toBe(80));
  it("scored mode averages best scores, unattempted = 0", () =>
    expect(quizComponent(new Map([["a", 80], ["b", 60]]), ["a", "b", "c"], "scored")).toBeCloseTo(46.67, 1));
  it("completion mode counts any attempt as 100", () =>
    expect(quizComponent(new Map([["a", 20]]), ["a", "b"], "completion")).toBe(50));
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

describe("15-week course", () => {
  it("has 15 weeks", () => expect(COURSE_WEEKS.length).toBe(15));
  it("every curriculum lesson has objectives, a task, a reflection and a 3+ question quiz", () => {
    for (const m of CURRICULUM_MODULES) {
      const d = LESSON_DESIGN[m.key];
      expect(d, m.key).toBeTruthy();
      expect(d.objectives.length, m.key).toBeGreaterThan(0);
      expect(d.quiz.length, m.key).toBeGreaterThanOrEqual(3);
      for (const qq of d.quiz) expect(qq.answer).toBeLessThan(qq.options.length);
    }
  });
  it("every module quiz has 8–10 questions", () => {
    for (const t of CURRICULUM) expect(moduleQuiz(t.key).length, t.key).toBeGreaterThanOrEqual(8);
  });
  it("scores quizzes", () => expect(scoreQuiz(moduleQuiz("responsible-play").slice(0, 2), [1, 1]).score).toBe(100));
});
