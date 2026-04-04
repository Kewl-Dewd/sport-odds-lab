import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  type Market,
  type MarketConfig,
  type Trade,
  type UserPortfolio,
  type Holding,
  type Outcome,
  executeTrade,
  estimateTrade,
  validateTrade,
  calculatePortfolioValue,
  marketToEngineConfig,
  DEFAULT_STARTING_CASH,
  DEFAULT_LIQUIDITY,
  DEFAULT_MAX_TRADE_SIZE,
  PRICE_FLOOR,
  PRICE_CEILING,
  type TradeEstimate,
  type TradeValidation,
} from "@/lib/tradingEngine";
import type { PricingEngineType } from "@/lib/pricing";

// ── Classroom Types ────────────────────────────────────────────────

export interface Classroom {
  id: string;
  name: string;
  description: string;
  startingBalance: number;
  createdAt: string;
  isActive: boolean;
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

const defaultConfig = (liq: number): MarketConfig => ({
  engineType: "linear-impact",
  liquidityParameter: liq,
  maxTradeSize: DEFAULT_MAX_TRADE_SIZE,
  priceFloor: PRICE_FLOOR,
  priceCeiling: PRICE_CEILING,
});

const SEED_CLASSROOM: Classroom = {
  id: "class-1",
  name: "Econ 101 — Spring 2026",
  description: "Introduction to prediction markets and probability",
  startingBalance: DEFAULT_STARTING_CASH,
  createdAt: new Date().toISOString(),
  isActive: true,
};

const SEED_MARKETS: Market[] = [
  {
    id: "m1", title: "Lakers vs Celtics", league: "NBA", sport: "Basketball",
    status: "open", startTime: "Tonight, 8:00 PM ET",
    description: "Regular season matchup. Trade on who you think will win.",
    outcomes: [
      { id: "m1-o1", name: "Lakers Win", price: 0.55 },
      { id: "m1-o2", name: "Celtics Win", price: 0.45 },
    ],
    liquidityParameter: 100, config: defaultConfig(100),
    resolvedOutcomeId: null, settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m2", title: "Super Bowl LIX", league: "NFL", sport: "Football",
    status: "open", startTime: "Feb 9, 7:30 PM ET",
    description: "Championship game. Will the Chiefs three-peat?",
    outcomes: [
      { id: "m2-o1", name: "Chiefs Win", price: 0.52 },
      { id: "m2-o2", name: "49ers Win", price: 0.48 },
    ],
    liquidityParameter: 150, config: defaultConfig(150),
    resolvedOutcomeId: null, settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m3", title: "Man City vs Arsenal", league: "Premier League", sport: "Soccer",
    status: "open", startTime: "Sat, 3:00 PM GMT",
    description: "Top of the table clash in the Premier League.",
    outcomes: [
      { id: "m3-o1", name: "Man City", price: 0.42 },
      { id: "m3-o2", name: "Draw", price: 0.26 },
      { id: "m3-o3", name: "Arsenal", price: 0.32 },
    ],
    liquidityParameter: 120, config: defaultConfig(120),
    resolvedOutcomeId: null, settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m4", title: "Wimbledon Final", league: "ATP", sport: "Tennis",
    status: "open", startTime: "Jul 14, 2:00 PM BST",
    description: "Men's singles final at the All England Club.",
    outcomes: [
      { id: "m4-o1", name: "Djokovic", price: 0.53 },
      { id: "m4-o2", name: "Alcaraz", price: 0.47 },
    ],
    liquidityParameter: 80, config: defaultConfig(80),
    resolvedOutcomeId: null, settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m5", title: "World Series Game 7", league: "MLB", sport: "Baseball",
    status: "settled", startTime: "Settled",
    description: "The deciding game of the Fall Classic.",
    outcomes: [
      { id: "m5-o1", name: "Yankees", price: 1.0 },
      { id: "m5-o2", name: "Dodgers", price: 0.0 },
    ],
    liquidityParameter: 100, config: defaultConfig(100),
    resolvedOutcomeId: "m5-o1", settlementResult: "Yankees Win",
    createdAt: new Date().toISOString(),
  },
  {
    id: "m6", title: "NBA MVP Award", league: "NBA", sport: "Basketball",
    status: "open", startTime: "Jun 2026",
    description: "Who will be named the 2025-26 NBA Most Valuable Player?",
    outcomes: [
      { id: "m6-o1", name: "Luka Dončić", price: 0.28 },
      { id: "m6-o2", name: "Nikola Jokić", price: 0.24 },
      { id: "m6-o3", name: "Jayson Tatum", price: 0.18 },
      { id: "m6-o4", name: "Giannis Antetokounmpo", price: 0.15 },
      { id: "m6-o5", name: "Shai Gilgeous-Alexander", price: 0.15 },
    ],
    liquidityParameter: 180, config: defaultConfig(180),
    resolvedOutcomeId: null, settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m7", title: "Champions League Winner", league: "UEFA", sport: "Soccer",
    status: "open", startTime: "May 31, 2026",
    description: "Which club will lift the Champions League trophy?",
    outcomes: [
      { id: "m7-o1", name: "Real Madrid", price: 0.22 },
      { id: "m7-o2", name: "Man City", price: 0.18 },
      { id: "m7-o3", name: "Bayern Munich", price: 0.15 },
      { id: "m7-o4", name: "Arsenal", price: 0.13 },
      { id: "m7-o5", name: "Barcelona", price: 0.12 },
      { id: "m7-o6", name: "PSG", price: 0.10 },
      { id: "m7-o7", name: "Field", price: 0.10 },
    ],
    liquidityParameter: 200, config: defaultConfig(200),
    resolvedOutcomeId: null, settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m8", title: "First Scorer — Lakers vs Celtics", league: "NBA", sport: "Basketball",
    status: "open", startTime: "Tonight, 8:00 PM ET",
    description: "Which player will score the first basket tonight?",
    outcomes: [
      { id: "m8-o1", name: "LeBron James", price: 0.22 },
      { id: "m8-o2", name: "Anthony Davis", price: 0.20 },
      { id: "m8-o3", name: "Jaylen Brown", price: 0.18 },
      { id: "m8-o4", name: "Derrick White", price: 0.15 },
      { id: "m8-o5", name: "Other", price: 0.25 },
    ],
    liquidityParameter: 120, config: defaultConfig(120),
    resolvedOutcomeId: null, settlementResult: null,
    createdAt: new Date().toISOString(),
  },
];

// Simulated students for classroom demo
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
  getHolding: (marketId: string, outcomeId: string) => Holding | undefined;
  recentTrades: Trade[];
  topMovers: { marketTitle: string; outcomeName: string; price: number; change: number }[];

