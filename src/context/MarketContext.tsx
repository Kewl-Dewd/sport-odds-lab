import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  type Market,
  type Trade,
  type UserPortfolio,
  type Holding,
  type Outcome,
  executeTrade,
  estimateTrade,
  validateTrade,
  calculatePortfolioValue,
  DEFAULT_STARTING_CASH,
  DEFAULT_LIQUIDITY,
  type TradeEstimate,
  type TradeValidation,
} from "@/lib/tradingEngine";

// ── Seed Data ──────────────────────────────────────────────────────

const SEED_MARKETS: Market[] = [
  {
    id: "m1",
    title: "Lakers vs Celtics",
    league: "NBA",
    sport: "Basketball",
    status: "open",
    startTime: "Tonight, 8:00 PM ET",
    description: "Regular season matchup. Trade on who you think will win.",
    outcomes: [
      { id: "m1-o1", name: "Lakers Win", price: 0.55 },
      { id: "m1-o2", name: "Celtics Win", price: 0.45 },
    ],
    liquidityParameter: 100,
    resolvedOutcomeId: null,
    settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m2",
    title: "Super Bowl LIX",
    league: "NFL",
    sport: "Football",
    status: "open",
    startTime: "Feb 9, 7:30 PM ET",
    description: "Championship game. Will the Chiefs three-peat?",
    outcomes: [
      { id: "m2-o1", name: "Chiefs Win", price: 0.52 },
      { id: "m2-o2", name: "49ers Win", price: 0.48 },
    ],
    liquidityParameter: 150,
    resolvedOutcomeId: null,
    settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m3",
    title: "Man City vs Arsenal",
    league: "Premier League",
    sport: "Soccer",
    status: "open",
    startTime: "Sat, 3:00 PM GMT",
    description: "Top of the table clash in the Premier League.",
    outcomes: [
      { id: "m3-o1", name: "Man City", price: 0.42 },
      { id: "m3-o2", name: "Draw", price: 0.26 },
      { id: "m3-o3", name: "Arsenal", price: 0.32 },
    ],
    liquidityParameter: 120,
    resolvedOutcomeId: null,
    settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m4",
    title: "Wimbledon Final",
    league: "ATP",
    sport: "Tennis",
    status: "open",
    startTime: "Jul 14, 2:00 PM BST",
    description: "Men's singles final at the All England Club.",
    outcomes: [
      { id: "m4-o1", name: "Djokovic", price: 0.53 },
      { id: "m4-o2", name: "Alcaraz", price: 0.47 },
    ],
    liquidityParameter: 80,
    resolvedOutcomeId: null,
    settlementResult: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m5",
    title: "World Series Game 7",
    league: "MLB",
    sport: "Baseball",
    status: "settled",
    startTime: "Settled",
    description: "The deciding game of the Fall Classic.",
    outcomes: [
      { id: "m5-o1", name: "Yankees", price: 1.0 },
      { id: "m5-o2", name: "Dodgers", price: 0.0 },
    ],
    liquidityParameter: 100,
    resolvedOutcomeId: "m5-o1",
    settlementResult: "Yankees Win",
    createdAt: new Date().toISOString(),
  },
];

const SEED_PORTFOLIO: UserPortfolio = {
  userId: "user-1",
  displayName: "Demo Trader",
  cash: DEFAULT_STARTING_CASH,
  holdings: [],
};

// ── Context ────────────────────────────────────────────────────────

interface MarketContextValue {
  markets: Market[];
  portfolio: UserPortfolio;
  trades: Trade[];
  getMarket: (id: string) => Market | undefined;
  estimate: (
    marketId: string,
    outcomeId: string,
    quantity: number,
    type: "BUY" | "SELL"
  ) => TradeEstimate | null;
  validate: (
    marketId: string,
    outcomeId: string,
    quantity: number,
    type: "BUY" | "SELL"
  ) => TradeValidation;
  trade: (
    marketId: string,
    outcomeId: string,
    quantity: number,
    type: "BUY" | "SELL"
  ) => Trade | null;
  portfolioStats: ReturnType<typeof calculatePortfolioValue>;
  getHolding: (marketId: string, outcomeId: string) => Holding | undefined;
  recentTrades: Trade[];
  topMovers: { marketTitle: string; outcomeName: string; price: number; change: number }[];
}

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>(SEED_MARKETS);
  const [portfolio, setPortfolio] = useState<UserPortfolio>(SEED_PORTFOLIO);
  const [trades, setTrades] = useState<Trade[]>([]);
  // Track price changes for "top movers"
  const [priceChanges, setPriceChanges] = useState<
    Map<string, { marketTitle: string; outcomeName: string; price: number; change: number }>
  >(new Map());

  const getMarket = useCallback((id: string) => markets.find((m) => m.id === id), [markets]);

  const estimate = useCallback(
    (marketId: string, outcomeId: string, quantity: number, type: "BUY" | "SELL") => {
      const market = markets.find((m) => m.id === marketId);
      if (!market || quantity <= 0) return null;
      try {
        return estimateTrade(market.outcomes, outcomeId, quantity, type, market.liquidityParameter);
      } catch {
        return null;
      }
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

        // Update markets
        setMarkets((prev) =>
          prev.map((m) =>
            m.id === marketId ? { ...m, outcomes: result.updatedOutcomes } : m
          )
        );

        // Update portfolio
        setPortfolio(result.updatedPortfolio);

        // Record trade
        setTrades((prev) => [result.trade, ...prev]);

        // Track price changes for movers
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

  return (
    <MarketContext.Provider
      value={{
        markets,
        portfolio,
        trades,
        getMarket,
        estimate,
        validate,
        trade: doTrade,
        portfolioStats,
        getHolding,
        recentTrades,
        topMovers,
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
