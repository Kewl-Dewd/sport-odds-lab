import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import {
  type Market,
  type MarketConfig,
  type MarketMetadata,
  type MarketCategory,
  type MarketStatus,
  type DifficultyLevel,
  type Trade,
  type UserPortfolio,
  type Holding,
  type Outcome,
  executeTrade,
  estimateTrade,
  validateTrade,
  calculatePortfolioValue,
  calculateRealizedPnL,
  settleMarketForPortfolios,
  voidMarketForPortfolios,
  cancelMarketForPortfolios,
  defaultMarketConfig,
  evenPriceDistribution,
  DEFAULT_STARTING_CASH,
  DEFAULT_LIQUIDITY,
  DEFAULT_MAX_TRADE_SIZE,
  PRICE_FLOOR,
  PRICE_CEILING,
  TERMINAL_STATUSES,
  type TradeEstimate,
  type TradeValidation,
} from "@/lib/tradingEngine";
import type { PricingEngineType } from "@/lib/pricing";
import { toast } from "sonner";
import { generateSampleStudents, generateSampleTrades } from "@/lib/demoData";
import type {
  SportsbookSurface,
  SportsbookWager,
  SportsbookLine,
  SportsbookGameResult,
} from "@/lib/sportsbookEngine";
import { validateWager, settleWager } from "@/lib/sportsbookEngine";
import type {
  RacetrackSurface,
  RaceWager,
  RaceRunner,
  RacePoolKind,
  PoolTotals,
} from "@/lib/racetrackEngine";
import {
  validateRaceWager,
  settleRaceWagers,
  calculatePoolTotals,
} from "@/lib/racetrackEngine";

// ── Classroom Types ────────────────────────────────────────────────

export interface Classroom {
  id: string;
  name: string;
  description: string;
  startingBalance: number;
  createdAt: string;
  isActive: boolean;
  classCode: string;
  allowSelfJoin: boolean;
  startDate: string | null;
  endDate: string | null;
  resetMode: "manual" | "unit" | "semester";
}

export interface AdminAction {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
}

export type LeaderboardMode = "portfolio" | "return" | "accuracy" | "activity" | "decision" | "risk" | "efficiency";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  portfolioValue: number;
  cash: number;
  returnPct: number;
  tradeCount: number;
  winCount: number;
  bestTradePnL: number;
  worstTradePnL: number;
  decisionScore: number;
  riskScore: number;
  efficiency: number; // return per trade
}

export interface SavedTemplate {
  id: string;
  name: string;
  category: MarketCategory;
  sport: string;
  league: string;
  description: string;
  outcomes: string[];
  liquidity: number;
  settlementRules?: string;
  instructionalNotes?: string;
  difficultyLevel: DifficultyLevel;
  isArchived: boolean;
  createdAt: string;
}

// ── Experiment Types ───────────────────────────────────────────────

export type ExperimentType =
  | "open-simulation"
  | "information-asymmetry"
  | "behavioral-bias"
  | "market-manipulation"
  | "shock-event"
  | "prediction-accuracy"
  | "risk-management"
  | "diversification-challenge";

export type ExperimentStatus = "draft" | "active" | "paused" | "ended" | "archived";

export type ExperimentScoringMode = "portfolio-return" | "prediction-accuracy" | "decision-quality" | "risk-adjusted" | "participation" | "custom";

export type ExperimentNameVisibility = "public" | "anonymized" | "alias";

export interface ExperimentRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const EXPERIMENT_RULE_PRESETS: Omit<ExperimentRule, "enabled">[] = [
  { id: "restrict-markets", label: "Restrict to experiment markets", description: "Students can only trade in markets linked to this experiment" },
  { id: "no-sell", label: "Buy only (no selling)", description: "Students cannot sell positions during the experiment" },
  { id: "max-position", label: "Max position per market", description: "Limit how many shares a student can hold in one outcome" },
  { id: "blind-prices", label: "Hide other traders' activity", description: "Students cannot see volume or trade count" },
  { id: "info-advantage", label: "Staggered information release", description: "Some students receive information earlier than others" },
  { id: "shock-inject", label: "Mid-experiment price shock", description: "Instructor can inject a sudden price change" },
  { id: "time-pressure", label: "Time-limited trading window", description: "Trading is only open during specific intervals" },
  { id: "concentration-limit", label: "Diversification requirement", description: "Must hold positions in at least N different markets" },
];

export interface Experiment {
  id: string;
  classroomId: string;
  title: string;
  type: ExperimentType;
  status: ExperimentStatus;
  objective: string;
  instructorNotes: string;
  studentInstructions: string;
  scoringMode: ExperimentScoringMode;
  leaderboardVisible: boolean;
  nameVisibility: ExperimentNameVisibility;
  linkedMarketIds: string[];
  rules: ExperimentRule[];
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

// ── Information Asymmetry Types ────────────────────────────────────

export type InfoPacketKind =
  | "text-note"
  | "team-update"
  | "injury-update"
  | "weather-update"
  | "probability-hint"
  | "strategic-clue";

export type InfoPacketTruthLevel = "true" | "partial" | "noisy";

export const INFO_PACKET_KIND_LABELS: Record<InfoPacketKind, string> = {
  "text-note": "Text note",
  "team-update": "Team / player update",
  "injury-update": "Injury update",
  "weather-update": "Weather update",
  "probability-hint": "Probability hint",
  "strategic-clue": "Strategic clue",
};

export const INFO_PACKET_TRUTH_LABELS: Record<InfoPacketTruthLevel, string> = {
  true: "Verified",
  partial: "Partially true",
  noisy: "Noisy / unreliable",
};

export type InfoAudienceMode =
  | "everyone"
  | "subgroup"
  | "single"
  | "random";

export interface InfoAudience {
  mode: InfoAudienceMode;
  /** Explicit user IDs for "subgroup" or "single" modes. */
  userIds?: string[];
  /** Number of recipients for "random" mode. */
  randomCount?: number;
}

export interface InfoPacketReceipt {
  userId: string;
  /** ISO timestamp the packet became visible to this user. */
  releasedAt: string;
  /** ISO timestamp the user opened the packet (null = unread). */
  openedAt: string | null;
  /** ISO timestamp the user explicitly acknowledged. */
  acknowledgedAt: string | null;
}

// ── Market Manipulation & Ethics Mode ─────────────────────────────

export type ScenarioKind =
  | "rumor-injection"
  | "pump-burst"
  | "fake-confidence"
  | "rumor-overreaction"
  | "coordinated-buy"
  | "rapid-reversal"
  | "herd-setup"
  | "bluff-unwind"
  | "whale-trade";

export const SCENARIO_LABELS: Record<ScenarioKind, string> = {
  "rumor-injection": "Rumor injection",
  "pump-burst": "Pump-style trading burst",
  "fake-confidence": "Fake confidence wave",
  "rumor-overreaction": "Rumor-driven overreaction",
  "coordinated-buy": "Coordinated buying",
  "rapid-reversal": "Rapid reversal",
  "herd-setup": "Herd-following setup",
  "bluff-unwind": "Bluff and unwind",
  "whale-trade": "Whale-style large trade",
};

export interface ScenarioEvent {
  id: string;
  classroomId: string;
  kind: ScenarioKind;
  marketId: string | null;
  /** Plain instructor description shown in replay markers / debrief. */
  note: string;
  /** Optional list of student userIds nudged in the scenario (e.g. coordination group). */
  participantIds?: string[];
  injectedAt: string;
  injectedBy: string;
}

export interface EthicsSettings {
  enabled: boolean;
  /** Whether students see a banner that manipulation may occur. */
  studentsAwareOfManipulation: boolean;
  /** Allow instructor to inject narrative rumors. */
  allowRumorInjection: boolean;
  /** Allow team-trading mode (small groups assigned a target). */
  allowCoordinatedTrading: boolean;
  /** Whether public class chat is enabled. (UI gate only — chat is out of scope.) */
  publicChatEnabled: boolean;
  /** Allow instructor to instruct a small group to push a price direction. */
  allowDirectionalGroup: boolean;
  /** Allow whale-style instructor trades. */
  allowWhaleTrades: boolean;
  /** Surface integrity flags during replay / debrief. */
  detectionFlagsVisible: boolean;
  /** Show post-experiment debrief to students. */
  studentDebriefEnabled: boolean;
}

export const DEFAULT_ETHICS_SETTINGS: EthicsSettings = {
  enabled: false,
  studentsAwareOfManipulation: false,
  allowRumorInjection: true,
  allowCoordinatedTrading: false,
  publicChatEnabled: true,
  allowDirectionalGroup: false,
  allowWhaleTrades: true,
  detectionFlagsVisible: true,
  studentDebriefEnabled: true,
};

// ── Behavioral Finance Experiments ────────────────────────────────

import type { BiasKind } from "@/lib/behavioralAnalytics";
export type { BiasKind } from "@/lib/behavioralAnalytics";

export type SummaryStyle = "expert" | "noisy" | "none";

export const SUMMARY_STYLE_LABELS: Record<SummaryStyle, string> = {
  expert: "Expert-style summary",
  noisy: "Noisy / unreliable summary",
  none: "No summary",
};

export interface BiasFraming {
  /** Custom prompt or framing cue shown above the market. */
  prompt?: string;
  /** Headline-style framing (e.g. "Lakers on a 5-game win streak"). */
  headline?: string;
  /** Pre-seeded "anchor" price displayed prominently. */
  anchorPrice?: number;
  /** Anchor label (e.g. "Opening line: 65¢"). */
  anchorLabel?: string;
  /** Emphasize price/volume history visually. */
  emphasizeHistory?: boolean;
  /** Show recent streak indicator. */
  showStreak?: boolean;
  /** Selective news blurb (creates confirmation-bias conditions). */
  newsBlurb?: string;
  /** Style of summary shown to students. */
  summaryStyle?: SummaryStyle;
  /** Optional content of the summary (filled per style). */
  summaryText?: string;
}

// ── Shock Events ──────────────────────────────────────────────────

export type ShockKind =
  | "breaking-news"
  | "player-injury"
  | "lineup-change"
  | "weather"
  | "coach-change"
  | "suspension"
  | "schedule-change"
  | "confidence-shock"
  | "rumor"
  | "false-alarm"
  | "correction";

export const SHOCK_LABELS: Record<ShockKind, string> = {
  "breaking-news": "Breaking news",
  "player-injury": "Player injury",
  "lineup-change": "Lineup change",
  "weather": "Weather event",
  "coach-change": "Coach change",
  "suspension": "Suspension",
  "schedule-change": "Schedule change",
  "confidence-shock": "Confidence shock",
  "rumor": "Rumor",
  "false-alarm": "False alarm",
  "correction": "Correction",
};

export type ShockTruth = "true" | "false" | "unresolved";
export type ShockConfidence = "low" | "medium" | "high";
export type ShockUrgency = "breaking" | "routine";
export type ShockVisibility = "everyone" | "subgroup";
export type ShockStatus = "scheduled" | "released" | "cancelled" | "corrected";

export interface ShockEvent {
  id: string;
  classroomId: string;
  kind: ShockKind;
  title: string;
  description: string;
  /** Markets impacted by this shock. Empty array = unspecified / all. */
  marketIds: string[];
  confidence: ShockConfidence;
  urgency: ShockUrgency;
  visibility: ShockVisibility;
  /** When visibility=subgroup, the userIds who can see it. */
  audienceUserIds: string[];
  truthStatus: ShockTruth;
  status: ShockStatus;
  /** ISO datetime when scheduled to release. */
  scheduledFor: string | null;
  /** ISO datetime when actually released to students. */
  releasedAt: string | null;
  /** If this shock corrects another shock, the original's id. */
  correctsShockId: string | null;
  createdAt: string;
}

// ── Reflection & Debrief ──────────────────────────────────────────

export type ReflectionPromptKind =
  | "open-text"
  | "rating-confidence"
  | "rating-process"
  | "strategy-vs-emotion"
  | "what-different";

export const REFLECTION_PROMPT_LABELS: Record<ReflectionPromptKind, string> = {
  "open-text": "Open response",
  "rating-confidence": "Confidence self-rating (1–5)",
  "rating-process": "Decision-process self-rating (1–5)",
  "strategy-vs-emotion": "Strategy vs. emotion",
  "what-different": "What would you do differently?",
};

export type ReflectionVisibility = "instructor-only" | "anonymous-shared";

export interface ReflectionPrompt {
  id: string;
  kind: ReflectionPromptKind;
  /** Question shown to students. */
  question: string;
  /** Whether this individual prompt requires an answer. */
  required: boolean;
  /** Display order. */
  order: number;
}

export interface ReflectionAssignment {
  id: string;
  classroomId: string;
  /** Optional link to an experiment; null = general session debrief. */
  experimentId: string | null;
  title: string;
  description: string;
  prompts: ReflectionPrompt[];
  /** If true, students must submit before viewing full debrief. */
  required: boolean;
  /** If true, instructor will grade submissions (adds grade fields). */
  graded: boolean;
  /** instructor-only or anonymous-shared in discussion mode. */
  visibility: ReflectionVisibility;
  status: "draft" | "open" | "closed";
  createdAt: string;
}

export type ReflectionAnswerValue = string | number;

export interface ReflectionAnswer {
  promptId: string;
  value: ReflectionAnswerValue;
}

export interface ReflectionResponse {
  id: string;
  assignmentId: string;
  userId: string;
  answers: ReflectionAnswer[];
  /** Optional grade assigned by instructor (0-100). */
  grade: number | null;
  /** Optional instructor feedback note. */
  feedback: string | null;
  submittedAt: string;
}

export interface BiasExperiment {
  id: string;
  classroomId: string;
  title: string;
  bias: BiasKind;
  /** Plain-language objective shown to instructors only. */
  objective: string;
  /** Markets attached to this experiment. */
  marketIds: string[];
  /** Per-market framing overrides. Keyed by marketId. */
  framing: Record<string, BiasFraming>;
  /** Whether students see a generic "experiment in progress" notice. */
  studentNoticeEnabled: boolean;
  active: boolean;
  /** Optional grouping of students for A/B style comparison. */
  groups?: Record<string, string[]>;
  createdAt: string;
}

export interface InfoPacket {
  id: string;
  classroomId: string;
  experimentId: string | null;
  marketId: string | null;
  title: string;
  body: string;
  kind: InfoPacketKind;
  truthLevel: InfoPacketTruthLevel;
  /** If true, students are told that information is unevenly distributed. */
  disclosureToClass: boolean;
  /** Whether this packet shows up in instructor debrief reports. */
  includeInDebrief: boolean;
  /** Pre-resolved audience snapshot (recorded at release time). */
  audience: InfoAudience;
  receipts: InfoPacketReceipt[];
  createdAt: string;
  /** ISO timestamp when the packet should auto-release. Null = released immediately. */
  scheduledFor: string | null;
  /** ISO timestamp when the packet actually became visible to recipients. */
  releasedAt: string | null;
  createdBy: string;
}

// ── Discussion Mode ───────────────────────────────────────────────

export type DiscussionDimension =
  | "early-vs-late"
  | "diversified-vs-concentrated"
  | "info-holders"
  | "fast-vs-slow-reactors"
  | "high-return-vs-low-risk";

export interface DiscussionCard {
  id: string;
  classroomId: string;
  /** Optional link to a comparison dimension this card discusses. */
  dimension: DiscussionDimension | null;
  /** Optional link to a market this card highlights. */
  marketId: string | null;
  whatHappened: string;
  whatTradersDid: string;
  howPricesResponded: string;
  alternativeStrategy: string;
  keyTakeaway: string;
  /** Pinned cards are featured at the top during discussion. */
  pinned: boolean;
  /** Saved cards persist as part of the course library. */
  saved: boolean;
  createdAt: string;
}

export interface DiscussionSettings {
  /** Default to anonymized comparison; instructor can toggle on demand. */
  revealNames: boolean;
  /** When true, names are revealed only for pinned discussion items. */
  revealOnPinnedOnly: boolean;
}

export const DEFAULT_DISCUSSION_SETTINGS: DiscussionSettings = {
  revealNames: false,
  revealOnPinnedOnly: false,
};

// ── Classroom Scoring ─────────────────────────────────────────────

import type {
  CategoryWeights as ScoringWeights,
  GradeBand as ScoringGradeBand,
  BadgeId as ScoringBadgeId,
} from "@/lib/scoringEngine";
import {
  DEFAULT_WEIGHTS as SCORING_DEFAULT_WEIGHTS,
  DEFAULT_GRADE_MAP as SCORING_DEFAULT_GRADE_MAP,
  BADGE_DEFINITIONS as SCORING_BADGE_DEFINITIONS,
} from "@/lib/scoringEngine";

export interface ScoringSettings {
  /** Per-category weights (do not need to sum to 100; engine normalizes). */
  weights: ScoringWeights;
  /** Letter-grade band thresholds. */
  gradeMap: ScoringGradeBand[];
  /** Which badges are enabled for the class. */
  enabledBadges: ScoringBadgeId[];
  /** Number of trades that earns full participation credit. */
  participationGoal: number;
  /** Whether scoring is shown to students. */
  visibleToStudents: boolean;
}

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  weights: SCORING_DEFAULT_WEIGHTS,
  gradeMap: SCORING_DEFAULT_GRADE_MAP,
  enabledBadges: Object.keys(SCORING_BADGE_DEFINITIONS) as ScoringBadgeId[],
  participationGoal: 10,
  visibleToStudents: true,
};

