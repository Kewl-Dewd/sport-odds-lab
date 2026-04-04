/**
 * Sports Market Lab — Trading Engine v1
 *
 * Deterministic, formula-based market-maker pricing.
 * No AI, no randomness — pure math.
 *
 * Model: Linear Market Impact with Liquidity Parameter
 * ────────────────────────────────────────────────────
 * When a user buys `q` shares of outcome `i`:
 *   price_impact_i = q / liquidity
 *   new_price_i    = clamp(old_price_i + price_impact_i, 0.01, 0.99)
 *
 * For binary markets (2 outcomes), the other outcome is adjusted so
 * prices sum to 1.00.
 *
 * For multi-outcome markets, the impact is distributed proportionally
 * across all other outcomes.
 *
 * Cost is calculated as the integral under the linear price curve:
 *   cost = q × (old_price + new_price) / 2
 *
 * This module is designed to be swappable — replace with LMSR, CPMM,
 * or any other model by conforming to the same interface.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface Outcome {
  id: string;
  name: string;
  price: number; // 0.01 – 0.99
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
  liquidityParameter: number; // higher = less price movement per share
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
  pricePerShare: number; // average execution price
  totalCost: number;
  priceBeforeTrade: number;
  priceAfterTrade: number;
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

// ── Helpers ────────────────────────────────────────────────────────

export function clampPrice(p: number): number {
  return Math.min(PRICE_CEILING, Math.max(PRICE_FLOOR, p));
}

/** Round to 4 decimal places to avoid floating-point drift */
function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

// ── Price Impact Calculation ───────────────────────────────────────

export interface TradeEstimate {
  /** Average execution price per share */
  avgPrice: number;
  /** Total cost (positive for BUY, negative credit for SELL) */
  totalCost: number;
  /** New prices for ALL outcomes after trade */
  newPrices: { outcomeId: string; price: number }[];
  /** Price of the traded outcome before trade */
  priceBefore: number;
  /** Price of the traded outcome after trade */
  priceAfter: number;
}

/**
 * Estimate the result of a trade WITHOUT mutating state.
 *
 * For a BUY of `quantity` shares on `outcomeId`:
 *   Δprice = quantity / liquidity
 *   The bought outcome rises, others fall proportionally.
 *
 * For a SELL, the direction is reversed.
 */
export function estimateTrade(
  outcomes: Outcome[],
  outcomeId: string,
  quantity: number,
  type: "BUY" | "SELL",
  liquidity: number
): TradeEstimate {
  const direction = type === "BUY" ? 1 : -1;
  const targetIdx = outcomes.findIndex((o) => o.id === outcomeId);
  if (targetIdx === -1) throw new Error("Outcome not found");

  const oldPrice = outcomes[targetIdx].price;
  const rawImpact = (quantity / liquidity) * direction;

  // Compute new price for traded outcome
  const newTargetPrice = clampPrice(round4(oldPrice + rawImpact));
  const actualImpact = newTargetPrice - oldPrice;

  // Distribute the inverse impact across other outcomes
  const otherOutcomes = outcomes.filter((_, i) => i !== targetIdx);
  const otherPriceSum = otherOutcomes.reduce((s, o) => s + o.price, 0);

  const newPrices: { outcomeId: string; price: number }[] = [];

  if (outcomes.length === 2) {
    // Binary market: other = 1 - target
    for (const o of outcomes) {
      if (o.id === outcomeId) {
        newPrices.push({ outcomeId: o.id, price: newTargetPrice });
      } else {
        newPrices.push({
          outcomeId: o.id,
          price: clampPrice(round4(1 - newTargetPrice)),
        });
      }
    }
  } else {
    // Multi-outcome: distribute inverse proportionally
    for (const o of outcomes) {
      if (o.id === outcomeId) {
        newPrices.push({ outcomeId: o.id, price: newTargetPrice });
      } else {
        const weight = otherPriceSum > 0 ? o.price / otherPriceSum : 1 / otherOutcomes.length;
        const adjusted = clampPrice(round4(o.price - actualImpact * weight));
        newPrices.push({ outcomeId: o.id, price: adjusted });
      }
    }
  }

  // Cost = area under linear price curve = quantity × average of old and new price
  const avgPrice = round4((oldPrice + newTargetPrice) / 2);
  const totalCost = round4(quantity * avgPrice);

  return {
    avgPrice: Math.abs(avgPrice),
    totalCost: type === "BUY" ? totalCost : -totalCost,
    newPrices,
    priceBefore: oldPrice,
    priceAfter: newTargetPrice,
  };
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

  if (type === "BUY") {
    const estimate = estimateTrade(
      market.outcomes,
      outcomeId,
      quantity,
      "BUY",
      market.liquidityParameter
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
      return {
        valid: false,
        error: `Cannot sell ${quantity} shares, you own ${owned}`,
      };
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

/**
 * Execute a trade, returning the new state.
 * This is a pure function — it does not mutate inputs.
 */
export function executeTrade(
  market: Market,
  portfolio: UserPortfolio,
  outcomeId: string,
  quantity: number,
  type: "BUY" | "SELL"
): TradeResult {
  const validation = validateTrade(market, portfolio, outcomeId, quantity, type);
  if (!validation.valid) throw new Error(validation.error);

  const estimate = estimateTrade(
    market.outcomes,
    outcomeId,
    quantity,
    type,
    market.liquidityParameter
  );

  // Build updated outcomes
  const updatedOutcomes: Outcome[] = market.outcomes.map((o) => {
    const np = estimate.newPrices.find((p) => p.outcomeId === o.id);
    return { ...o, price: np?.price ?? o.price };
  });

  // Build updated portfolio
  const outcomeName =
    market.outcomes.find((o) => o.id === outcomeId)?.name ?? "";

  let newCash = portfolio.cash;
  if (type === "BUY") {
    newCash = round4(portfolio.cash - estimate.totalCost);
  } else {
    newCash = round4(portfolio.cash + Math.abs(estimate.totalCost));
  }

  // Update holdings
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
    // SELL
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
    timestamp: new Date().toISOString(),
  };

  return {
    trade,
    updatedOutcomes,
    updatedPortfolio: {
      ...portfolio,
      cash: newCash,
      holdings: newHoldings,
    },
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

/** Realized P&L from sells = sum of (sell price - avg cost) × quantity */
export function calculateRealizedPnL(trades: Trade[], holdings: Holding[]): number {
  // For v1 we approximate: sum of all SELL revenue minus proportional cost basis
  // A full implementation would track cost lots; for now we use trade-level data
  return round4(
    trades
      .filter((t) => t.type === "SELL")
      .reduce((sum, t) => sum + (t.pricePerShare - t.priceBeforeTrade) * t.quantity * -1 + t.totalCost, 0)
  );
}