  // Classroom
  classroom: Classroom;
  students: UserPortfolio[];
  adminActions: AdminAction[];
  updateClassroom: (updates: Partial<Classroom>) => void;
  addStudent: (name: string) => void;
  removeStudent: (userId: string) => void;

  // Admin market actions
  createMarket: (title: string, league: string, sport: string, startTime: string, description: string, outcomes: string[], liquidity: number, engineType?: PricingEngineType, maxTradeSize?: number, priceFloor?: number, priceCeiling?: number) => void;
  duplicateMarket: (marketId: string) => void;
  suspendMarket: (marketId: string) => void;
  resumeMarket: (marketId: string) => void;
  settleMarket: (marketId: string, winningOutcomeId: string) => void;
  deleteMarket: (marketId: string) => void;

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
  const [markets, setMarkets] = useState<Market[]>(SEED_MARKETS);
  const [portfolio, setPortfolio] = useState<UserPortfolio>(SEED_STUDENTS[0]);
  const [students, setStudents] = useState<UserPortfolio[]>(SEED_STUDENTS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [classroom, setClassroom] = useState<Classroom>(SEED_CLASSROOM);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [priceChanges, setPriceChanges] = useState<
    Map<string, { marketTitle: string; outcomeName: string; price: number; change: number }>
  >(new Map());

  const logAction = useCallback((action: string, detail: string) => {
    setAdminActions((prev) => [
      { id: crypto.randomUUID(), action, detail, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const getMarket = useCallback((id: string) => markets.find((m) => m.id === id), [markets]);

  const estimate = useCallback(
    (marketId: string, outcomeId: string, quantity: number, type: "BUY" | "SELL") => {
      const market = markets.find((m) => m.id === marketId);
      if (!market || quantity <= 0) return null;
      try {
        return estimateTrade(market.outcomes, outcomeId, quantity, type, market.liquidityParameter);
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
    setClassroom((prev) => ({ ...prev, ...updates }));
    logAction("Update classroom", JSON.stringify(updates));
  }, [logAction]);

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
    (title: string, league: string, sport: string, startTime: string, description: string, outcomes: string[], liquidity: number, engineType: PricingEngineType = "linear-impact", maxTradeSize: number = DEFAULT_MAX_TRADE_SIZE, priceFloor: number = PRICE_FLOOR, priceCeiling: number = PRICE_CEILING) => {
      const id = `m-${crypto.randomUUID().slice(0, 8)}`;
      const evenPrice = Math.round((1 / outcomes.length) * 100) / 100;
      const config: MarketConfig = { engineType, liquidityParameter: liquidity, maxTradeSize, priceFloor, priceCeiling };
      const newMarket: Market = {
        id, title, league, sport, status: "open", startTime, description,
        outcomes: outcomes.map((name, i) => ({
          id: `${id}-o${i + 1}`,
          name,
          price: i === 0 ? +(1 - evenPrice * (outcomes.length - 1)).toFixed(2) : evenPrice,
        })),
        liquidityParameter: liquidity,
        config,
        resolvedOutcomeId: null, settlementResult: null,
        createdAt: new Date().toISOString(),
      };
      setMarkets((prev) => [newMarket, ...prev]);
      logAction("Create market", `${title} [${engineType}]`);
    },
    [logAction]
  );

  const duplicateMarket = useCallback((marketId: string) => {
    const source = markets.find((m) => m.id === marketId);
    if (!source) return;
    const id = `m-${crypto.randomUUID().slice(0, 8)}`;
    const evenPrice = Math.round((1 / source.outcomes.length) * 100) / 100;
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
        price: i === 0 ? +(1 - evenPrice * (source.outcomes.length - 1)).toFixed(2) : evenPrice,
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
    const winner = market.outcomes.find((o) => o.id === winningOutcomeId);
    if (!winner) return;

    // Update market status and prices
    setMarkets((prev) => prev.map((m) => {
      if (m.id !== marketId) return m;
      return {
        ...m,
        status: "settled" as const,
        resolvedOutcomeId: winningOutcomeId,
        settlementResult: winner.name,
        outcomes: m.outcomes.map((o) => ({
          ...o,
          price: o.id === winningOutcomeId ? 1.0 : 0.0,
        })),
      };
    }));

    // Settle portfolios for all students
    setStudents((prev) => prev.map((student) => {
      const relevantHoldings = student.holdings.filter((h) => h.marketId === marketId);
      if (relevantHoldings.length === 0) return student;

      let cashDelta = 0;
      for (const h of relevantHoldings) {
        if (h.outcomeId === winningOutcomeId) {
          cashDelta += h.shares * 1.0; // Winners pay $1/share
        }
        // Losers pay $0
      }

      return {
        ...student,
        cash: Math.round((student.cash + cashDelta) * 10000) / 10000,
        holdings: student.holdings.filter((h) => h.marketId !== marketId),
      };
    }));

    // Also update the current user portfolio
    setPortfolio((prev) => {
      const relevantHoldings = prev.holdings.filter((h) => h.marketId === marketId);
      if (relevantHoldings.length === 0) return prev;
      let cashDelta = 0;
      for (const h of relevantHoldings) {
        if (h.outcomeId === winningOutcomeId) cashDelta += h.shares * 1.0;
      }
      return {
        ...prev,
        cash: Math.round((prev.cash + cashDelta) * 10000) / 10000,
        holdings: prev.holdings.filter((h) => h.marketId !== marketId),
      };
    });

    logAction("Settle market", `${market.title} → ${winner.name}`);
  }, [markets, logAction]);

  const deleteMarket = useCallback((marketId: string) => {
    setMarkets((prev) => prev.filter((m) => m.id !== marketId));
    logAction("Delete market", marketId);
  }, [logAction]);

  // ── Class management ─────────────────────────────────────────────

  const resetClassroom = useCallback(() => {
    const balance = classroom.startingBalance;
    setStudents((prev) => prev.map((s) => ({ ...s, cash: balance, holdings: [] })));
    setPortfolio((prev) => ({ ...prev, cash: balance, holdings: [] }));
    setTrades([]);
    setPriceChanges(new Map());
    // Reset non-settled markets to even prices
    setMarkets((prev) => prev.map((m) => {
      if (m.status === "settled") return m;
      const evenPrice = Math.round((1 / m.outcomes.length) * 100) / 100;
      return {
        ...m,
        status: "open",
        outcomes: m.outcomes.map((o, i) => ({
          ...o,
          price: i === 0 ? +(1 - evenPrice * (m.outcomes.length - 1)).toFixed(2) : evenPrice,
        })),
      };
    }));
    logAction("Reset classroom", `All data reset, balance: $${balance}`);
  }, [classroom.startingBalance, logAction]);

  const updateStartingBalance = useCallback((amount: number) => {
    setClassroom((prev) => ({ ...prev, startingBalance: amount }));
    logAction("Update starting balance", `$${amount}`);
  }, [logAction]);

  // ── Leaderboard ──────────────────────────────────────────────────

  const getLeaderboard = useCallback((mode: LeaderboardMode): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = students.map((s) => {
      const stats = calculatePortfolioValue(s, markets);
      const userTrades = trades.filter((t) => t.userId === s.userId);
      const startBal = classroom.startingBalance;

      // Count "wins" — trades where the user bought and the price went up
      let winCount = 0;
      let bestPnL = 0;
      let worstPnL = 0;
      for (const t of userTrades) {
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
        tradeCount: userTrades.length,
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
    const { generateSampleStudents, generateSampleTrades } = require("@/lib/demoData");
    const demoStudents = generateSampleStudents(studentCount, classroom.startingBalance);
    const allStudents = [...students, ...demoStudents];
    const result = generateSampleTrades(markets, demoStudents, tradesPerStudent);
    setMarkets(result.updatedMarkets);
    setStudents([...students.map((s) => {
      const updated = result.updatedStudents.find((u: UserPortfolio) => u.userId === s.userId);
      return updated ?? s;
    }), ...result.updatedStudents.filter((u: UserPortfolio) => !students.some((s) => s.userId === u.userId))]);
    setTrades((prev) => [...result.trades, ...prev]);
    logAction("Seed demo data", `${studentCount} students, ${tradesPerStudent} trades each`);
  }, [markets, students, classroom.startingBalance, logAction]);

  return (
    <MarketContext.Provider
      value={{
        markets, portfolio, trades, getMarket, estimate, validate,
        trade: doTrade, portfolioStats, getHolding, recentTrades, topMovers,
        classroom, students, adminActions, updateClassroom, addStudent, removeStudent,
        createMarket, duplicateMarket, suspendMarket, resumeMarket, settleMarket, deleteMarket,
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