// ── Scenario Library ─────────────────────────────────────────────

export type ScenarioType =
  | "efficient-market"
  | "rumor-driven"
  | "insider-information"
  | "herd-behavior"
  | "shock-event"
  | "high-liquidity"
  | "low-liquidity"
  | "overconfidence"
  | "risk-management"
  | "diversification"
  | "tournament-prediction";

export const SCENARIO_TYPE_LABELS: Record<ScenarioType, string> = {
  "efficient-market": "Efficient market",
  "rumor-driven": "Rumor-driven market",
  "insider-information": "Insider information",
  "herd-behavior": "Herd behavior",
  "shock-event": "Shock event",
  "high-liquidity": "High-liquidity market",
  "low-liquidity": "Low-liquidity market",
  "overconfidence": "Overconfidence",
  "risk-management": "Risk management challenge",
  "diversification": "Diversification challenge",
  "tournament-prediction": "Tournament prediction challenge",
};

export type ScenarioDifficulty = "intro" | "intermediate" | "advanced";

/** Snapshot of a market template stored inside a scenario. */
export interface ScenarioMarketTemplate {
  title: string;
  league: string;
  sport: string;
  description: string;
  outcomes: string[];
  liquidity: number;
  /** Suggested status when launched (most scenarios open immediately). */
  suggestedStatus?: "open" | "scheduled";
}

/** Preset settings applied at one-click launch. */
export interface ScenarioPresets {
  scoringWeightOverrides?: Partial<ScoringWeights>;
  leaderboardVisible?: boolean;
  nameVisibility?: ExperimentNameVisibility;
  scoringMode?: ExperimentScoringMode;
  /** Active special rules (subset of EXPERIMENT_RULE_PRESETS ids). */
  activeRuleIds?: string[];
  /** Optional debrief reflection prompts to auto-create on launch. */
  debriefPrompts?: string[];
}

export interface Scenario {
  id: string;
  title: string;
  type: ScenarioType;
  description: string;
  learningObjective: string;
  studentInstructions: string;
  instructorNotes: string;
  /** Recommended duration in minutes. */
  recommendedMinutes: number;
  recommendedDebriefPoints: string[];
  marketTemplates: ScenarioMarketTemplate[];
  /** Optional Experiment scaffold to create alongside the markets. */
  experimentScaffold: {
    type: ExperimentType;
    objective: string;
  } | null;
  presets: ScenarioPresets;
  tags: string[];
  difficulty: ScenarioDifficulty;
  isArchived: boolean;
  createdAt: string;
  /** Last time this scenario was launched. */
  lastLaunchedAt: string | null;
  launchCount: number;
}


// ── Seed Data ──────────────────────────────────────────────────────

const CLASSROOM_ID = "class-1";

function generateClassCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const SEED_CLASSROOMS: Classroom[] = [
  {
    id: CLASSROOM_ID,
    name: "Econ 101 — Spring 2026",
    description: "Introduction to prediction markets and probability",
    startingBalance: DEFAULT_STARTING_CASH,
    createdAt: new Date().toISOString(),
    isActive: true,
    classCode: "ECN101",
    allowSelfJoin: true,
    startDate: "2026-01-15",
    endDate: "2026-05-15",
    resetMode: "manual",
  },
  {
    id: "class-2",
    name: "Finance 301 — Spring 2026",
    description: "Advanced market microstructure",
    startingBalance: 15_000,
    createdAt: new Date().toISOString(),
    isActive: false,
    classCode: "FIN301",
    allowSelfJoin: false,
    startDate: "2026-01-20",
    endDate: "2026-05-10",
    resetMode: "semester",
  },
];

function makeMarket(
  id: string, title: string, league: string, sport: string,
  startTime: string, description: string, outcomes: string[],
  liquidity: number, category: MarketCategory = "game-winner",
  status: "open" | "settled" = "open",
  resolvedOutcomeId: string | null = null, settlementResult: string | null = null
): Market {
  const prices = evenPriceDistribution(outcomes.length);
  const finalPrices = resolvedOutcomeId
    ? outcomes.map((_, i) => outcomes[i] === settlementResult ? 1.0 : 0.0)
    : prices;

  return {
    id,
    classroomId: CLASSROOM_ID,
    title,
    league,
    sport,
    status,
    startTime,
    closeTime: null,
    description,
    outcomes: outcomes.map((name, i) => ({
      id: `${id}-o${i + 1}`,
      name,
      price: resolvedOutcomeId ? finalPrices[i] : prices[i],
    })),
    config: defaultMarketConfig(liquidity),
    resolvedOutcomeId,
    settlementResult,
    createdAt: new Date().toISOString(),
    metadata: {
      category,
      difficultyLevel: "beginner",
    },
  };
}

// ── Seed Scenarios ────────────────────────────────────────────────

const SEED_SCENARIOS: Scenario[] = [
  {
    id: "scn-efficient-baseline",
    title: "Efficient Market Baseline",
    type: "efficient-market",
    description: "A clean prediction market on a high-information, public event. Used as the control baseline for later experiments.",
    learningObjective: "Recognize how prices in a transparent, well-informed market converge toward consensus probability.",
    studentInstructions: "Trade freely on the listed event. Pay attention to how prices move as more participants enter.",
    instructorNotes: "Run for 10–15 minutes with no shocks or info packets. Use the resulting prices as the comparison baseline.",
    recommendedMinutes: 15,
    recommendedDebriefPoints: [
      "How quickly did prices stabilize?",
      "Where did the final implied probability land vs your prior expectation?",
      "Which trades moved prices the most, and why?",
    ],
    marketTemplates: [{
      title: "Lakers vs Celtics — Tonight",
      league: "NBA", sport: "Basketball",
      description: "Public, high-coverage matchup. Plenty of available information.",
      outcomes: ["Lakers Win", "Celtics Win"],
      liquidity: 250,
      suggestedStatus: "open",
    }],
    experimentScaffold: { type: "open-simulation", objective: "Establish baseline behavior of an efficient market." },
    presets: {
      leaderboardVisible: true,
      nameVisibility: "anonymized",
      scoringMode: "portfolio-return",
      activeRuleIds: [],
      debriefPrompts: ["What surprised you about how the price moved?"],
    },
    tags: ["baseline", "intro", "efficiency"],
    difficulty: "intro",
    isArchived: false,
    createdAt: new Date().toISOString(),
    lastLaunchedAt: null,
    launchCount: 0,
  },
  {
    id: "scn-low-liquidity",
    title: "Low-Liquidity Stress Test",
    type: "low-liquidity",
    description: "Thin market where even small trades move the price meaningfully. Useful for discussing slippage and manipulation risk.",
    learningObjective: "Understand how liquidity affects price discovery and trader influence.",
    studentInstructions: "Trade on the event below. Observe how each trade moves the displayed price.",
    instructorNotes: "Set liquidity intentionally low (~50). Pause halfway through to compare to the efficient-market baseline.",
    recommendedMinutes: 15,
    recommendedDebriefPoints: [
      "How much did one trade move the price?",
      "Could a small group of students dominate price formation here?",
      "What does this imply about real-world thin markets?",
    ],
    marketTemplates: [{
      title: "Minor League Game — Limited Coverage",
      league: "Misc", sport: "Baseball",
      description: "Low public information; thin participation.",
      outcomes: ["Home Win", "Away Win"],
      liquidity: 50,
      suggestedStatus: "open",
    }],
    experimentScaffold: { type: "open-simulation", objective: "Demonstrate slippage and concentration risk in thin markets." },
    presets: {
      leaderboardVisible: true,
      nameVisibility: "anonymized",
      activeRuleIds: ["max-position"],
      debriefPrompts: ["Did a few traders move this market disproportionately?"],
    },
    tags: ["liquidity", "microstructure"],
    difficulty: "intermediate",
    isArchived: false,
    createdAt: new Date().toISOString(),
    lastLaunchedAt: null,
    launchCount: 0,
  },
  {
    id: "scn-tournament",
    title: "Tournament Prediction Challenge",
    type: "tournament-prediction",
    description: "Multi-market bracket with several simultaneous games. Tests diversification and information allocation across markets.",
    learningObjective: "Practice allocating limited bankroll across multiple correlated markets under uncertainty.",
    studentInstructions: "You have one bankroll to deploy across several simultaneous games. Diversify or concentrate as you see fit.",
    instructorNotes: "Open all four markets at once. Settle them in sequence to discuss pre-settlement vs post-settlement portfolio dynamics.",
    recommendedMinutes: 25,
    recommendedDebriefPoints: [
      "Did concentrated bets pay off, or did diversification win?",
      "How did settlement of one market affect prices in the others?",
      "What information should have driven your allocation?",
    ],
    marketTemplates: [
      { title: "Quarterfinal A", league: "March Madness", sport: "Basketball", description: "Bracket QF.", outcomes: ["Team A", "Team B"], liquidity: 150, suggestedStatus: "open" },
      { title: "Quarterfinal B", league: "March Madness", sport: "Basketball", description: "Bracket QF.", outcomes: ["Team C", "Team D"], liquidity: 150, suggestedStatus: "open" },
      { title: "Quarterfinal C", league: "March Madness", sport: "Basketball", description: "Bracket QF.", outcomes: ["Team E", "Team F"], liquidity: 150, suggestedStatus: "open" },
      { title: "Quarterfinal D", league: "March Madness", sport: "Basketball", description: "Bracket QF.", outcomes: ["Team G", "Team H"], liquidity: 150, suggestedStatus: "open" },
    ],
    experimentScaffold: { type: "open-simulation", objective: "Diversification under correlated outcomes." },
    presets: {
      leaderboardVisible: true,
      nameVisibility: "anonymized",
      activeRuleIds: ["concentration-limit"],
      debriefPrompts: ["How did you decide your allocation across the four games?"],
    },
    tags: ["tournament", "diversification", "bracket"],
    difficulty: "intermediate",
    isArchived: false,
    createdAt: new Date().toISOString(),
    lastLaunchedAt: null,
    launchCount: 0,
  },
];

