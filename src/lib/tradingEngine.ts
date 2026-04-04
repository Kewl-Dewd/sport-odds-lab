/**
 * Sports Market Lab — Trading Engine v2
 *
 * Delegates all pricing math to pluggable PricingEngine implementations.
 * This module handles trade validation, execution, and portfolio math.
 * The pricing model itself is swappable per market.
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
}

export interface Market {
  id: string;
  title: string;
  league: string;
  sport: string;
  status: MarketStatus;
  startTime: string;
  description: string;
  outcomes: Outcome[];
  /** @deprecated Use config.liquidityParameter — kept for backward compat */
  liquidityParameter: number;
  config: MarketConfig;
  resolvedOutcomeId: string | null;
  settlementResult: string | null;
  createdAt: string;
}

export type MarketStatus = "open" | "suspended" | "closed" | "settled";

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

/** Build a PricingEngineConfig from a Market */
export function marketToEngineConfig(market: Market): PricingEngineConfig {
  if (market.config) {
    return {
      type: market.config.engineType,
      liquidityParameter: market.config.liquidityParameter,
      maxTradeSize: market.config.maxTradeSize,
      priceFloor: market.config.priceFloor,
      priceCeiling: market.config.priceCeiling,
    };
  }
  // Backward compat for markets without config
  return {
    ...DEFAULT_ENGINE_CONFIG,
    liquidityParameter: market.liquidityParameter,
  };
}

// ── Re-export TradeEstimate type ──────────────────────────────────

export type { TradeEstimateResult as TradeEstimate };

// ── Price Estimation (delegates to engine) ────────────────────────

export function estimateTrade(
  outcomes: Outcome[],
  outcomeId: string,
  quantity: number,
  type: "BUY" | "SELL",
  liquidity: number,
  engineType: PricingEngineType = "linear-impact",
  config?: PricingEngineConfig
): TradeEstimateResult {
  const engine = getEngine(engineType);
  const engineConfig: PricingEngineConfig = config ?? {
    ...DEFAULT_ENGINE_CONFIG,
    type: engineType,
    liquidityParameter: liquidity,
  };

  return engine.estimateTrade(
    outcomes.map((o) => ({ id: o.id, name: o.name, price: o.price })),
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
    const estimate = estimateTrade(
      market.outcomes, outcomeId, quantity, "BUY",
      engineConfig.liquidityParameter, engineConfig.type, engineConfig
    );
    if (estimate.totalCost > portfolio.cash) {
      return {
        valid: false,
        error: `Insufficient cash. Need $${estimate.totalCost.toFixed(2)}, have $${portfolio.cash.toFixed(2)}`,
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

  const engineConfig = marketToEngineConfig(market);
  const estimate = estimateTrade(
    market.outcomes, outcomeId, quantity, type,
    engineConfig.liquidityParameter, engineConfig.type, engineConfig
  );

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

export function calculateRealizedPnL(trades: Trade[], _holdings: Holding[]): number {
  return round4(
    trades
      .filter((t) => t.type === "SELL")
      .reduce((sum, t) => sum + (t.pricePerShare - t.priceBeforeTrade) * t.quantity * -1 + t.totalCost, 0)
  );
}
