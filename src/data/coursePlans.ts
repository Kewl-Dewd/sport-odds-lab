// Ready-made course plans used by Quick setup. Each plan lists curriculum
// module keys by week; the responsible-play gate lessons always come first.
import { CURRICULUM, GATE_LESSON_KEYS, type CurriculumModule } from "@/data/curriculum";

export type CourseLength = "weekend" | "six-weeks" | "semester";

export interface CoursePlan {
  key: string;
  title: string;
  audience: string;
  summary: string;
  weeks: { title: string; modules: string[] }[];
}

const RG = [...GATE_LESSON_KEYS, "rg-reflection"];

export const COURSE_PLANS: CoursePlan[] = [
  {
    key: "sport-business",
    title: "Sport Business",
    audience: "Sport management and business courses",
    summary: "How the sports betting industry is regulated, who earns what, and how a sportsbook makes money.",
    weeks: [
      { title: "Risks and the app", modules: [...RG, "intro-welcome", "intro-tour", "app-markets", "app-slip"] },
      { title: "The Canadian industry", modules: ["single-event-wagering-in-canada-after-bill-c-218", "who-regulates-aglc-igaming-ontario-and-provincia", "operator-models-provincial-monopoly-private-lice"] },
      { title: "Money flows", modules: ["leagues-teams-broadcasters-and-sportsbooks-follo", "assignment-map-a-sport-organization-s-wagering-p"] },
      { title: "How the book earns", modules: ["odds-formats", "implied-vig", "how-the-book-earns", "expected-value-hold-percentage-and-theoretical-r"] },
      { title: "Products and the house edge", modules: ["bet-types", "props-and-parlays-where-the-house-edge-grows", "intro-first-bet", "app-journal"] },
      { title: "Advertising, law and support", modules: ["advertising-standards-in-canada-and-how-ads-shap", "ab-legal-basics", "ab-igaming-act", "ab-integrity-ads", "support-and-referral-pathways-in-alberta"] },
    ],
  },
  {
    key: "analytics",
    title: "Sport Analytics",
    audience: "Analytics, statistics and data courses",
    summary: "Forecasting games, building a simple model, and testing it against the market.",
    weeks: [
      { title: "Risks and the app", modules: [...RG, "intro-welcome", "intro-tour", "app-slip"] },
      { title: "Odds as probabilities", modules: ["odds-formats", "implied-vig", "expected-value-hold-percentage-and-theoretical-r"] },
      { title: "Variance", modules: ["bankroll-units", "variance", "expected-value", "intro-first-bet"] },
      { title: "Data and models", modules: ["sourcing-and-preparing-sport-data", "building-a-simple-rating-model"] },
      { title: "Model vs market", modules: ["comparing-your-model-to-the-market", "line-movement", "why-models-fail-sample-size-overfitting-and-vari"] },
      { title: "Report", modules: ["cognitive-biases-in-wagering-decisions", "assignment-model-vs-market-report"] },
    ],
  },
  {
    key: "responsible-gambling",
    title: "Responsible Gambling",
    audience: "Health, wellness and first-year seminars",
    summary: "Why the house wins, how ads and biases shape behaviour, and where to get help.",
    weeks: [
      { title: "Risks", modules: [...RG, "intro-welcome", "intro-tour"] },
      { title: "Why the house wins", modules: ["implied-vig", "how-the-book-earns", "props-and-parlays-where-the-house-edge-grows"] },
      { title: "Thinking traps", modules: ["bias", "cognitive-biases-in-wagering-decisions", "variance"] },
      { title: "Students and risk", modules: ["risk-indicators-among-post-secondary-students", "responsible-gambling-tools-what-operators-and-re"] },
      { title: "Ads and law", modules: ["advertising-standards-in-canada-and-how-ads-shap", "ab-legal-basics", "ab-integrity-ads"] },
      { title: "Support", modules: ["support-and-referral-pathways-in-alberta"] },
    ],
  },
];

export const COURSE_LENGTHS: { key: CourseLength; label: string; days: number; detail: string }[] = [
  { key: "weekend", label: "One weekend", days: 3, detail: "Core lessons only, one 3-day contest" },
  { key: "six-weeks", label: "6 weeks", days: 42, detail: "One week of lessons per week" },
  { key: "semester", label: "Full semester", days: 105, detail: "Lessons spread over 15 weeks" },
];

export interface PlannedLesson {
  module: CurriculumModule;
  topicKey: string;
  dueAt: Date;
}

const TOPIC_OF = new Map<string, { module: CurriculumModule; topicKey: string }>();
for (const t of CURRICULUM) for (const m of t.modules) TOPIC_OF.set(m.key, { module: m, topicKey: t.key });

/** Expand a plan into dated lessons. Weekend keeps the first week plus one money/edge week. */
export function buildSchedule(plan: CoursePlan, length: CourseLength, start: Date): PlannedLesson[] {
  const weeks = length === "weekend" ? [plan.weeks[0], plan.weeks[Math.min(3, plan.weeks.length - 1)]] : plan.weeks;
  const totalDays = COURSE_LENGTHS.find((l) => l.key === length)!.days;
  const span = totalDays / weeks.length;
  const out: PlannedLesson[] = [];
  const seen = new Set<string>();
  weeks.forEach((w, i) => {
    const due = new Date(start.getTime() + Math.round(span * (i + 1)) * 864e5);
    for (const key of w.modules) {
      const hit = TOPIC_OF.get(key);
      if (!hit || seen.has(key)) continue;
      seen.add(key);
      out.push({ ...hit, dueAt: due });
    }
  });
  return out;
}
