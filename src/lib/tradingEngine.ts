/**
 * Sports Market Lab — Trading Engine
 *
 * Single source of truth for all trade validation, execution,
 * portfolio math, and settlement logic.
 *
 * Delegates pricing math to pluggable PricingEngine implementations.
 */

import { getEngine, type PricingEngineConfig, type TradeEstimateResult, type PricingEngineType, DEFAULT_ENGINE_CONFIG } from "./pricing";

// ── Types ──────────────────────────────────────────────────────────

export interface Outcome {
  id: string;
  name: string;
  price: number; // 0.01 – 0.99
}

export interface MarketConfig {
  engineType: PricingEngineType;
  liquidityParameter: number;
  maxTradeSize: number;
  priceFloor: number;
  priceCeiling: number;
  transactionFeePct: number;
  spread: number;
}

export type MarketCategory =
  | "game-winner" | "series-winner" | "tournament-winner" | "division-winner"
  | "award-winner" | "first-scorer" | "first-td-scorer" | "playoff-qualification"
  | "over-under" | "head-to-head" | "prop" | "custom";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type MarketDataSource = "manual" | "odds-api";

export interface MarketMetadata {
  category: MarketCategory;
  season?: string;
  eventDate?: string;
  teamNames?: string[];
  playerNames?: string[];
  difficultyLevel: DifficultyLevel;
  instructionalNotes?: string;
  settlementRules?: string;
  templateId?: string;
  /** Where this market originated. Defaults to "manual". */
  dataSource?: MarketDataSource;
  /** Upstream identifier (e.g. odds-api event id) for live-linked markets. */
  externalEventId?: string;
  /** Convenience copies for settlement suggestions. */
  externalSport?: string;
  externalLeague?: string;
}

export interface Market {
  id: string;
  classroomId: string;
  title: string;
  league: string;
  sport: string;
  status: MarketStatus;
  startTime: string;
  closeTime: string | null;
  description: string;
  outcomes: Outcome[];
  config: MarketConfig;
  resolvedOutcomeId: string | null;
  settlementResult: string | null;
  createdAt: string;
  metadata: MarketMetadata;
}

export type MarketStatus = "open" | "scheduled" | "suspended" | "closed" | "settled" | "void" | "cancelled" | "postponed";

/** Statuses where trading is allowed */
export const TRADEABLE_STATUSES: MarketStatus[] = ["open"];
/** Statuses considered terminal (no further status changes expected) */
export const TERMINAL_STATUSES: MarketStatus[] = ["settled", "void", "cancelled"];

export interface Trade {
  id: string;
  userId: string;
  marketId: string;
  outcomeId: string;
  outcomeName: string;
  marketTitle: string;
  type: "BUY" | "SELL";
  quantity: number;
  pricePerShare: number;
  totalCost: number;
  priceBeforeTrade: number;
  priceAfterTrade: number;
  engineType: PricingEngineType;
  timestamp: string;
}

export interface Holding {
  marketId: string;
  marketTitle: string;
  outcomeId: string;
  outcomeName: string;
  shares: number;
  avgCostPerShare: number;
}

export interface UserPortfolio {
  userId: string;
  displayName: string;
  cash: number;
  holdings: Holding[];
}

// ── Constants ──────────────────────────────────────────────────────

export const PRICE_FLOOR = 0.01;
export const PRICE_CEILING = 0.99;
export const DEFAULT_STARTING_CASH = 10_000;
export const DEFAULT_LIQUIDITY = 100;
export const DEFAULT_MAX_TRADE_SIZE = 500;

// ── Helpers ────────────────────────────────────────────────────────