const SEED_MARKETS: Market[] = [
  makeMarket("m1", "Lakers vs Celtics", "NBA", "Basketball",
    "Tonight, 8:00 PM ET", "Regular season matchup. Trade on who you think will win.",
    ["Lakers Win", "Celtics Win"], 100, "game-winner"),
  makeMarket("m2", "Super Bowl LIX", "NFL", "Football",
    "Feb 9, 7:30 PM ET", "Championship game. Will the Chiefs three-peat?",
    ["Chiefs Win", "49ers Win"], 150, "game-winner"),
  makeMarket("m3", "Man City vs Arsenal", "Premier League", "Soccer",
    "Sat, 3:00 PM GMT", "Top of the table clash in the Premier League.",
    ["Man City", "Draw", "Arsenal"], 120, "game-winner"),
  makeMarket("m4", "Wimbledon Final", "ATP", "Tennis",
    "Jul 14, 2:00 PM BST", "Men's singles final at the All England Club.",
    ["Djokovic", "Alcaraz"], 80, "tournament-winner"),
  makeMarket("m5", "World Series Game 7", "MLB", "Baseball",
    "Settled", "The deciding game of the Fall Classic.",
    ["Yankees", "Dodgers"], 100, "game-winner", "settled", "m5-o1", "Yankees"),
  makeMarket("m6", "NBA MVP Award", "NBA", "Basketball",
    "Jun 2026", "Who will be named the 2025-26 NBA Most Valuable Player?",
    ["Luka Dončić", "Nikola Jokić", "Jayson Tatum", "Giannis Antetokounmpo", "Shai Gilgeous-Alexander"], 180, "award-winner"),
  makeMarket("m7", "Champions League Winner", "UEFA", "Soccer",
    "May 31, 2026", "Which club will lift the Champions League trophy?",
    ["Real Madrid", "Man City", "Bayern Munich", "Arsenal", "Barcelona", "PSG", "Field"], 200, "tournament-winner"),
  makeMarket("m8", "First Scorer — Lakers vs Celtics", "NBA", "Basketball",
    "Tonight, 8:00 PM ET", "Which player will score the first basket tonight?",
    ["LeBron James", "Anthony Davis", "Jaylen Brown", "Derrick White", "Other"], 120, "first-scorer"),
];

const SEED_STUDENTS: UserPortfolio[] = [
  { userId: "user-1", displayName: "You (Demo)", cash: DEFAULT_STARTING_CASH, holdings: [] },
  { userId: "s-alice", displayName: "Alice Chen", cash: 8_500, holdings: [] },
  { userId: "s-bob", displayName: "Bob Smith", cash: 9_200, holdings: [] },
  { userId: "s-carol", displayName: "Carol Wang", cash: 7_800, holdings: [] },
  { userId: "s-david", displayName: "David Kim", cash: 9_600, holdings: [] },
  { userId: "s-emma", displayName: "Emma Lee", cash: 8_900, holdings: [] },
];

// ── Context ────────────────────────────────────────────────────────

interface MarketContextValue {
  // Core
  markets: Market[];
  portfolio: UserPortfolio;
  trades: Trade[];
  getMarket: (id: string) => Market | undefined;
  estimate: (marketId: string, outcomeId: string, quantity: number, type: "BUY" | "SELL") => TradeEstimate | null;
  validate: (marketId: string, outcomeId: string, quantity: number, type: "BUY" | "SELL") => TradeValidation;
  trade: (marketId: string, outcomeId: string, quantity: number, type: "BUY" | "SELL") => Trade | null;
  portfolioStats: ReturnType<typeof calculatePortfolioValue>;
  realizedPnL: number;
  getHolding: (marketId: string, outcomeId: string) => Holding | undefined;
  recentTrades: Trade[];
  topMovers: { marketTitle: string; outcomeName: string; price: number; change: number }[];

  // Multi-classroom
  classrooms: Classroom[];
  activeClassroom: Classroom;
  setActiveClassroom: (id: string) => void;
  createClassroom: (name: string, description: string, startingBalance: number) => void;
  deleteClassroom: (id: string) => void;

  // Classroom (active)
  classroom: Classroom;
  students: UserPortfolio[];
  adminActions: AdminAction[];
  updateClassroom: (updates: Partial<Classroom>) => void;
  addStudent: (name: string) => void;
  removeStudent: (userId: string) => void;

  // Admin market actions
  createMarket: (title: string, league: string, sport: string, startTime: string, description: string, outcomes: string[], liquidity: number, engineType?: PricingEngineType, maxTradeSize?: number, priceFloor?: number, priceCeiling?: number, transactionFeePct?: number, spread?: number, metadata?: Partial<MarketMetadata>, customPrices?: number[]) => void;
  bulkCreateMarkets: (configs: Array<{ title: string; league: string; sport: string; startTime: string; description: string; outcomes: string[]; liquidity: number; metadata?: Partial<MarketMetadata> }>) => void;
  savedTemplates: SavedTemplate[];
  saveTemplate: (template: SavedTemplate) => void;
  deleteTemplate: (id: string) => void;
  duplicateMarket: (marketId: string) => void;
  suspendMarket: (marketId: string) => void;
  resumeMarket: (marketId: string) => void;
  settleMarket: (marketId: string, winningOutcomeId: string) => void;
  voidMarket: (marketId: string, rule?: "return-cost" | "return-current-value") => void;
  cancelMarket: (marketId: string) => void;
  postponeMarket: (marketId: string) => void;
  scheduleMarket: (marketId: string) => void;
  editMarket: (marketId: string, updates: Partial<Pick<Market, "title" | "league" | "sport" | "startTime" | "closeTime" | "description">>) => void;
  deleteMarket: (marketId: string) => void;

  // Batch operations
  openAllMarkets: () => void;
  closeAllMarkets: () => void;
  pauseAllTrading: () => void;
  resumeAllTrading: () => void;
  batchSettleMarkets: (settlements: { marketId: string; winningOutcomeId: string }[]) => void;

  // Instructor tools
  adjustBankroll: (userId: string, amount: number, reason: string) => void;
  reverseTrade: (tradeId: string) => void;
  recalculateAll: () => void;
  duplicateClassroom: (classroomId: string) => void;

  // Class management
  resetClassroom: () => void;
  updateStartingBalance: (amount: number) => void;

  // Leaderboard
  getLeaderboard: (mode: LeaderboardMode) => LeaderboardEntry[];

  // Export
  exportTradeHistory: () => string;
  exportLeaderboard: () => string;

  // Demo
  seedDemoData: (studentCount: number, tradesPerStudent: number) => void;

