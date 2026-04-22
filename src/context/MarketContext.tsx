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
  type TradeEstimate,
  type TradeValidation,
} from "@/lib/tradingEngine";
import type { PricingEngineType } from "@/lib/pricing";
import { generateSampleStudents, generateSampleTrades } from "@/lib/demoData";

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
}

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [classrooms, setClassrooms] = useState<Classroom[]>(SEED_CLASSROOMS);
  const [activeClassroomId, setActiveClassroomId] = useState(CLASSROOM_ID);
  const [markets, setMarkets] = useState<Market[]>(SEED_MARKETS);
  const [portfolio, setPortfolio] = useState<UserPortfolio>(SEED_STUDENTS[0]);
  const [students, setStudents] = useState<UserPortfolio[]>(SEED_STUDENTS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [priceChanges, setPriceChanges] = useState<
    Map<string, { marketTitle: string; outcomeName: string; price: number; change: number }>
  >(new Map());
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [infoPackets, setInfoPackets] = useState<InfoPacket[]>([]);

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
    setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, status: "suspended" as const } : m));
    logAction("Suspend market", marketId);
  }, [logAction]);

  const resumeMarket = useCallback((marketId: string) => {
    setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, status: "open" as const } : m));
    logAction("Resume market", marketId);
  }, [logAction]);

  const settleMarket = useCallback((marketId: string, winningOutcomeId: string) => {
    const market = markets.find((m) => m.id === marketId);
    if (!market) return;
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
    const { cancelledMarket, updatedPortfolios } = cancelMarketForPortfolios(market, students);
    setMarkets((prev) => prev.map((m) => m.id === marketId ? cancelledMarket : m));
    setStudents(updatedPortfolios);
    const updatedUser = updatedPortfolios.find((p) => p.userId === portfolio.userId);
    if (updatedUser) setPortfolio(updatedUser);
    logAction("Cancel market", market.title);
  }, [markets, students, portfolio.userId, logAction]);

  const postponeMarket = useCallback((marketId: string) => {
    setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, status: "postponed" as const } : m));
    logAction("Postpone market", marketId);
  }, [logAction]);

  const scheduleMarket = useCallback((marketId: string) => {
    setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, status: "scheduled" as const } : m));
    logAction("Schedule market", marketId);
  }, [logAction]);

  const editMarket = useCallback((marketId: string, updates: Partial<Pick<Market, "title" | "league" | "sport" | "startTime" | "closeTime" | "description">>) => {
    setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, ...updates } : m));
    logAction("Edit market", `${marketId}: ${Object.keys(updates).join(", ")}`);
  }, [logAction]);

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
