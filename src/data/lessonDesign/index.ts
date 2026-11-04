import { CURRICULUM } from "@/data/curriculum";
import { M1_M2 } from "./m1m2";
import { M3 } from "./m3";
import { M4_M5 } from "./m4m5";
import { M6_M7 } from "./m6m7";
import type { LessonDesign, QuizQuestion } from "./types";

export type { LessonDesign, QuizQuestion } from "./types";

export const LESSON_DESIGN: Record<string, LessonDesign> = { ...M1_M2, ...M3, ...M4_M5, ...M6_M7 };

export function lessonDesign(key: string | null | undefined): LessonDesign | undefined {
  return key ? LESSON_DESIGN[key] : undefined;
}

/** Quiz key used for a whole-module quiz attempt. */
export const moduleQuizKey = (topicKey: string) => `module:${topicKey}`;

/** Module quiz: up to 10 questions, two from each lesson in turn, then the rest. */
export function moduleQuiz(topicKey: string): QuizQuestion[] {
  const topic = CURRICULUM.find((t) => t.key === topicKey);
  if (!topic) return [];
  const pools = topic.modules.map((m) => LESSON_DESIGN[m.key]?.quiz ?? []).filter((p) => p.length);
  const out: QuizQuestion[] = [];
  for (let i = 0; out.length < 10 && i < 5; i++) {
    for (const p of pools) if (p[i] && out.length < 10) out.push(p[i]);
  }
  return out;
}

/** Score a set of answers 0–100. */
export function scoreQuiz(questions: QuizQuestion[], answers: (number | null)[]) {
  const correct = questions.reduce((n, qq, i) => n + (answers[i] === qq.answer ? 1 : 0), 0);
  return { correct, total: questions.length, score: questions.length ? Math.round((correct / questions.length) * 100) : 0 };
}
