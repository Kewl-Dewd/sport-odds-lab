import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  type Market,
  type MarketConfig,
  type MarketMetadata,
  type MarketCategory,
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
  estimateTrade,
  validateTrade,
  calculatePortfolioValue,
  calculateRealizedPnL,
  settleMarketForPortfolios,
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

export type LeaderboardMode = "portfolio" | "return" | "accuracy" | "activity";

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
    ["Lakers Win", "Celtics Win"], 100),
  makeMarket("m2", "Super Bowl LIX", "NFL", "Football",
    "Feb 9, 7:30 PM ET", "Championship game. Will the Chiefs three-peat?",
    ["Chiefs Win", "49ers Win"], 150),
  makeMarket("m3", "Man City vs Arsenal", "Premier League", "Soccer",
    "Sat, 3:00 PM GMT", "Top of the table clash in the Premier League.",
    ["Man City", "Draw", "Arsenal"], 120),
  makeMarket("m4", "Wimbledon Final", "ATP", "Tennis",
    "Jul 14, 2:00 PM BST", "Men's singles final at the All England Club.",
    ["Djokovic", "Alcaraz"], 80),
  makeMarket("m5", "World Series Game 7", "MLB", "Baseball",
    "Settled", "The deciding game of the Fall Classic.",
    ["Yankees", "Dodgers"], 100, "settled", "m5-o1", "Yankees"),
  makeMarket("m6", "NBA MVP Award", "NBA", "Basketball",
    "Jun 2026", "Who will be named the 2025-26 NBA Most Valuable Player?",
    ["Luka Dončić", "Nikola Jokić", "Jayson Tatum", "Giannis Antetokounmpo", "Shai Gilgeous-Alexander"], 180),
  makeMarket("m7", "Champions League Winner", "UEFA", "Soccer",
    "May 31, 2026", "Which club will lift the Champions League trophy?",
    ["Real Madrid", "Man City", "Bayern Munich", "Arsenal", "Barcelona", "PSG", "Field"], 200),
  makeMarket("m8", "First Scorer — Lakers vs Celtics", "NBA", "Basketball",
    "Tonight, 8:00 PM ET", "Which player will score the first basket tonight?",
    ["LeBron James", "Anthony Davis", "Jaylen Brown", "Derrick White", "Other"], 120),
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
  createMarket: (title: string, league: string, sport: string, startTime: string, description: string, outcomes: string[], liquidity: number, engineType?: PricingEngineType, maxTradeSize?: number, priceFloor?: number, priceCeiling?: number, transactionFeePct?: number, spread?: number) => void;
  duplicateMarket: (marketId: string) => void;
  suspendMarket: (marketId: string) => void;
  resumeMarket: (marketId: string) => void;
  settleMarket: (marketId: string, winningOutcomeId: string) => void;
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
    (title: string, league: string, sport: string, startTime: string, description: string, outcomes: string[], liquidity: number, engineType: PricingEngineType = "linear-impact", maxTradeSize: number = DEFAULT_MAX_TRADE_SIZE, priceFloor: number = PRICE_FLOOR, priceCeiling: number = PRICE_CEILING, transactionFeePct: number = 0, spread: number = 0) => {
      const id = `m-${crypto.randomUUID().slice(0, 8)}`;
      const prices = evenPriceDistribution(outcomes.length);
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
      for (const t of stuTrades) {
        const pnl = t.type === "BUY"
          ? (t.priceAfterTrade - t.pricePerShare) * t.quantity
          : (t.pricePerShare - t.priceBeforeTrade) * t.quantity;
        if (pnl > 0) winCount++;
        if (pnl > bestPnL) bestPnL = pnl;
        if (pnl < worstPnL) worstPnL = pnl;
      }

      return {
        userId: s.userId,
        displayName: s.displayName,
        portfolioValue: stats.totalValue,
        cash: stats.cash,
        returnPct: startBal > 0 ? ((stats.totalValue - startBal) / startBal) * 100 : 0,
        tradeCount: stuTrades.length,
        winCount,
        bestTradePnL: Math.round(bestPnL * 100) / 100,
        worstTradePnL: Math.round(worstPnL * 100) / 100,
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

  return (
    <MarketContext.Provider
      value={{
        markets, portfolio, trades, getMarket, estimate, validate,
        trade: doTrade, portfolioStats, realizedPnL, getHolding, recentTrades, topMovers,
        classrooms, activeClassroom: classroom, setActiveClassroom, createClassroom, deleteClassroom,
        classroom, students, adminActions, updateClassroom, addStudent, removeStudent,
        createMarket, duplicateMarket, suspendMarket, resumeMarket, settleMarket, deleteMarket,
        openAllMarkets, closeAllMarkets, pauseAllTrading, resumeAllTrading, batchSettleMarkets,
        adjustBankroll, reverseTrade, recalculateAll, duplicateClassroom,
        resetClassroom, updateStartingBalance,
        getLeaderboard, exportTradeHistory, exportLeaderboard,
        seedDemoData,
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