  // Experiments
  experiments: Experiment[];
  activeExperiment: Experiment | null;
  createExperiment: (exp: Omit<Experiment, "id" | "createdAt" | "status">) => Experiment;
  updateExperiment: (id: string, updates: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  duplicateExperiment: (id: string) => void;
  activateExperiment: (id: string) => void;
  pauseExperiment: (id: string) => void;
  endExperiment: (id: string) => void;
  archiveExperiment: (id: string) => void;
  setActiveExperiment: (id: string | null) => void;

  // Information Asymmetry
  infoPackets: InfoPacket[];
  /** Packets visible to the given user (released and assigned to them). */
  getPacketsForUser: (userId: string) => InfoPacket[];
  /** Total unread packets for a user (released, not yet opened). */
  getUnreadPacketCount: (userId: string) => number;
  createInfoPacket: (input: {
    title: string;
    body: string;
    kind: InfoPacketKind;
    truthLevel: InfoPacketTruthLevel;
    audience: InfoAudience;
    experimentId?: string | null;
    marketId?: string | null;
    scheduledFor?: string | null;
    disclosureToClass?: boolean;
    includeInDebrief?: boolean;
  }) => InfoPacket;
  releaseInfoPacket: (packetId: string) => void;
  deleteInfoPacket: (packetId: string) => void;
  openInfoPacket: (packetId: string, userId: string) => void;
  acknowledgeInfoPacket: (packetId: string, userId: string) => void;

  // Market Manipulation & Ethics Mode
  ethicsSettings: EthicsSettings;
  updateEthicsSettings: (updates: Partial<EthicsSettings>) => void;
  scenarioEvents: ScenarioEvent[];
  injectScenarioEvent: (input: {
    kind: ScenarioKind;
    marketId: string | null;
    note: string;
    participantIds?: string[];
  }) => ScenarioEvent;
  deleteScenarioEvent: (id: string) => void;
  /** Execute a large instructor-driven "whale" trade attributed to a chosen student. */
  executeWhaleTrade: (input: {
    marketId: string;
    outcomeId: string;
    quantity: number;
    type: "BUY" | "SELL";
    asUserId: string;
    note?: string;
  }) => Trade | null;

  // Behavioral Finance Experiments
  biasExperiments: BiasExperiment[];
  createBiasExperiment: (input: {
    title: string;
    bias: BiasKind;
    objective?: string;
    marketIds?: string[];
    studentNoticeEnabled?: boolean;
  }) => BiasExperiment;
  updateBiasExperiment: (id: string, updates: Partial<Omit<BiasExperiment, "id" | "classroomId" | "createdAt">>) => void;
  deleteBiasExperiment: (id: string) => void;
  setBiasExperimentMarkets: (id: string, marketIds: string[]) => void;
  setBiasFraming: (experimentId: string, marketId: string, framing: BiasFraming) => void;
  /** Returns the active bias experiment(s) for a market in the current classroom. */
  getBiasExperimentsForMarket: (marketId: string) => BiasExperiment[];

  // Shock Events
  shockEvents: ShockEvent[];
  createShockEvent: (input: {
    kind: ShockKind;
    title: string;
    description: string;
    marketIds?: string[];
    confidence?: ShockConfidence;
    urgency?: ShockUrgency;
    visibility?: ShockVisibility;
    audienceUserIds?: string[];
    truthStatus?: ShockTruth;
    scheduledFor?: string | null;
    releaseNow?: boolean;
    correctsShockId?: string | null;
  }) => ShockEvent;
  releaseShockEvent: (id: string) => void;
  cancelShockEvent: (id: string) => void;
  correctShockEvent: (originalId: string, correction: { title: string; description: string }) => ShockEvent | null;
  deleteShockEvent: (id: string) => void;
  updateShockTruthStatus: (id: string, truthStatus: ShockTruth) => void;
  /** Shocks visible to a given user (released only). */
  getShocksForUser: (userId: string) => ShockEvent[];
  /** Shocks attached to a market and visible to a user (released only). */
  getShocksForMarket: (marketId: string, userId?: string) => ShockEvent[];

  // Reflection & Debrief
  reflectionAssignments: ReflectionAssignment[];
  reflectionResponses: ReflectionResponse[];
  createReflectionAssignment: (input: {
    title: string;
    description?: string;
    experimentId?: string | null;
    prompts?: ReflectionPrompt[];
    required?: boolean;
    graded?: boolean;
    visibility?: ReflectionVisibility;
    openImmediately?: boolean;
  }) => ReflectionAssignment;
  updateReflectionAssignment: (id: string, updates: Partial<Omit<ReflectionAssignment, "id" | "classroomId" | "createdAt">>) => void;
  deleteReflectionAssignment: (id: string) => void;
  setReflectionStatus: (id: string, status: ReflectionAssignment["status"]) => void;
  submitReflectionResponse: (assignmentId: string, answers: ReflectionAnswer[]) => ReflectionResponse;
  gradeReflectionResponse: (responseId: string, grade: number | null, feedback: string | null) => void;
  /** Reflection assignments visible to a given student (open/closed only). */
  getReflectionsForUser: (userId: string) => ReflectionAssignment[];
  /** Returns the user's response for an assignment, if any. */
  getReflectionResponse: (assignmentId: string, userId: string) => ReflectionResponse | undefined;
  /** Returns all responses for an assignment (instructor view). */
  getReflectionResponses: (assignmentId: string) => ReflectionResponse[];

  // Discussion Mode
  discussionCards: DiscussionCard[];
  discussionSettings: DiscussionSettings;
  updateDiscussionSettings: (updates: Partial<DiscussionSettings>) => void;
  createDiscussionCard: (input: Omit<DiscussionCard, "id" | "classroomId" | "createdAt" | "pinned" | "saved"> & {
    pinned?: boolean;
    saved?: boolean;
  }) => DiscussionCard;
  updateDiscussionCard: (id: string, updates: Partial<Omit<DiscussionCard, "id" | "classroomId" | "createdAt">>) => void;
  deleteDiscussionCard: (id: string) => void;
  toggleDiscussionCardPin: (id: string) => void;
  toggleDiscussionCardSaved: (id: string) => void;

  // Classroom Scoring
  scoringSettings: ScoringSettings;
  updateScoringSettings: (updates: Partial<ScoringSettings>) => void;
  updateScoringWeights: (updates: Partial<ScoringWeights>) => void;
  updateGradeMap: (map: ScoringGradeBand[]) => void;
  toggleBadgeEnabled: (badgeId: ScoringBadgeId) => void;

  // Scenario Library
  scenarios: Scenario[];
  createScenario: (input: Omit<Scenario, "id" | "createdAt" | "isArchived" | "lastLaunchedAt" | "launchCount">) => Scenario;
  updateScenario: (id: string, updates: Partial<Omit<Scenario, "id" | "createdAt">>) => void;
  duplicateScenario: (id: string) => Scenario | null;
  archiveScenario: (id: string, archived: boolean) => void;
  deleteScenario: (id: string) => void;
  /** Capture current classroom setup as a new scenario. */
  saveCurrentAsScenario: (meta: {
    title: string;
    type: ScenarioType;
    description: string;
    learningObjective: string;
    studentInstructions: string;
    instructorNotes: string;
    recommendedMinutes: number;
    recommendedDebriefPoints: string[];
    tags: string[];
    difficulty: ScenarioDifficulty;
  }) => Scenario;
  /** One-click launch: creates markets, applies presets, optional experiment. */
  launchScenario: (id: string) => { marketsCreated: number; experimentId: string | null } | null;
}

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [classrooms, setClassrooms] = useState<Classroom[]>(SEED_CLASSROOMS);
  const [activeClassroomId, setActiveClassroomId] = useState(CLASSROOM_ID);
  const [markets, setMarkets] = useState<Market[]>(SEED_MARKETS);
  const [portfolio, setPortfolio] = useState<UserPortfolio>(SEED_STUDENTS[0]);
  const [students, setStudents] = useState<UserPortfolio[]>(SEED_STUDENTS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [sportsbookWagers, setSportsbookWagers] = useState<SportsbookWager[]>([]);
  const [raceWagers, setRaceWagers] = useState<RaceWager[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [priceChanges, setPriceChanges] = useState<
    Map<string, { marketTitle: string; outcomeName: string; price: number; change: number }>
  >(new Map());
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [infoPackets, setInfoPackets] = useState<InfoPacket[]>([]);
  const [ethicsSettings, setEthicsSettings] = useState<EthicsSettings>(DEFAULT_ETHICS_SETTINGS);
  const [scenarioEvents, setScenarioEvents] = useState<ScenarioEvent[]>([]);
  const [biasExperiments, setBiasExperiments] = useState<BiasExperiment[]>([]);
  const [shockEvents, setShockEvents] = useState<ShockEvent[]>([]);
  const [reflectionAssignments, setReflectionAssignments] = useState<ReflectionAssignment[]>([]);
  const [reflectionResponses, setReflectionResponses] = useState<ReflectionResponse[]>([]);
  const [discussionCards, setDiscussionCards] = useState<DiscussionCard[]>([]);
  const [discussionSettings, setDiscussionSettings] = useState<DiscussionSettings>(DEFAULT_DISCUSSION_SETTINGS);
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings>(DEFAULT_SCORING_SETTINGS);
  const [scenarios, setScenarios] = useState<Scenario[]>(SEED_SCENARIOS);

  const classroom = classrooms.find((c) => c.id === activeClassroomId) ?? classrooms[0];

  const logAction = useCallback((action: string, detail: string) => {
    setAdminActions((prev) => [
      { id: crypto.randomUUID(), action, detail, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const getMarket = useCallback((id: string) => markets.find((m) => m.id === id), [markets]);

  // ── Multi-classroom ─────────────────────────────────────────────

  const setActiveClassroom = useCallback((id: string) => {
    setActiveClassroomId(id);
    logAction("Switch classroom", id);
  }, [logAction]);

  const createClassroom = useCallback((name: string, description: string, startingBalance: number) => {
    const newClass: Classroom = {
      id: `class-${crypto.randomUUID().slice(0, 8)}`,
      name,
      description,
      startingBalance,
      createdAt: new Date().toISOString(),
      isActive: true,
      classCode: generateClassCode(),
      allowSelfJoin: true,
      startDate: null,
      endDate: null,
      resetMode: "manual",
    };
    setClassrooms((prev) => [...prev, newClass]);
    logAction("Create classroom", name);
  }, [logAction]);

  const deleteClassroom = useCallback((id: string) => {
    if (id === activeClassroomId) return; // can't delete active
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
    logAction("Delete classroom", id);
  }, [activeClassroomId, logAction]);

  const duplicateClassroom = useCallback((classroomId: string) => {
    const source = classrooms.find((c) => c.id === classroomId);
    if (!source) return;
    const newId = `class-${crypto.randomUUID().slice(0, 8)}`;
    const dup: Classroom = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      classCode: generateClassCode(),
      createdAt: new Date().toISOString(),
    };
    setClassrooms((prev) => [...prev, dup]);
    // Duplicate markets for this class
    const classMarkets = markets.filter((m) => m.classroomId === classroomId);
    const newMarkets = classMarkets.map((m) => {
      const id = `m-${crypto.randomUUID().slice(0, 8)}`;
      const prices = evenPriceDistribution(m.outcomes.length);
      return {
        ...m,
        id,
        classroomId: newId,
        status: "open" as const,
        resolvedOutcomeId: null,
        settlementResult: null,
        outcomes: m.outcomes.map((o, i) => ({ ...o, id: `${id}-o${i + 1}`, price: prices[i] })),
        createdAt: new Date().toISOString(),
      };
    });
    setMarkets((prev) => [...newMarkets, ...prev]);
    logAction("Duplicate classroom", `${source.name} → ${dup.name}`);
  }, [classrooms, markets, logAction]);

  // ── Trading (delegates to centralized engine) ───────────────────

  const estimate = useCallback(
    (marketId: string, outcomeId: string, quantity: number, type: "BUY" | "SELL") => {
      const market = markets.find((m) => m.id === marketId);
      if (!market || quantity <= 0) return null;
      try {
        return estimateTrade(market, outcomeId, quantity, type);
      } catch { return null; }
    },
    [markets]
  );

  const validate = useCallback(
    (marketId: string, outcomeId: string, quantity: number, type: "BUY" | "SELL") => {
      const market = markets.find((m) => m.id === marketId);
      if (!market) return { valid: false, error: "Market not found" } as TradeValidation;
      return validateTrade(market, portfolio, outcomeId, quantity, type);
    },
    [markets, portfolio]
  );

  const doTrade = useCallback(
    (marketId: string, outcomeId: string, quantity: number, type: "BUY" | "SELL"): Trade | null => {
      const market = markets.find((m) => m.id === marketId);
      if (!market) return null;
      try {
        const result = executeTrade(market, portfolio, outcomeId, quantity, type);
        setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, outcomes: result.updatedOutcomes } : m));
        setPortfolio(result.updatedPortfolio);
        setStudents((prev) => prev.map((s) => s.userId === portfolio.userId ? result.updatedPortfolio : s));
        setTrades((prev) => [result.trade, ...prev]);
        setPriceChanges((prev) => {
          const next = new Map(prev);
          const key = `${marketId}-${outcomeId}`;
          const existing = next.get(key);
          next.set(key, {
            marketTitle: market.title,
            outcomeName: result.trade.outcomeName,
            price: result.trade.priceAfterTrade,
            change: (existing?.change ?? 0) + (result.trade.priceAfterTrade - result.trade.priceBeforeTrade),
          });
          return next;
        });
        return result.trade;
      } catch (e) {
        console.error("Trade execution failed:", e);
        return null;
      }
    },
    [markets, portfolio]
  );

  const portfolioStats = calculatePortfolioValue(portfolio, markets);

  const userTrades = useMemo(
    () => trades.filter((t) => t.userId === portfolio.userId),
    [trades, portfolio.userId]
  );
  const realizedPnL = useMemo(() => calculateRealizedPnL(userTrades), [userTrades]);

  const getHolding = useCallback(
    (marketId: string, outcomeId: string) =>
      portfolio.holdings.find((h) => h.marketId === marketId && h.outcomeId === outcomeId),
    [portfolio.holdings]
  );

  const recentTrades = trades.slice(0, 20);
  const topMovers = Array.from(priceChanges.values())
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  // ── Classroom management ─────────────────────────────────────────

  const updateClassroom = useCallback((updates: Partial<Classroom>) => {
    setClassrooms((prev) => prev.map((c) => c.id === activeClassroomId ? { ...c, ...updates } : c));
    logAction("Update classroom", JSON.stringify(updates));
  }, [activeClassroomId, logAction]);

  const addStudent = useCallback((name: string) => {
    const newStudent: UserPortfolio = {
      userId: `s-${crypto.randomUUID().slice(0, 8)}`,
      displayName: name,
      cash: classroom.startingBalance,
      holdings: [],
    };
    setStudents((prev) => [...prev, newStudent]);
    logAction("Add student", name);
  }, [classroom.startingBalance, logAction]);

  const removeStudent = useCallback((userId: string) => {
    setStudents((prev) => prev.filter((s) => s.userId !== userId));
    logAction("Remove student", userId);
  }, [logAction]);

  // ── Admin market actions ─────────────────────────────────────────

  const createMarket = useCallback(
    (title: string, league: string, sport: string, startTime: string, description: string, outcomes: string[], liquidity: number, engineType: PricingEngineType = "linear-impact", maxTradeSize: number = DEFAULT_MAX_TRADE_SIZE, priceFloor: number = PRICE_FLOOR, priceCeiling: number = PRICE_CEILING, transactionFeePct: number = 0, spread: number = 0, metadata?: Partial<MarketMetadata>, customPrices?: number[]) => {
      const id = `m-${crypto.randomUUID().slice(0, 8)}`;
      const prices = customPrices && customPrices.length === outcomes.length ? customPrices : evenPriceDistribution(outcomes.length);
      const config: MarketConfig = { engineType, liquidityParameter: liquidity, maxTradeSize, priceFloor, priceCeiling, transactionFeePct, spread };
      const newMarket: Market = {
        id,
        classroomId: activeClassroomId,
        title,
        league,
        sport,
        status: "open",
        startTime,
        closeTime: null,
        description,
        outcomes: outcomes.map((name, i) => ({
          id: `${id}-o${i + 1}`,
          name,
          price: prices[i],
        })),
        config,
        resolvedOutcomeId: null,
        settlementResult: null,
        createdAt: new Date().toISOString(),
        metadata: {
          category: metadata?.category ?? "custom",
          difficultyLevel: metadata?.difficultyLevel ?? "beginner",
          season: metadata?.season,
          eventDate: metadata?.eventDate,
          teamNames: metadata?.teamNames,
          playerNames: metadata?.playerNames,
          instructionalNotes: metadata?.instructionalNotes,
          settlementRules: metadata?.settlementRules,
          templateId: metadata?.templateId,
          dataSource: metadata?.dataSource ?? "manual",
          externalEventId: metadata?.externalEventId,
          externalSport: metadata?.externalSport,
          externalLeague: metadata?.externalLeague,
        },
      };
      setMarkets((prev) => [newMarket, ...prev]);
      logAction("Create market", `${title} [${engineType}]`);
    },
    [activeClassroomId, logAction]
  );

  const duplicateMarket = useCallback((marketId: string) => {
    const source = markets.find((m) => m.id === marketId);
    if (!source) return;
    const id = `m-${crypto.randomUUID().slice(0, 8)}`;
    const prices = evenPriceDistribution(source.outcomes.length);
    const dup: Market = {
      ...source,
      id,
      title: `${source.title} (Copy)`,
      status: "open",
      resolvedOutcomeId: null,
      settlementResult: null,
      outcomes: source.outcomes.map((o, i) => ({
        ...o,
        id: `${id}-o${i + 1}`,
        price: prices[i],
      })),
      createdAt: new Date().toISOString(),
    };
    setMarkets((prev) => [dup, ...prev]);
    logAction("Duplicate market", source.title);
  }, [markets, logAction]);

  const suspendMarket = useCallback((marketId: string) => {
    const m = markets.find((x) => x.id === marketId);
    if (!m) return;
    if (TERMINAL_STATUSES.includes(m.status)) {
      toast.error("This market is already settled and cannot be suspended");
      return;
    }
    if (m.status !== "open") {
      toast.error("Only open markets can be suspended");
      return;
    }
    setMarkets((prev) => prev.map((x) => x.id === marketId ? { ...x, status: "suspended" as const } : x));
    logAction("Suspend market", marketId);
  }, [markets, logAction]);

  const resumeMarket = useCallback((marketId: string) => {
    const m = markets.find((x) => x.id === marketId);
    if (!m) return;
    if (TERMINAL_STATUSES.includes(m.status)) {
      toast.error("This market is already settled and cannot be reopened");
      return;
    }
    if (m.status === "open") return;
    setMarkets((prev) => prev.map((x) => x.id === marketId ? { ...x, status: "open" as const } : x));
    logAction("Resume market", marketId);
  }, [markets, logAction]);

  const settleMarket = useCallback((marketId: string, winningOutcomeId: string) => {
    const market = markets.find((m) => m.id === marketId);
    if (!market) return;
    if (TERMINAL_STATUSES.includes(market.status)) {
      toast.error("This market is already settled");
      return;
    }
    if (!market.outcomes.some((o) => o.id === winningOutcomeId)) {
      toast.error("Selected outcome is not part of this market");
      return;
    }
    const { settledMarket, updatedPortfolios } = settleMarketForPortfolios(
      market, winningOutcomeId, students
    );
    setMarkets((prev) => prev.map((m) => m.id === marketId ? settledMarket : m));
    setStudents(updatedPortfolios);
    const updatedUser = updatedPortfolios.find((p) => p.userId === portfolio.userId);
    if (updatedUser) setPortfolio(updatedUser);
    logAction("Settle market", `${market.title} → ${settledMarket.settlementResult}`);
  }, [markets, students, portfolio.userId, logAction]);

  const deleteMarket = useCallback((marketId: string) => {
    setMarkets((prev) => prev.filter((m) => m.id !== marketId));
    logAction("Delete market", marketId);
  }, [logAction]);

  const voidMarket = useCallback((marketId: string, rule: "return-cost" | "return-current-value" = "return-cost") => {
    const market = markets.find((m) => m.id === marketId);
    if (!market) return;
    if (TERMINAL_STATUSES.includes(market.status)) {
      toast.error("This market is already finalized");
      return;
    }
    const { voidedMarket, updatedPortfolios } = voidMarketForPortfolios(market, students, rule);
    setMarkets((prev) => prev.map((m) => m.id === marketId ? voidedMarket : m));
    setStudents(updatedPortfolios);
    const updatedUser = updatedPortfolios.find((p) => p.userId === portfolio.userId);
    if (updatedUser) setPortfolio(updatedUser);
    logAction("Void market", `${market.title} (${rule})`);
  }, [markets, students, portfolio.userId, logAction]);

  const cancelMarket = useCallback((marketId: string) => {
    const market = markets.find((m) => m.id === marketId);
    if (!market) return;
    if (TERMINAL_STATUSES.includes(market.status)) {
      toast.error("This market is already finalized");
      return;
    }
    const { cancelledMarket, updatedPortfolios } = cancelMarketForPortfolios(market, students);
    setMarkets((prev) => prev.map((m) => m.id === marketId ? cancelledMarket : m));
    setStudents(updatedPortfolios);
    const updatedUser = updatedPortfolios.find((p) => p.userId === portfolio.userId);
    if (updatedUser) setPortfolio(updatedUser);
    logAction("Cancel market", market.title);
  }, [markets, students, portfolio.userId, logAction]);

  const postponeMarket = useCallback((marketId: string) => {
    const m = markets.find((x) => x.id === marketId);
    if (!m) return;
    if (TERMINAL_STATUSES.includes(m.status)) {
      toast.error("Settled markets cannot be postponed");
      return;
    }
    setMarkets((prev) => prev.map((x) => x.id === marketId ? { ...x, status: "postponed" as const } : x));
    logAction("Postpone market", marketId);
  }, [markets, logAction]);

  const scheduleMarket = useCallback((marketId: string) => {
    setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, status: "scheduled" as const } : m));
    logAction("Schedule market", marketId);
  }, [logAction]);

