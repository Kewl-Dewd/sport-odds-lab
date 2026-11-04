// Gradebook scoring: turns per-student class metrics into 0–100 component
// scores and a weighted final grade, plus a CSV export for LMS import.

export interface GradebookInput {
  name: string;
  email: string;
  lessonsDone: number;
  lessonsTotal: number;
  journalPct: number | null; // 0–100
  brier: number | null; // 0 (perfect) – 1 (worst)
  avgClvPct: number | null; // e.g. 2.5 means +2.5%
  forecasts: number;
  /** Average quiz score 0–100 (or completion % in completion-only mode). */
  quizPct?: number | null;
}

export interface GradeWeights {
  quizzes: number;
  lessons: number;
  journal: number;
  forecast: number;
  clv: number;
}

export const DEFAULT_WEIGHTS: GradeWeights = { quizzes: 20, lessons: 20, journal: 25, forecast: 25, clv: 10 };

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Brier 0 → 100, coin-flip 0.25 → 50, 0.5 or worse → 0. */
export function forecastScore(brier: number | null): number | null {
  if (brier == null) return null;
  return clamp(100 - brier * 200);
}

/** CLV 0% → 50, +5% or better → 100, −5% or worse → 0. */
export function clvScore(clv: number | null): number | null {
  if (clv == null) return null;
  return clamp(50 + clv * 10);
}

export function componentScores(r: GradebookInput) {
  return {
    quizzes: r.quizPct == null ? null : clamp(r.quizPct),
    lessons: r.lessonsTotal > 0 ? clamp((r.lessonsDone / r.lessonsTotal) * 100) : null,
    journal: r.journalPct == null ? null : clamp(r.journalPct),
    forecast: forecastScore(r.brier),
    clv: clvScore(r.avgClvPct),
  };
}

/** Weighted grade. Missing components count as 0 so skipped work lowers the grade. */
export function finalGrade(r: GradebookInput, w: GradeWeights): number {
  const s = componentScores(r);
  const total = w.quizzes + w.lessons + w.journal + w.forecast + w.clv;
  if (total <= 0) return 0;
  const sum =
    (s.quizzes ?? 0) * w.quizzes +
    (s.lessons ?? 0) * w.lessons +
    (s.journal ?? 0) * w.journal +
    (s.forecast ?? 0) * w.forecast +
    (s.clv ?? 0) * w.clv;
  return Math.round((sum / total) * 10) / 10;
}

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const fmt = (n: number | null) => (n == null ? "" : String(Math.round(n * 10) / 10));

export function gradebookCsv(rows: GradebookInput[], w: GradeWeights): string {
  const header = [
    "Name", "Email", "Quiz score", "Lessons completed", "Lessons assigned", "Lessons score",
    "Journal score", "Forecasts", "Brier", "Forecast score", "Avg CLV %", "CLV score",
    `Final grade (Q${w.quizzes}/L${w.lessons}/J${w.journal}/F${w.forecast}/C${w.clv})`,
  ];
  const lines = rows.map((r) => {
    const s = componentScores(r);
    return [
      r.name, r.email, fmt(s.quizzes), r.lessonsDone, r.lessonsTotal, fmt(s.lessons), fmt(s.journal),
      r.forecasts, r.brier == null ? "" : r.brier.toFixed(3), fmt(s.forecast),
      fmt(r.avgClvPct), fmt(s.clv), finalGrade(r, w),
    ].map(esc).join(",");
  });
  return [header.map(esc).join(","), ...lines].join("\n");
}

/** Quiz component from best attempt per quiz. Completion mode: any attempt counts 100. */
export function quizComponent(
  bestByQuiz: Map<string, number>, assignedQuizKeys: string[], mode: "scored" | "completion",
): number | null {
  if (!assignedQuizKeys.length) return null;
  const sum = assignedQuizKeys.reduce((n, k) => {
    const best = bestByQuiz.get(k);
    return n + (best == null ? 0 : mode === "completion" ? 100 : best);
  }, 0);
  return sum / assignedQuizKeys.length;
}