export function clampPrice(p: number): number {
  return Math.min(PRICE_CEILING, Math.max(PRICE_FLOOR, p));
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

/** Build a PricingEngineConfig from a Market's config */
export function marketToEngineConfig(market: Market): PricingEngineConfig {
  return {
    type: market.config.engineType,
    liquidityParameter: market.config.liquidityParameter,
    maxTradeSize: market.config.maxTradeSize,
    priceFloor: market.config.priceFloor,
    priceCeiling: market.config.priceCeiling,
    transactionFeePct: market.config.transactionFeePct,
    spread: market.config.spread,
  };
}

/** Default MarketConfig factory */
export function defaultMarketConfig(liquidity: number = DEFAULT_LIQUIDITY): MarketConfig {
  return {
    engineType: "linear-impact",
    liquidityParameter: liquidity,
    maxTradeSize: DEFAULT_MAX_TRADE_SIZE,
    priceFloor: PRICE_FLOOR,
    priceCeiling: PRICE_CEILING,
    transactionFeePct: 0,
    spread: 0,
  };
}

// ── Re-export TradeEstimate type ──────────────────────────────────

export type { TradeEstimateResult as TradeEstimate };

// ── Price Estimation (delegates to engine) ────────────────────────

export function estimateTrade(
  market: Market,
  outcomeId: string,
  quantity: number,
  type: "BUY" | "SELL"
): TradeEstimateResult {
  const engineConfig = marketToEngineConfig(market);
  const engine = getEngine(engineConfig.type);

  return engine.estimateTrade(
    market.outcomes.map((o) => ({ id: o.id, name: o.name, price: o.price })),
    { outcomeId, quantity, type },
    engineConfig
  );
}

// ── Trade Validation ───────────────────────────────────────────────

export interface TradeValidation {
  valid: boolean;
  error?: string;
}

export function validateTrade(
  market: Market,
  portfolio: UserPortfolio,
  outcomeId: string,
  quantity: number,
  type: "BUY" | "SELL"
): TradeValidation {
  if (market.status !== "open") {
    return { valid: false, error: "Market is not open for trading" };
  }

  if (quantity <= 0 || !Number.isFinite(quantity)) {
    return { valid: false, error: "Quantity must be a positive number" };
  }

  // Engine-specific size validation
  const engineConfig = marketToEngineConfig(market);
  const engine = getEngine(engineConfig.type);
  const sizeCheck = engine.validateTradeSize(quantity, engineConfig);
  if (!sizeCheck.valid) return sizeCheck;

  if (type === "BUY") {
    const est = estimateTrade(market, outcomeId, quantity, "BUY");
    if (est.totalCost > portfolio.cash) {
      return {
        valid: false,
        error: `Insufficient cash. Need $${est.totalCost.toFixed(2)}, have $${portfolio.cash.toFixed(2)}`,
      };
    }
  }

  if (type === "SELL") {
    const holding = portfolio.holdings.find(
      (h) => h.marketId === market.id && h.outcomeId === outcomeId
    );
    const owned = holding?.shares ?? 0;
    if (quantity > owned) {
      return { valid: false, error: `Cannot sell ${quantity} shares, you own ${owned}` };
    }
  }

  return { valid: true };
}

// ── Execute Trade ──────────────────────────────────────────────────

export interface TradeResult {
  trade: Trade;
  updatedOutcomes: Outcome[];
  updatedPortfolio: UserPortfolio;
}

export function executeTrade(
  market: Market,
  portfolio: UserPortfolio,
  outcomeId: string,
  quantity: number,
  type: "BUY" | "SELL"
): TradeResult {
  const validation = validateTrade(market, portfolio, outcomeId, quantity, type);
  if (!validation.valid) throw new Error(validation.error);

  const estimate = estimateTrade(market, outcomeId, quantity, type);

  const updatedOutcomes: Outcome[] = market.outcomes.map((o) => {
    const np = estimate.newPrices.find((p) => p.outcomeId === o.id);
    return { ...o, price: np?.price ?? o.price };
  });

  const outcomeName = market.outcomes.find((o) => o.id === outcomeId)?.name ?? "";

  let newCash = portfolio.cash;
  if (type === "BUY") {
    newCash = round4(portfolio.cash - estimate.totalCost);
  } else {
    newCash = round4(portfolio.cash + Math.abs(estimate.totalCost));
  }

  const existingIdx = portfolio.holdings.findIndex(
    (h) => h.marketId === market.id && h.outcomeId === outcomeId
  );
  const newHoldings = [...portfolio.holdings];

  if (type === "BUY") {
    if (existingIdx >= 0) {
      const old = newHoldings[existingIdx];
      const totalShares = old.shares + quantity;
      const totalCostBasis = old.avgCostPerShare * old.shares + estimate.totalCost;
      newHoldings[existingIdx] = {
        ...old,
        shares: totalShares,
        avgCostPerShare: round4(totalCostBasis / totalShares),
      };
    } else {
      newHoldings.push({
        marketId: market.id,
        marketTitle: market.title,
        outcomeId,
        outcomeName,
        shares: quantity,
        avgCostPerShare: estimate.avgPrice,
      });
    }
  } else {
    if (existingIdx >= 0) {
      const old = newHoldings[existingIdx];
      const remaining = old.shares - quantity;
      if (remaining <= 0) {
        newHoldings.splice(existingIdx, 1);
      } else {
        newHoldings[existingIdx] = { ...old, shares: remaining };
      }
    }
  }

  const engineConfig = marketToEngineConfig(market);

  const trade: Trade = {
    id: crypto.randomUUID(),
    userId: portfolio.userId,
    marketId: market.id,
    outcomeId,
    outcomeName,
    marketTitle: market.title,
    type,
    quantity,
    pricePerShare: estimate.avgPrice,
    totalCost: Math.abs(estimate.totalCost),
    priceBeforeTrade: estimate.priceBefore,
    priceAfterTrade: estimate.priceAfter,
    engineType: engineConfig.type,
    timestamp: new Date().toISOString(),
  };

  return {
    trade,
    updatedOutcomes,
    updatedPortfolio: { ...portfolio, cash: newCash, holdings: newHoldings },
  };
}

// ── Settlement ─────────────────────────────────────────────────────

export interface SettlementPayout {
  userId: string;
  cashDelta: number;
}

/**
 * Settle a market: uses the engine's settleMarket for price finalization,
 * then calculates payouts for all affected portfolios.
 */
export function settleMarketForPortfolios(
  market: Market,
  winningOutcomeId: string,
  portfolios: UserPortfolio[]
): {
  settledMarket: Market;
  updatedPortfolios: UserPortfolio[];
  payouts: SettlementPayout[];
} {
  const engineConfig = marketToEngineConfig(market);
  const engine = getEngine(engineConfig.type);
  const result = engine.settleMarket(
    market.outcomes.map((o) => ({ id: o.id, name: o.name, price: o.price })),
    winningOutcomeId,
    engineConfig
  );

  const winner = market.outcomes.find((o) => o.id === winningOutcomeId);

  const settledMarket: Market = {
    ...market,
    status: "settled",
    resolvedOutcomeId: winningOutcomeId,
    settlementResult: winner?.name ?? null,
    outcomes: market.outcomes.map((o) => {
      const fp = result.finalPrices.find((p) => p.outcomeId === o.id);
      return { ...o, price: fp?.price ?? o.price };
    }),
  };

  const payouts: SettlementPayout[] = [];
  const updatedPortfolios = portfolios.map((portfolio) => {
    const relevantHoldings = portfolio.holdings.filter((h) => h.marketId === market.id);
    if (relevantHoldings.length === 0) return portfolio;

    let cashDelta = 0;
    for (const h of relevantHoldings) {
      if (h.outcomeId === winningOutcomeId) {
        cashDelta += h.shares * result.payoutPerShare;
      }
    }

    payouts.push({ userId: portfolio.userId, cashDelta });

    return {
      ...portfolio,
      cash: round4(portfolio.cash + cashDelta),
      holdings: portfolio.holdings.filter((h) => h.marketId !== market.id),
    };
  });

  return { settledMarket, updatedPortfolios, payouts };
}

/**
 * Void a market — return all capital at cost basis.
 * Each student gets back what they spent on their current holdings.
 */
export function voidMarketForPortfolios(
  market: Market,
  portfolios: UserPortfolio[],
  rule: "return-cost" | "return-current-value" = "return-cost",
): {
  voidedMarket: Market;
  updatedPortfolios: UserPortfolio[];
} {
  const voidedMarket: Market = {
    ...market,
    status: "void" as MarketStatus,
    resolvedOutcomeId: null,
    settlementResult: "VOID",
  };

  const updatedPortfolios = portfolios.map((portfolio) => {
    const relevantHoldings = portfolio.holdings.filter((h) => h.marketId === market.id);
    if (relevantHoldings.length === 0) return portfolio;

    let cashReturn = 0;
    for (const h of relevantHoldings) {
      if (rule === "return-cost") {
        cashReturn += h.shares * h.avgCostPerShare;
      } else {
        const outcome = market.outcomes.find((o) => o.id === h.outcomeId);
        cashReturn += h.shares * (outcome?.price ?? h.avgCostPerShare);
      }
    }

    return {
      ...portfolio,
      cash: round4(portfolio.cash + cashReturn),
      holdings: portfolio.holdings.filter((h) => h.marketId !== market.id),
    };
  });

  return { voidedMarket, updatedPortfolios };
}

/**
 * Cancel a market — identical to void with return-cost rule.
 */
export function cancelMarketForPortfolios(
  market: Market,
  portfolios: UserPortfolio[],
): {
  cancelledMarket: Market;
  updatedPortfolios: UserPortfolio[];
} {
  const { voidedMarket, updatedPortfolios } = voidMarketForPortfolios(market, portfolios, "return-cost");
  return {
    cancelledMarket: { ...voidedMarket, status: "cancelled" as MarketStatus, settlementResult: "CANCELLED" },
    updatedPortfolios,
  };
}

// ── Portfolio Calculations ─────────────────────────────────────────

export function calculatePortfolioValue(
  portfolio: UserPortfolio,
  markets: Market[]
): {
  cash: number;
  holdingsValue: number;
  totalValue: number;
  unrealizedPnL: number;
} {
  let holdingsValue = 0;
  let totalCostBasis = 0;

  for (const holding of portfolio.holdings) {
    const market = markets.find((m) => m.id === holding.marketId);
    if (!market) continue;
    const outcome = market.outcomes.find((o) => o.id === holding.outcomeId);
    if (!outcome) continue;

    holdingsValue += holding.shares * outcome.price;
    totalCostBasis += holding.shares * holding.avgCostPerShare;
  }

  return {
    cash: portfolio.cash,
    holdingsValue: round4(holdingsValue),
    totalValue: round4(portfolio.cash + holdingsValue),
    unrealizedPnL: round4(holdingsValue - totalCostBasis),
  };
}

/**
 * Calculate realized P&L from sell trades.
 * Realized = sum of (sell price - avg cost) × quantity for all sells.
 */
export function calculateRealizedPnL(trades: Trade[]): number {
  return round4(
    trades
      .filter((t) => t.type === "SELL")
      .reduce((sum, t) => sum + t.totalCost - t.quantity * t.priceBeforeTrade, 0)
  );
}

/**
 * Even price distribution for N outcomes, ensuring sum ≈ 1.0.
 * First outcome absorbs rounding remainder.
 */
export function evenPriceDistribution(outcomeCount: number): number[] {
  const evenPrice = Math.round((1 / outcomeCount) * 100) / 100;
  return Array.from({ length: outcomeCount }, (_, i) =>
    i === 0 ? +(1 - evenPrice * (outcomeCount - 1)).toFixed(2) : evenPrice
  );
}