  const editMarket = useCallback((marketId: string, updates: Partial<Pick<Market, "title" | "league" | "sport" | "startTime" | "closeTime" | "description">>) => {
    const m = markets.find((x) => x.id === marketId);
    if (!m) return;
    if (TERMINAL_STATUSES.includes(m.status)) {
      toast.error("Settled markets cannot be edited");
      return;
    }
    setMarkets((prev) => prev.map((x) => x.id === marketId ? { ...x, ...updates } : x));
    logAction("Edit market", `${marketId}: ${Object.keys(updates).join(", ")}`);
  }, [markets, logAction]);

  // ── Batch operations ─────────────────────────────────────────────

  const openAllMarkets = useCallback(() => {
    setMarkets((prev) => prev.map((m) =>
      m.classroomId === activeClassroomId && (m.status === "suspended" || m.status === "closed")
        ? { ...m, status: "open" as const }
        : m
    ));
    logAction("Open all markets", activeClassroomId);
  }, [activeClassroomId, logAction]);

  const closeAllMarkets = useCallback(() => {
    setMarkets((prev) => prev.map((m) =>
      m.classroomId === activeClassroomId && m.status === "open"
        ? { ...m, status: "closed" as const }
        : m
    ));
    logAction("Close all markets", activeClassroomId);
  }, [activeClassroomId, logAction]);

  const pauseAllTrading = useCallback(() => {
    setMarkets((prev) => prev.map((m) =>
      m.classroomId === activeClassroomId && m.status === "open"
        ? { ...m, status: "suspended" as const }
        : m
    ));
    logAction("Pause all trading", activeClassroomId);
  }, [activeClassroomId, logAction]);

  const resumeAllTrading = useCallback(() => {
    setMarkets((prev) => prev.map((m) =>
      m.classroomId === activeClassroomId && m.status === "suspended"
        ? { ...m, status: "open" as const }
        : m
    ));
    logAction("Resume all trading", activeClassroomId);
  }, [activeClassroomId, logAction]);

  const batchSettleMarkets = useCallback((settlements: { marketId: string; winningOutcomeId: string }[]) => {
    let currentStudents = [...students];
    let currentMarkets = [...markets];
    for (const { marketId, winningOutcomeId } of settlements) {
      const market = currentMarkets.find((m) => m.id === marketId);
      if (!market) continue;
      const { settledMarket, updatedPortfolios } = settleMarketForPortfolios(
        market, winningOutcomeId, currentStudents
      );
      currentMarkets = currentMarkets.map((m) => m.id === marketId ? settledMarket : m);
      currentStudents = updatedPortfolios;
    }
    setMarkets(currentMarkets);
    setStudents(currentStudents);
    const updatedUser = currentStudents.find((p) => p.userId === portfolio.userId);
    if (updatedUser) setPortfolio(updatedUser);
    logAction("Batch settle", `${settlements.length} markets settled`);
  }, [markets, students, portfolio.userId, logAction]);

  // ── Instructor tools ─────────────────────────────────────────────

  const adjustBankroll = useCallback((userId: string, amount: number, reason: string) => {
    setStudents((prev) => prev.map((s) =>
      s.userId === userId ? { ...s, cash: Math.round((s.cash + amount) * 100) / 100 } : s
    ));
    if (userId === portfolio.userId) {
      setPortfolio((prev) => ({ ...prev, cash: Math.round((prev.cash + amount) * 100) / 100 }));
    }
    logAction("Adjust bankroll", `${userId}: ${amount >= 0 ? "+" : ""}$${amount} — ${reason}`);
  }, [portfolio.userId, logAction]);

  const reverseTrade = useCallback((tradeId: string) => {
    const tradeToReverse = trades.find((t) => t.id === tradeId);
    if (!tradeToReverse) return;

    // Reverse the cash impact
    const cashDelta = tradeToReverse.type === "BUY" ? tradeToReverse.totalCost : -tradeToReverse.totalCost;
    setStudents((prev) => prev.map((s) => {
      if (s.userId !== tradeToReverse.userId) return s;
      // Restore cash
      let newCash = s.cash + cashDelta;
      // Reverse holdings
      const holdingIdx = s.holdings.findIndex(
        (h) => h.marketId === tradeToReverse.marketId && h.outcomeId === tradeToReverse.outcomeId
      );
      const newHoldings = [...s.holdings];
      if (tradeToReverse.type === "BUY") {
        if (holdingIdx >= 0) {
          const remaining = newHoldings[holdingIdx].shares - tradeToReverse.quantity;
          if (remaining <= 0) newHoldings.splice(holdingIdx, 1);
          else newHoldings[holdingIdx] = { ...newHoldings[holdingIdx], shares: remaining };
        }
      } else {
        if (holdingIdx >= 0) {
          newHoldings[holdingIdx] = {
            ...newHoldings[holdingIdx],
            shares: newHoldings[holdingIdx].shares + tradeToReverse.quantity,
          };
        } else {
          newHoldings.push({
            marketId: tradeToReverse.marketId,
            marketTitle: tradeToReverse.marketTitle,
            outcomeId: tradeToReverse.outcomeId,
            outcomeName: tradeToReverse.outcomeName,
            shares: tradeToReverse.quantity,
            avgCostPerShare: tradeToReverse.pricePerShare,
          });
        }
      }
      return { ...s, cash: Math.round(newCash * 100) / 100, holdings: newHoldings };
    }));

    // Restore prices
    setMarkets((prev) => prev.map((m) => {
      if (m.id !== tradeToReverse.marketId) return m;
      // Approximate: restore the price before trade for the traded outcome
      return {
        ...m,
        outcomes: m.outcomes.map((o) =>
          o.id === tradeToReverse.outcomeId
            ? { ...o, price: tradeToReverse.priceBeforeTrade }
            : o
        ),
      };
    }));

    // Remove trade from history
    setTrades((prev) => prev.filter((t) => t.id !== tradeId));

    // Update portfolio if it's the current user
    if (tradeToReverse.userId === portfolio.userId) {
      setPortfolio((prev) => {
        let newCash = prev.cash + cashDelta;
        const holdingIdx = prev.holdings.findIndex(
          (h) => h.marketId === tradeToReverse.marketId && h.outcomeId === tradeToReverse.outcomeId
        );
        const newHoldings = [...prev.holdings];
        if (tradeToReverse.type === "BUY") {
          if (holdingIdx >= 0) {
            const remaining = newHoldings[holdingIdx].shares - tradeToReverse.quantity;
            if (remaining <= 0) newHoldings.splice(holdingIdx, 1);
            else newHoldings[holdingIdx] = { ...newHoldings[holdingIdx], shares: remaining };
          }
        } else {
          if (holdingIdx >= 0) {
            newHoldings[holdingIdx] = {
              ...newHoldings[holdingIdx],
              shares: newHoldings[holdingIdx].shares + tradeToReverse.quantity,
            };
          }
        }
        return { ...prev, cash: Math.round(newCash * 100) / 100, holdings: newHoldings };
      });
    }
    logAction("Reverse trade", `Trade ${tradeId.slice(0, 8)} by ${tradeToReverse.outcomeName}`);
  }, [trades, portfolio.userId, logAction]);

  const recalculateAll = useCallback(() => {
    // Force recalculate portfolio values for all students
    const updatedStudents = students.map((s) => {
      const stats = calculatePortfolioValue(s, markets);
      return s; // portfolios are already consistent; this is a "verify" action
    });
    setStudents(updatedStudents);
    const updatedUser = updatedStudents.find((p) => p.userId === portfolio.userId);
    if (updatedUser) setPortfolio(updatedUser);
    logAction("Recalculate all", "Portfolios and leaderboards recalculated");
  }, [students, markets, portfolio.userId, logAction]);

  // ── Class management ─────────────────────────────────────────────

  const resetClassroom = useCallback(() => {
    const balance = classroom.startingBalance;
    setStudents((prev) => prev.map((s) => ({ ...s, cash: balance, holdings: [] })));
    setPortfolio((prev) => ({ ...prev, cash: balance, holdings: [] }));
    setTrades([]);
    setPriceChanges(new Map());
    setMarkets((prev) => prev.map((m) => {
      if (m.status === "settled") return m;
      const prices = evenPriceDistribution(m.outcomes.length);
      return {
        ...m,
        status: "open" as const,
        outcomes: m.outcomes.map((o, i) => ({ ...o, price: prices[i] })),
      };
    }));
    logAction("Reset classroom", `All data reset, balance: $${balance}`);
  }, [classroom.startingBalance, logAction]);

  const updateStartingBalance = useCallback((amount: number) => {
    setClassrooms((prev) => prev.map((c) =>
      c.id === activeClassroomId ? { ...c, startingBalance: amount } : c
    ));
    logAction("Update starting balance", `$${amount}`);
  }, [activeClassroomId, logAction]);

  // ── Leaderboard ──────────────────────────────────────────────────

  const getLeaderboard = useCallback((mode: LeaderboardMode): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = students.map((s) => {
      const stats = calculatePortfolioValue(s, markets);
      const stuTrades = trades.filter((t) => t.userId === s.userId);
      const startBal = classroom.startingBalance;

      let winCount = 0;
      let bestPnL = 0;
      let worstPnL = 0;
      let earlyBuys = 0;
      const buys = stuTrades.filter((t) => t.type === "BUY");
      for (const t of stuTrades) {
        const pnl = t.type === "BUY"
          ? (t.priceAfterTrade - t.pricePerShare) * t.quantity
          : (t.pricePerShare - t.priceBeforeTrade) * t.quantity;
        if (pnl > 0) winCount++;
        if (pnl > bestPnL) bestPnL = pnl;
        if (pnl < worstPnL) worstPnL = pnl;
      }
      for (const t of buys) {
        if (t.priceAfterTrade > t.pricePerShare) earlyBuys++;
      }

      const returnPct = startBal > 0 ? ((stats.totalValue - startBal) / startBal) * 100 : 0;
      const totalReturn = stats.totalValue - startBal;

      // Decision score (simplified composite)
      const earlyBuyerScore = buys.length > 0 ? earlyBuys / buys.length : 0;
      const chaseBuys = buys.filter((t) => t.priceBeforeTrade > 0.6).length;
      const chaseBuyRate = buys.length > 0 ? chaseBuys / buys.length : 0;
      const decisionScore = Math.round(Math.min(100, Math.max(0, earlyBuyerScore * 50 + (1 - chaseBuyRate) * 50)));

      // Risk score
      const holdingsByMkt = new Map<string, number>();
      for (const h of s.holdings) {
        const o = markets.find((m) => m.id === h.marketId)?.outcomes.find((o) => o.id === h.outcomeId);
        holdingsByMkt.set(h.marketId, (holdingsByMkt.get(h.marketId) ?? 0) + h.shares * (o?.price ?? 0));
      }
      const maxConc = stats.totalValue > 0 ? Math.max(0, ...Array.from(holdingsByMkt.values())) / stats.totalValue : 0;
      const divCount = holdingsByMkt.size;
      const riskScore = Math.round(Math.min(100, Math.max(0, (1 - maxConc) * 50 + Math.min(1, divCount / 5) * 50)));

      const efficiency = stuTrades.length > 0 ? Math.round((totalReturn / stuTrades.length) * 100) / 100 : 0;

      return {
        userId: s.userId,
        displayName: s.displayName,
        portfolioValue: stats.totalValue,
        cash: stats.cash,
        returnPct: Math.round(returnPct * 10) / 10,
        tradeCount: stuTrades.length,
        winCount,
        bestTradePnL: Math.round(bestPnL * 100) / 100,
        worstTradePnL: Math.round(worstPnL * 100) / 100,
        decisionScore,
        riskScore,
        efficiency,
      };
    });

    switch (mode) {
      case "portfolio":
        return entries.sort((a, b) => b.portfolioValue - a.portfolioValue);
      case "return":
        return entries.sort((a, b) => b.returnPct - a.returnPct);
      case "accuracy":
        return entries.sort((a, b) => {
          const aRate = a.tradeCount > 0 ? a.winCount / a.tradeCount : 0;
          const bRate = b.tradeCount > 0 ? b.winCount / b.tradeCount : 0;
          return bRate - aRate;
        });
      case "activity":
        return entries.sort((a, b) => b.tradeCount - a.tradeCount);
      case "decision":
        return entries.sort((a, b) => b.decisionScore - a.decisionScore);
      case "risk":
        return entries.sort((a, b) => b.riskScore - a.riskScore);
      case "efficiency":
        return entries.sort((a, b) => b.efficiency - a.efficiency);
      default:
        return entries;
    }
  }, [students, markets, trades, classroom.startingBalance]);

  // ── Export ────────────────────────────────────────────────────────

  const exportTradeHistory = useCallback(() => {
    const header = "Timestamp,Trader,Market,Outcome,Type,Quantity,Price,Total\n";
    const rows = trades.map((t) => {
      const student = students.find((s) => s.userId === t.userId);
      return `${t.timestamp},"${student?.displayName ?? t.userId}","${t.marketTitle}","${t.outcomeName}",${t.type},${t.quantity},${t.pricePerShare.toFixed(4)},${t.totalCost.toFixed(2)}`;
    });
    return header + rows.join("\n");
  }, [trades, students]);

  const exportLeaderboard = useCallback(() => {
    const entries = getLeaderboard("portfolio");
    const header = "Rank,Name,Portfolio Value,Cash,Return %,Trades,Wins,Best Trade,Worst Trade\n";
    const rows = entries.map((e, i) =>
      `${i + 1},"${e.displayName}",${e.portfolioValue.toFixed(2)},${e.cash.toFixed(2)},${e.returnPct.toFixed(1)}%,${e.tradeCount},${e.winCount},${e.bestTradePnL.toFixed(2)},${e.worstTradePnL.toFixed(2)}`
    );
    return header + rows.join("\n");
  }, [getLeaderboard]);

  // ── Demo Mode ───────────────────────────────────────────────────

  const seedDemoData = useCallback((studentCount: number, tradesPerStudent: number) => {
    const demoStudents = generateSampleStudents(studentCount, classroom.startingBalance);
    const result = generateSampleTrades(markets, demoStudents, tradesPerStudent);
    setMarkets(result.updatedMarkets);
    const existingIds = new Set(students.map((s) => s.userId));
    const newStudents = result.updatedStudents.filter((u) => !existingIds.has(u.userId));
    setStudents((prev) => [...prev, ...newStudents]);
    setTrades((prev) => [...result.trades, ...prev]);
    logAction("Seed demo data", `${studentCount} students, ${tradesPerStudent} trades each`);
  }, [markets, students, classroom.startingBalance, logAction]);

  const bulkCreateMarkets = useCallback((configs: Array<{ title: string; league: string; sport: string; startTime: string; description: string; outcomes: string[]; liquidity: number; metadata?: Partial<MarketMetadata> }>) => {
    const newMarkets: Market[] = configs.map((c) => {
      const id = `m-${crypto.randomUUID().slice(0, 8)}`;
      const prices = evenPriceDistribution(c.outcomes.length);
      return {
        id,
        classroomId: activeClassroomId,
        title: c.title,
        league: c.league,
        sport: c.sport,
        status: "open" as const,
        startTime: c.startTime,
        closeTime: null,
        description: c.description,
        outcomes: c.outcomes.map((name, i) => ({ id: `${id}-o${i + 1}`, name, price: prices[i] })),
        config: defaultMarketConfig(c.liquidity),
        resolvedOutcomeId: null,
        settlementResult: null,
        createdAt: new Date().toISOString(),
        metadata: { category: (c.metadata?.category ?? "custom") as MarketCategory, difficultyLevel: (c.metadata?.difficultyLevel ?? "beginner") as DifficultyLevel, ...c.metadata },
      };
    });
    setMarkets((prev) => [...newMarkets, ...prev]);
    logAction("Bulk create markets", `${configs.length} markets created`);
  }, [activeClassroomId, logAction]);

  const saveTemplate = useCallback((template: SavedTemplate) => {
    setSavedTemplates((prev) => {
      const existing = prev.findIndex((t) => t.id === template.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = template;
        return next;
      }
      return [template, ...prev];
    });
    logAction("Save template", template.name);
  }, [logAction]);

  const deleteTemplate = useCallback((id: string) => {
    setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
    logAction("Delete template", id);
  }, [logAction]);

  // ── Experiments ─────────────────────────────────────────────────

  const activeExperiment = useMemo(() => experiments.find((e) => e.id === activeExperimentId) ?? null, [experiments, activeExperimentId]);

  const createExperiment = useCallback((data: Omit<Experiment, "id" | "createdAt" | "status">): Experiment => {
    const exp: Experiment = { ...data, id: `exp-${crypto.randomUUID().slice(0, 8)}`, createdAt: new Date().toISOString(), status: "draft" };
    setExperiments((prev) => [...prev, exp]);
    logAction("Create experiment", exp.title);
    return exp;
  }, [logAction]);

  const updateExperiment = useCallback((id: string, updates: Partial<Experiment>) => {
    setExperiments((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
    logAction("Update experiment", id);
  }, [logAction]);

  const deleteExperiment = useCallback((id: string) => {
    setExperiments((prev) => prev.filter((e) => e.id !== id));
    if (activeExperimentId === id) setActiveExperimentId(null);
    logAction("Delete experiment", id);
  }, [activeExperimentId, logAction]);

  const duplicateExperiment = useCallback((id: string) => {
    const src = experiments.find((e) => e.id === id);
    if (!src) return;
    const dup: Experiment = { ...src, id: `exp-${crypto.randomUUID().slice(0, 8)}`, title: `${src.title} (Copy)`, status: "draft", createdAt: new Date().toISOString() };
    setExperiments((prev) => [...prev, dup]);
    logAction("Duplicate experiment", src.title);
  }, [experiments, logAction]);

  const activateExperiment = useCallback((id: string) => {
    setExperiments((prev) => prev.map((e) => e.id === id ? { ...e, status: "active" as const } : e));
    setActiveExperimentId(id);
    logAction("Activate experiment", id);
  }, [logAction]);

  const pauseExperiment = useCallback((id: string) => {
    setExperiments((prev) => prev.map((e) => e.id === id ? { ...e, status: "paused" as const } : e));
    logAction("Pause experiment", id);
  }, [logAction]);

  const endExperiment = useCallback((id: string) => {
    setExperiments((prev) => prev.map((e) => e.id === id ? { ...e, status: "ended" as const } : e));
    if (activeExperimentId === id) setActiveExperimentId(null);
    logAction("End experiment", id);
  }, [activeExperimentId, logAction]);

  const archiveExperiment = useCallback((id: string) => {
    setExperiments((prev) => prev.map((e) => e.id === id ? { ...e, status: "archived" as const } : e));
    if (activeExperimentId === id) setActiveExperimentId(null);
    logAction("Archive experiment", id);
  }, [activeExperimentId, logAction]);

  const setActiveExperiment = useCallback((id: string | null) => {
    setActiveExperimentId(id);
  }, []);

  // ── Information Asymmetry ───────────────────────────────────────

  const resolveAudience = useCallback(
    (audience: InfoAudience): string[] => {
      const classStudents = students;
      switch (audience.mode) {
        case "everyone":
          return classStudents.map((s) => s.userId);
        case "subgroup":
        case "single":
          return (audience.userIds ?? []).filter((id) =>
            classStudents.some((s) => s.userId === id),
          );
        case "random": {
          const n = Math.max(0, Math.min(audience.randomCount ?? 1, classStudents.length));
          const pool = [...classStudents];
          const picked: string[] = [];
          for (let i = 0; i < n && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            picked.push(pool.splice(idx, 1)[0].userId);
          }
          return picked;
        }
        default:
          return [];
      }
    },
    [students],
  );

  const createInfoPacket = useCallback(
    (input: {
      title: string;
      body: string;
      kind: InfoPacketKind;
      truthLevel: InfoPacketTruthLevel;
      audience: InfoAudience;
      experimentId?: string | null;
      marketId?: string | null;
      scheduledFor?: string | null;
      disclosureToClass?: boolean;
      includeInDebrief?: boolean;
    }): InfoPacket => {
      const id = `pkt-${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();
      const isImmediate = !input.scheduledFor;
      const recipientIds = isImmediate ? resolveAudience(input.audience) : [];

      const packet: InfoPacket = {
        id,
        classroomId: activeClassroomId,
        experimentId: input.experimentId ?? null,
        marketId: input.marketId ?? null,
        title: input.title,
        body: input.body,
        kind: input.kind,
        truthLevel: input.truthLevel,
        disclosureToClass: input.disclosureToClass ?? false,
        includeInDebrief: input.includeInDebrief ?? true,
        audience: input.audience,
        receipts: recipientIds.map((userId) => ({
          userId,
          releasedAt: now,
          openedAt: null,
          acknowledgedAt: null,
        })),
        createdAt: now,
        scheduledFor: input.scheduledFor ?? null,
        releasedAt: isImmediate ? now : null,
        createdBy: "instructor",
      };

      setInfoPackets((prev) => [packet, ...prev]);
      logAction(
        isImmediate ? "Release info packet" : "Schedule info packet",
        `${input.title} → ${input.audience.mode} (${recipientIds.length})`,
      );
      return packet;
    },
    [activeClassroomId, resolveAudience, logAction],
  );

  const releaseInfoPacket = useCallback((packetId: string) => {
    setInfoPackets((prev) =>
      prev.map((p) => {
        if (p.id !== packetId || p.releasedAt) return p;
        const now = new Date().toISOString();
        const recipientIds = resolveAudience(p.audience);
        return {
          ...p,
          releasedAt: now,
          scheduledFor: null,
          receipts: recipientIds.map((userId) => ({
            userId,
            releasedAt: now,
            openedAt: null,
            acknowledgedAt: null,
          })),
        };
      }),
    );
    logAction("Release info packet", packetId);
  }, [resolveAudience, logAction]);

  const deleteInfoPacket = useCallback((packetId: string) => {
    setInfoPackets((prev) => prev.filter((p) => p.id !== packetId));
    logAction("Delete info packet", packetId);
  }, [logAction]);

  const openInfoPacket = useCallback((packetId: string, userId: string) => {
    setInfoPackets((prev) =>
      prev.map((p) => {
        if (p.id !== packetId) return p;
        return {
          ...p,
          receipts: p.receipts.map((r) =>
            r.userId === userId && !r.openedAt
              ? { ...r, openedAt: new Date().toISOString() }
              : r,
          ),
        };
      }),
    );
  }, []);

  const acknowledgeInfoPacket = useCallback((packetId: string, userId: string) => {
    setInfoPackets((prev) =>
      prev.map((p) => {
        if (p.id !== packetId) return p;
        return {
          ...p,
          receipts: p.receipts.map((r) =>
            r.userId === userId
              ? {
                  ...r,
                  openedAt: r.openedAt ?? new Date().toISOString(),
                  acknowledgedAt: r.acknowledgedAt ?? new Date().toISOString(),
                }
              : r,
          ),
        };
      }),
    );
  }, []);

  const getPacketsForUser = useCallback(
    (userId: string) =>
      infoPackets.filter(
        (p) =>
          p.releasedAt != null &&
          p.classroomId === activeClassroomId &&
          p.receipts.some((r) => r.userId === userId),
      ),
    [infoPackets, activeClassroomId],
  );

  const getUnreadPacketCount = useCallback(
    (userId: string) =>
      infoPackets.reduce((count, p) => {
        if (!p.releasedAt || p.classroomId !== activeClassroomId) return count;
        const r = p.receipts.find((x) => x.userId === userId);
        if (r && !r.openedAt) return count + 1;
        return count;
      }, 0),
    [infoPackets, activeClassroomId],
  );

  // Periodically auto-release scheduled packets whose time has come.
  useEffect(() => {
    const tick = () => {
      setInfoPackets((prev) => {
        const now = Date.now();
        let changed = false;
        const next = prev.map((p) => {
          if (
            !p.releasedAt &&
            p.scheduledFor &&
            new Date(p.scheduledFor).getTime() <= now
          ) {
            changed = true;
            const recipientIds = resolveAudience(p.audience);
            const released = new Date().toISOString();
            return {
              ...p,
              releasedAt: released,
              scheduledFor: null,
              receipts: recipientIds.map((userId) => ({
                userId,
                releasedAt: released,
                openedAt: null,
                acknowledgedAt: null,
              })),
            };
          }
          return p;
        });
        return changed ? next : prev;
      });
    };
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, [resolveAudience]);

  // ── Market Manipulation & Ethics Mode ───────────────────────────

  const updateEthicsSettings = useCallback((updates: Partial<EthicsSettings>) => {
    setEthicsSettings((prev) => ({ ...prev, ...updates }));
    logAction("Update ethics settings", Object.keys(updates).join(", "));
  }, [logAction]);

  const injectScenarioEvent = useCallback((input: {
    kind: ScenarioKind;
    marketId: string | null;
    note: string;
    participantIds?: string[];
  }): ScenarioEvent => {
    const ev: ScenarioEvent = {
      id: `scn-${crypto.randomUUID().slice(0, 8)}`,
      classroomId: activeClassroomId,
      kind: input.kind,
      marketId: input.marketId,
      note: input.note,
      participantIds: input.participantIds,
      injectedAt: new Date().toISOString(),
      injectedBy: "instructor",
    };
    setScenarioEvents((prev) => [ev, ...prev]);
    logAction("Inject scenario", `${SCENARIO_LABELS[input.kind]}: ${input.note}`);
    return ev;
  }, [activeClassroomId, logAction]);

  const deleteScenarioEvent = useCallback((id: string) => {
    setScenarioEvents((prev) => prev.filter((e) => e.id !== id));
    logAction("Delete scenario", id);
  }, [logAction]);

  const executeWhaleTrade = useCallback((input: {
    marketId: string;
    outcomeId: string;
    quantity: number;
    type: "BUY" | "SELL";
    asUserId: string;
    note?: string;
  }): Trade | null => {
    const market = markets.find((m) => m.id === input.marketId);
    const trader = students.find((s) => s.userId === input.asUserId);
    if (!market || !trader) return null;
    try {
      const result = executeTrade(market, trader, input.outcomeId, input.quantity, input.type);
      setMarkets((prev) => prev.map((m) => m.id === input.marketId ? { ...m, outcomes: result.updatedOutcomes } : m));
      setStudents((prev) => prev.map((s) => s.userId === input.asUserId ? result.updatedPortfolio : s));
      if (input.asUserId === portfolio.userId) setPortfolio(result.updatedPortfolio);
      setTrades((prev) => [result.trade, ...prev]);
      // Record as scenario event for the debrief.
      const ev: ScenarioEvent = {
        id: `scn-${crypto.randomUUID().slice(0, 8)}`,
        classroomId: activeClassroomId,
        kind: "whale-trade",
        marketId: input.marketId,
        note: input.note ?? `Whale ${input.type} ${input.quantity}× ${result.trade.outcomeName} as ${trader.displayName}`,
        participantIds: [input.asUserId],
        injectedAt: new Date().toISOString(),
        injectedBy: "instructor",
      };
      setScenarioEvents((prev) => [ev, ...prev]);
      logAction("Whale trade", `${trader.displayName} ${input.type} ${input.quantity}× ${result.trade.outcomeName}`);
      return result.trade;
    } catch (e) {
      console.error("Whale trade failed:", e);
      return null;
    }
  }, [markets, students, portfolio.userId, activeClassroomId, logAction]);

  // ── Behavioral Finance Experiments ──────────────────────────────

  const createBiasExperiment = useCallback((input: {
    title: string;
    bias: BiasKind;
    objective?: string;
    marketIds?: string[];
    studentNoticeEnabled?: boolean;
  }): BiasExperiment => {
    const exp: BiasExperiment = {
      id: `bx-${crypto.randomUUID().slice(0, 8)}`,
      classroomId: activeClassroomId,
      title: input.title,
      bias: input.bias,
      objective: input.objective ?? "",
      marketIds: input.marketIds ?? [],
      framing: {},
      studentNoticeEnabled: input.studentNoticeEnabled ?? false,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setBiasExperiments((prev) => [exp, ...prev]);
    logAction("Create bias experiment", `${input.title} (${input.bias})`);
    return exp;
  }, [activeClassroomId, logAction]);

  const updateBiasExperiment = useCallback((id: string, updates: Partial<Omit<BiasExperiment, "id" | "classroomId" | "createdAt">>) => {
    setBiasExperiments((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
    logAction("Update bias experiment", id);
  }, [logAction]);

  const deleteBiasExperiment = useCallback((id: string) => {
    setBiasExperiments((prev) => prev.filter((e) => e.id !== id));
    logAction("Delete bias experiment", id);
  }, [logAction]);

  const setBiasExperimentMarkets = useCallback((id: string, marketIds: string[]) => {
    setBiasExperiments((prev) => prev.map((e) => e.id === id ? { ...e, marketIds } : e));
  }, []);

  const setBiasFraming = useCallback((experimentId: string, marketId: string, framing: BiasFraming) => {
    setBiasExperiments((prev) => prev.map((e) =>
      e.id === experimentId
        ? { ...e, framing: { ...e.framing, [marketId]: framing } }
        : e,
    ));
    logAction("Update bias framing", `${experimentId} → ${marketId}`);
  }, [logAction]);

  const getBiasExperimentsForMarket = useCallback((marketId: string): BiasExperiment[] => {
    return biasExperiments.filter(
      (e) =>
        e.classroomId === activeClassroomId &&
        e.active &&
        e.marketIds.includes(marketId),
    );
  }, [biasExperiments, activeClassroomId]);

  // ── Shock Events ────────────────────────────────────────────────

  const createShockEvent = useCallback((input: {
    kind: ShockKind;
    title: string;
    description: string;
    marketIds?: string[];
    confidence?: ShockConfidence;
    urgency?: ShockUrgency;
    visibility?: ShockVisibility;
    audienceUserIds?: string[];
    truthStatus?: ShockTruth;
    scheduledFor?: string | null;
    releaseNow?: boolean;
    correctsShockId?: string | null;
  }): ShockEvent => {
    const now = new Date().toISOString();
    const ev: ShockEvent = {
      id: `sk-${crypto.randomUUID().slice(0, 8)}`,
      classroomId: activeClassroomId,
      kind: input.kind,
      title: input.title,
      description: input.description,
      marketIds: input.marketIds ?? [],
      confidence: input.confidence ?? "medium",
      urgency: input.urgency ?? "breaking",
      visibility: input.visibility ?? "everyone",
      audienceUserIds: input.audienceUserIds ?? [],
      truthStatus: input.truthStatus ?? "unresolved",
      status: input.releaseNow ? "released" : input.scheduledFor ? "scheduled" : "released",
      scheduledFor: input.scheduledFor ?? null,
      releasedAt: input.releaseNow || !input.scheduledFor ? now : null,
      correctsShockId: input.correctsShockId ?? null,
      createdAt: now,
    };
    setShockEvents((prev) => [ev, ...prev]);
    logAction(
      ev.status === "released" ? "Release shock event" : "Schedule shock event",
      `${SHOCK_LABELS[ev.kind]}: ${ev.title}`,
    );
    return ev;
  }, [activeClassroomId, logAction]);

  const releaseShockEvent = useCallback((id: string) => {
    const now = new Date().toISOString();
    setShockEvents((prev) => prev.map((s) =>
      s.id === id && s.status !== "released"
        ? { ...s, status: "released", releasedAt: now }
        : s,
    ));
    logAction("Release shock event", id);
  }, [logAction]);

  const cancelShockEvent = useCallback((id: string) => {
    setShockEvents((prev) => prev.map((s) =>
      s.id === id ? { ...s, status: "cancelled" } : s,
    ));
    logAction("Cancel shock event", id);
  }, [logAction]);

  const correctShockEvent = useCallback((originalId: string, correction: { title: string; description: string }): ShockEvent | null => {
    let original: ShockEvent | undefined;
    setShockEvents((prev) => {
      original = prev.find((s) => s.id === originalId);
      return prev.map((s) =>
        s.id === originalId ? { ...s, status: "corrected", truthStatus: "false" } : s,
      );
    });
    if (!original) return null;
    const now = new Date().toISOString();
    const corr: ShockEvent = {
      id: `sk-${crypto.randomUUID().slice(0, 8)}`,
      classroomId: original.classroomId,
      kind: "correction",
      title: correction.title,
      description: correction.description,
      marketIds: original.marketIds,
      confidence: "high",
      urgency: "breaking",
      visibility: original.visibility,
      audienceUserIds: original.audienceUserIds,
      truthStatus: "true",
      status: "released",
      scheduledFor: null,
      releasedAt: now,
      correctsShockId: originalId,
      createdAt: now,
    };
    setShockEvents((prev) => [corr, ...prev]);
    logAction("Correct shock event", `${originalId} → ${corr.id}`);
    return corr;
  }, [logAction]);

  const deleteShockEvent = useCallback((id: string) => {
    setShockEvents((prev) => prev.filter((s) => s.id !== id));
    logAction("Delete shock event", id);
  }, [logAction]);

  const updateShockTruthStatus = useCallback((id: string, truthStatus: ShockTruth) => {
    setShockEvents((prev) => prev.map((s) => s.id === id ? { ...s, truthStatus } : s));
    logAction("Update shock truth", `${id} → ${truthStatus}`);
  }, [logAction]);

  // Auto-release scheduled shocks when their time arrives.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setShockEvents((prev) => prev.map((s) => {
        if (s.status === "scheduled" && s.scheduledFor && new Date(s.scheduledFor).getTime() <= now) {
          return { ...s, status: "released", releasedAt: new Date().toISOString() };
        }
        return s;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getShocksForUser = useCallback((userId: string): ShockEvent[] => {
    return shockEvents.filter((s) =>
      s.classroomId === activeClassroomId &&
      s.status === "released" &&
      (s.visibility === "everyone" || s.audienceUserIds.includes(userId)),
    );
  }, [shockEvents, activeClassroomId]);

  // ── Reflection & Debrief ────────────────────────────────────────

  const createReflectionAssignment = useCallback((input: {
    title: string;
    description?: string;
    experimentId?: string | null;
    prompts?: ReflectionPrompt[];
    required?: boolean;
    graded?: boolean;
    visibility?: ReflectionVisibility;
    openImmediately?: boolean;
  }): ReflectionAssignment => {
    const a: ReflectionAssignment = {
      id: `rf-${crypto.randomUUID().slice(0, 8)}`,
      classroomId: activeClassroomId,
      experimentId: input.experimentId ?? null,
      title: input.title,
      description: input.description ?? "",
      prompts: input.prompts ?? [
        { id: crypto.randomUUID(), kind: "open-text", question: "Briefly describe what happened in your trades during this session.", required: true, order: 0 },
        { id: crypto.randomUUID(), kind: "rating-confidence", question: "How confident were you in your decisions overall?", required: false, order: 1 },
        { id: crypto.randomUUID(), kind: "rating-process", question: "How would you rate your decision-making process?", required: false, order: 2 },
        { id: crypto.randomUUID(), kind: "strategy-vs-emotion", question: "Did you mostly follow a strategy or react emotionally?", required: false, order: 3 },
        { id: crypto.randomUUID(), kind: "what-different", question: "What would you do differently next time?", required: false, order: 4 },
      ],
      required: input.required ?? false,
      graded: input.graded ?? false,
      visibility: input.visibility ?? "instructor-only",
      status: input.openImmediately ? "open" : "draft",
      createdAt: new Date().toISOString(),
    };
    setReflectionAssignments((prev) => [a, ...prev]);
    logAction("Create reflection assignment", a.title);
    return a;
  }, [activeClassroomId, logAction]);

  const updateReflectionAssignment = useCallback((id: string, updates: Partial<Omit<ReflectionAssignment, "id" | "classroomId" | "createdAt">>) => {
    setReflectionAssignments((prev) => prev.map((a) => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const deleteReflectionAssignment = useCallback((id: string) => {
    setReflectionAssignments((prev) => prev.filter((a) => a.id !== id));
    setReflectionResponses((prev) => prev.filter((r) => r.assignmentId !== id));
    logAction("Delete reflection assignment", id);
  }, [logAction]);

  const setReflectionStatus = useCallback((id: string, status: ReflectionAssignment["status"]) => {
    setReflectionAssignments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    logAction("Update reflection status", `${id} → ${status}`);
  }, [logAction]);

  const submitReflectionResponse = useCallback((assignmentId: string, answers: ReflectionAnswer[]): ReflectionResponse => {
    const userId = portfolio.userId;
    const now = new Date().toISOString();
    let result: ReflectionResponse;
    setReflectionResponses((prev) => {
      const existing = prev.find((r) => r.assignmentId === assignmentId && r.userId === userId);
      if (existing) {
        result = { ...existing, answers, submittedAt: now };
        return prev.map((r) => r.id === existing.id ? result : r);
      }
      result = {
        id: `rr-${crypto.randomUUID().slice(0, 8)}`,
        assignmentId, userId, answers,
        grade: null, feedback: null, submittedAt: now,
      };
      return [result, ...prev];
    });
    logAction("Submit reflection", assignmentId);
    return result!;
  }, [portfolio.userId, logAction]);

  const gradeReflectionResponse = useCallback((responseId: string, grade: number | null, feedback: string | null) => {
    setReflectionResponses((prev) => prev.map((r) => r.id === responseId ? { ...r, grade, feedback } : r));
    logAction("Grade reflection", responseId);
  }, [logAction]);

  const getReflectionsForUser = useCallback((_userId: string): ReflectionAssignment[] => {
    return reflectionAssignments.filter((a) =>
      a.classroomId === activeClassroomId && a.status !== "draft",
    );
  }, [reflectionAssignments, activeClassroomId]);

  const getReflectionResponse = useCallback((assignmentId: string, userId: string): ReflectionResponse | undefined => {
    return reflectionResponses.find((r) => r.assignmentId === assignmentId && r.userId === userId);
  }, [reflectionResponses]);

  const getReflectionResponses = useCallback((assignmentId: string): ReflectionResponse[] => {
    return reflectionResponses.filter((r) => r.assignmentId === assignmentId);
  }, [reflectionResponses]);

  // ── Discussion Mode ────────────────────────────────────────────

  const updateDiscussionSettings = useCallback((updates: Partial<DiscussionSettings>) => {
    setDiscussionSettings((prev) => ({ ...prev, ...updates }));
    logAction("Update discussion settings", JSON.stringify(updates));
  }, [logAction]);

  const createDiscussionCard = useCallback((input: Omit<DiscussionCard, "id" | "classroomId" | "createdAt" | "pinned" | "saved"> & {
    pinned?: boolean; saved?: boolean;
  }): DiscussionCard => {
    const card: DiscussionCard = {
      id: `dc-${crypto.randomUUID().slice(0, 8)}`,
      classroomId: activeClassroomId,
      dimension: input.dimension,
      marketId: input.marketId,
      whatHappened: input.whatHappened,
      whatTradersDid: input.whatTradersDid,
      howPricesResponded: input.howPricesResponded,
      alternativeStrategy: input.alternativeStrategy,
      keyTakeaway: input.keyTakeaway,
      pinned: input.pinned ?? false,
      saved: input.saved ?? false,
      createdAt: new Date().toISOString(),
    };
    setDiscussionCards((prev) => [card, ...prev]);
    logAction("Create discussion card", input.whatHappened.slice(0, 60));
    return card;
  }, [activeClassroomId, logAction]);

  const updateDiscussionCard = useCallback((id: string, updates: Partial<Omit<DiscussionCard, "id" | "classroomId" | "createdAt">>) => {
    setDiscussionCards((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteDiscussionCard = useCallback((id: string) => {
    setDiscussionCards((prev) => prev.filter((c) => c.id !== id));
    logAction("Delete discussion card", id);
  }, [logAction]);

  const toggleDiscussionCardPin = useCallback((id: string) => {
    setDiscussionCards((prev) => prev.map((c) => c.id === id ? { ...c, pinned: !c.pinned } : c));
  }, []);

  const toggleDiscussionCardSaved = useCallback((id: string) => {
    setDiscussionCards((prev) => prev.map((c) => c.id === id ? { ...c, saved: !c.saved } : c));
  }, []);

  // ── Classroom Scoring ────────────────────────────────────────────

  const updateScoringSettings = useCallback((updates: Partial<ScoringSettings>) => {
    setScoringSettings((prev) => ({ ...prev, ...updates }));
    logAction("Update scoring settings", JSON.stringify(updates));
  }, [logAction]);

  const updateScoringWeights = useCallback((updates: Partial<ScoringWeights>) => {
    setScoringSettings((prev) => ({ ...prev, weights: { ...prev.weights, ...updates } }));
  }, []);

  const updateGradeMap = useCallback((map: ScoringGradeBand[]) => {
    setScoringSettings((prev) => ({ ...prev, gradeMap: map }));
    logAction("Update grade map", `${map.length} bands`);
  }, [logAction]);

  const toggleBadgeEnabled = useCallback((badgeId: ScoringBadgeId) => {
    setScoringSettings((prev) => ({
      ...prev,
      enabledBadges: prev.enabledBadges.includes(badgeId)
        ? prev.enabledBadges.filter((b) => b !== badgeId)
        : [...prev.enabledBadges, badgeId],
    }));
  }, []);

  const getShocksForMarket = useCallback((marketId: string, userId?: string): ShockEvent[] => {
    return shockEvents.filter((s) =>
      s.classroomId === activeClassroomId &&
      s.status === "released" &&
      (s.marketIds.length === 0 || s.marketIds.includes(marketId)) &&
      (!userId || s.visibility === "everyone" || s.audienceUserIds.includes(userId)),
    );
  }, [shockEvents, activeClassroomId]);

  // ── Scenario Library ─────────────────────────────────────────────

  const createScenario = useCallback((input: Omit<Scenario, "id" | "createdAt" | "isArchived" | "lastLaunchedAt" | "launchCount">): Scenario => {
    const scenario: Scenario = {
      ...input,
      id: `scn-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      isArchived: false,
      lastLaunchedAt: null,
      launchCount: 0,
    };
    setScenarios((prev) => [scenario, ...prev]);
    logAction("Create scenario", scenario.title);
    return scenario;
  }, [logAction]);

  const updateScenario = useCallback((id: string, updates: Partial<Omit<Scenario, "id" | "createdAt">>) => {
    setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
    logAction("Update scenario", id);
  }, [logAction]);

  const duplicateScenario = useCallback((id: string): Scenario | null => {
    const src = scenarios.find((s) => s.id === id);
    if (!src) return null;
    const dup: Scenario = {
      ...src,
      id: `scn-${crypto.randomUUID().slice(0, 8)}`,
      title: `${src.title} (Copy)`,
      createdAt: new Date().toISOString(),
      lastLaunchedAt: null,
      launchCount: 0,
      isArchived: false,
    };
    setScenarios((prev) => [dup, ...prev]);
    logAction("Duplicate scenario", src.title);
    return dup;
  }, [scenarios, logAction]);

  const archiveScenario = useCallback((id: string, archived: boolean) => {
    setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, isArchived: archived } : s));
    logAction(archived ? "Archive scenario" : "Unarchive scenario", id);
  }, [logAction]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    logAction("Delete scenario", id);
  }, [logAction]);

  const saveCurrentAsScenario = useCallback((meta: {
    title: string; type: ScenarioType; description: string; learningObjective: string;
    studentInstructions: string; instructorNotes: string; recommendedMinutes: number;
    recommendedDebriefPoints: string[]; tags: string[]; difficulty: ScenarioDifficulty;
  }): Scenario => {
    // Capture current classroom markets as templates.
    const classMarkets = markets.filter((m) => m.classroomId === activeClassroomId);
    const templates: ScenarioMarketTemplate[] = classMarkets.map((m) => ({
      title: m.title,
      league: m.league,
      sport: m.sport,
      description: m.description,
      outcomes: m.outcomes.map((o) => o.name),
      liquidity: m.config.liquidityParameter,
      suggestedStatus: "open",
    }));
    const scenario: Scenario = {
      ...meta,
      id: `scn-${crypto.randomUUID().slice(0, 8)}`,
      marketTemplates: templates,
      experimentScaffold: activeExperimentId
        ? {
            type: experiments.find((e) => e.id === activeExperimentId)?.type ?? "open-simulation",
            objective: experiments.find((e) => e.id === activeExperimentId)?.objective ?? "",
          }
        : null,
      presets: {
        leaderboardVisible: true,
        nameVisibility: "anonymized",
        activeRuleIds: [],
        debriefPrompts: meta.recommendedDebriefPoints.slice(0, 2),
      },
      createdAt: new Date().toISOString(),
      isArchived: false,
      lastLaunchedAt: null,
      launchCount: 0,
    };
    setScenarios((prev) => [scenario, ...prev]);
    logAction("Save scenario from current setup", `${meta.title} (${templates.length} markets)`);
    return scenario;
  }, [markets, activeClassroomId, activeExperimentId, experiments, logAction]);

  const launchScenario = useCallback((id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario || scenario.isArchived) return null;

    // Create markets from templates.
    let marketsCreated = 0;
    for (const tmpl of scenario.marketTemplates) {
      createMarket(
        tmpl.title, tmpl.league, tmpl.sport,
        new Date().toISOString(), tmpl.description, tmpl.outcomes, tmpl.liquidity,
      );
      marketsCreated++;
    }

    // Optional experiment scaffold.
    let experimentId: string | null = null;
    if (scenario.experimentScaffold) {
      const exp = createExperiment({
        classroomId: activeClassroomId,
        title: scenario.title,
        type: scenario.experimentScaffold.type,
        objective: scenario.experimentScaffold.objective,
        instructorNotes: scenario.instructorNotes,
        studentInstructions: scenario.studentInstructions,
        scoringMode: scenario.presets.scoringMode ?? "portfolio-return",
        leaderboardVisible: scenario.presets.leaderboardVisible ?? true,
        nameVisibility: scenario.presets.nameVisibility ?? "anonymized",
        linkedMarketIds: [],
        rules: EXPERIMENT_RULE_PRESETS.map((r) => ({
          ...r,
          enabled: scenario.presets.activeRuleIds?.includes(r.id) ?? false,
        })),
        startDate: null,
        endDate: null,
      });
      experimentId = exp.id;
    }

    // Apply scoring weight overrides.
    if (scenario.presets.scoringWeightOverrides) {
      setScoringSettings((prev) => ({
        ...prev,
        weights: { ...prev.weights, ...scenario.presets.scoringWeightOverrides },
      }));
    }

    // Bump usage stats.
    setScenarios((prev) => prev.map((s) =>
      s.id === id
        ? { ...s, lastLaunchedAt: new Date().toISOString(), launchCount: s.launchCount + 1 }
        : s,
    ));
    logAction("Launch scenario", `${scenario.title} (${marketsCreated} markets)`);
    return { marketsCreated, experimentId };
  }, [scenarios, createMarket, createExperiment, activeClassroomId, logAction]);


  return (
    <MarketContext.Provider
      value={{
        markets, portfolio, trades, getMarket, estimate, validate,
        trade: doTrade, portfolioStats, realizedPnL, getHolding, recentTrades, topMovers,
        classrooms, activeClassroom: classroom, setActiveClassroom, createClassroom, deleteClassroom,
        classroom, students, adminActions, updateClassroom, addStudent, removeStudent,
        createMarket, duplicateMarket, suspendMarket, resumeMarket, settleMarket,
        voidMarket, cancelMarket, postponeMarket, scheduleMarket, editMarket, deleteMarket,
        bulkCreateMarkets, savedTemplates, saveTemplate, deleteTemplate,
        openAllMarkets, closeAllMarkets, pauseAllTrading, resumeAllTrading, batchSettleMarkets,
        adjustBankroll, reverseTrade, recalculateAll, duplicateClassroom,
        resetClassroom, updateStartingBalance,
        getLeaderboard, exportTradeHistory, exportLeaderboard,
        seedDemoData,
        experiments, activeExperiment, createExperiment, updateExperiment, deleteExperiment,
        duplicateExperiment, activateExperiment, pauseExperiment, endExperiment, archiveExperiment,
        setActiveExperiment,
        infoPackets, getPacketsForUser, getUnreadPacketCount,
        createInfoPacket, releaseInfoPacket, deleteInfoPacket,
        openInfoPacket, acknowledgeInfoPacket,
        ethicsSettings, updateEthicsSettings,
        scenarioEvents, injectScenarioEvent, deleteScenarioEvent,
        executeWhaleTrade,
        biasExperiments, createBiasExperiment, updateBiasExperiment,
        deleteBiasExperiment, setBiasExperimentMarkets, setBiasFraming,
        getBiasExperimentsForMarket,
        shockEvents, createShockEvent, releaseShockEvent, cancelShockEvent,
        correctShockEvent, deleteShockEvent, updateShockTruthStatus,
        getShocksForUser, getShocksForMarket,
        reflectionAssignments, reflectionResponses,
        createReflectionAssignment, updateReflectionAssignment, deleteReflectionAssignment,
        setReflectionStatus, submitReflectionResponse, gradeReflectionResponse,
        getReflectionsForUser, getReflectionResponse, getReflectionResponses,
        discussionCards, discussionSettings, updateDiscussionSettings,
        createDiscussionCard, updateDiscussionCard, deleteDiscussionCard,
        toggleDiscussionCardPin, toggleDiscussionCardSaved,
        scoringSettings, updateScoringSettings, updateScoringWeights,
        updateGradeMap, toggleBadgeEnabled,
        scenarios, createScenario, updateScenario, duplicateScenario,
        archiveScenario, deleteScenario, saveCurrentAsScenario, launchScenario,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}
