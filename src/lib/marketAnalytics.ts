/**
 * Market Analytics — Deterministic calculations from trade data.
 * No AI, no simulation — all derived from actual trades and formulas.
 */

import type { Market, Trade, Outcome, UserPortfolio, Holding } from "./tradingEngine";
import { calculatePortfolioValue } from "./tradingEngine";

// ── Price History ──────────────────────────────────────────────────

export interface PricePoint {
  timestamp: string;
  time: number; // ms since epoch for sorting
  prices: Record<string, number>; // outcomeId → price
  volume: number; // trade volume at this point
}

export function buildPriceHistory(market: Market, trades: Trade[]): PricePoint[] {
  const marketTrades = trades
    .filter((t) => t.marketId === market.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (marketTrades.length === 0) return [];

  const points: PricePoint[] = [];

  // Opening prices (before first trade)
  // We infer from the first trade's priceBeforeTrade for the traded outcome
  // For a complete picture, we'd store opening prices; here we approximate
  const firstTrade = marketTrades[0];
  const openingPrices: Record<string, number> = {};
  for (const o of market.outcomes) {
    openingPrices[o.id] = o.price; // will be overwritten as we replay
  }

  // Replay trades to build price series
  let currentPrices = { ...openingPrices };

  // Set opening point using first trade's before-price
  const firstTime = new Date(firstTrade.timestamp).getTime();
  // Reconstruct opening: the traded outcome was at priceBeforeTrade
  currentPrices[firstTrade.outcomeId] = firstTrade.priceBeforeTrade;
  if (market.outcomes.length === 2) {
    const other = market.outcomes.find((o) => o.id !== firstTrade.outcomeId);
    if (other) currentPrices[other.id] = +(1 - firstTrade.priceBeforeTrade).toFixed(4);
  }
  points.push({
    timestamp: new Date(firstTime - 1000).toISOString(),
    time: firstTime - 1000,
    prices: { ...currentPrices },
    volume: 0,
  });

  for (const t of marketTrades) {
    currentPrices[t.outcomeId] = t.priceAfterTrade;
    if (market.outcomes.length === 2) {
      const other = market.outcomes.find((o) => o.id !== t.outcomeId);
      if (other) currentPrices[other.id] = +(1 - t.priceAfterTrade).toFixed(4);
    }
    points.push({
      timestamp: t.timestamp,
      time: new Date(t.timestamp).getTime(),
      prices: { ...currentPrices },
      volume: t.totalCost,
    });
  }

  return points;
}

// ── Market Analytics ───────────────────────────────────────────────

export interface MarketAnalytics {
  totalVolume: number;
  tradeCount: number;
  uniqueTraders: number;
  buyCount: number;
  sellCount: number;
  buyVolume: number;
  sellVolume: number;
  buyPressure: number; // 0-1, ratio of buy volume to total
  activityScore: number; // trades per minute (approx)
  outcomeAnalytics: OutcomeAnalytics[];
}

export interface OutcomeAnalytics {
  outcomeId: string;
  outcomeName: string;
  currentPrice: number;
  openingPrice: number;
  priceChange: number;
  priceChangePct: number;
  volume: number;
  tradeCount: number;
  volatility: number; // std dev of price changes
  high: number;
  low: number;
}

export function calculateMarketAnalytics(market: Market, allTrades: Trade[]): MarketAnalytics {
  const trades = allTrades.filter((t) => t.marketId === market.id);

  const totalVolume = trades.reduce((s, t) => s + t.totalCost, 0);
  const uniqueTraders = new Set(trades.map((t) => t.userId)).size;
  const buys = trades.filter((t) => t.type === "BUY");
  const sells = trades.filter((t) => t.type === "SELL");
  const buyVolume = buys.reduce((s, t) => s + t.totalCost, 0);
  const sellVolume = sells.reduce((s, t) => s + t.totalCost, 0);

  // Activity score: trades per minute over the active period
  let activityScore = 0;
  if (trades.length >= 2) {
    const sorted = trades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const spanMs = new Date(sorted[sorted.length - 1].timestamp).getTime() - new Date(sorted[0].timestamp).getTime();
    const spanMin = Math.max(spanMs / 60000, 1);
    activityScore = Math.round((trades.length / spanMin) * 10) / 10;
  }

  // Per-outcome analytics
  const outcomeAnalytics: OutcomeAnalytics[] = market.outcomes.map((o) => {
    const oTrades = trades.filter((t) => t.outcomeId === o.id);
    const prices = oTrades.map((t) => t.priceAfterTrade);
    const allPrices = oTrades.length > 0
      ? [oTrades[0].priceBeforeTrade, ...prices]
      : [o.price];

    const openingPrice = allPrices[0];
    const currentPrice = o.price;
    const priceChange = currentPrice - openingPrice;
    const priceChangePct = openingPrice > 0 ? (priceChange / openingPrice) * 100 : 0;

    // Volatility: standard deviation of price changes between trades
    let volatility = 0;
    if (prices.length >= 2) {
      const changes: number[] = [];
      for (let i = 1; i < allPrices.length; i++) {
        changes.push(allPrices[i] - allPrices[i - 1]);
      }
      const mean = changes.reduce((s, c) => s + c, 0) / changes.length;
      const variance = changes.reduce((s, c) => s + (c - mean) ** 2, 0) / changes.length;
      volatility = Math.sqrt(variance);
    }

    return {
      outcomeId: o.id,
      outcomeName: o.name,
      currentPrice,
      openingPrice: Math.round(openingPrice * 10000) / 10000,
      priceChange: Math.round(priceChange * 10000) / 10000,
      priceChangePct: Math.round(priceChangePct * 10) / 10,
      volume: oTrades.reduce((s, t) => s + t.totalCost, 0),
      tradeCount: oTrades.length,
      volatility: Math.round(volatility * 10000) / 10000,
      high: Math.max(...allPrices),
      low: Math.min(...allPrices),
    };
  });

  return {
    totalVolume: Math.round(totalVolume * 100) / 100,
    tradeCount: trades.length,
    uniqueTraders,
    buyCount: buys.length,
    sellCount: sells.length,
    buyVolume: Math.round(buyVolume * 100) / 100,
    sellVolume: Math.round(sellVolume * 100) / 100,
    buyPressure: totalVolume > 0 ? Math.round((buyVolume / totalVolume) * 100) / 100 : 0.5,
    activityScore,
    outcomeAnalytics,
  };
}

// ── Portfolio Analytics ────────────────────────────────────────────

export interface PortfolioSnapshot {
  timestamp: string;
  time: number;
  totalValue: number;
  cash: number;
  holdingsValue: number;
}

export function buildPortfolioHistory(
  trades: Trade[],
  startingCash: number
): PortfolioSnapshot[] {
  const userTrades = [...trades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (userTrades.length === 0) return [];

  const snapshots: PortfolioSnapshot[] = [];

  // Starting point
  const firstTime = new Date(userTrades[0].timestamp).getTime();
  snapshots.push({
    timestamp: new Date(firstTime - 1000).toISOString(),
    time: firstTime - 1000,
    totalValue: startingCash,
    cash: startingCash,
    holdingsValue: 0,
  });

  let cash = startingCash;
  // Track holdings as map of outcomeId -> { shares, avgCost }
  const holdings = new Map<string, { shares: number; avgCost: number }>();

  for (const t of userTrades) {
    if (t.type === "BUY") {
      cash -= t.totalCost;
      const existing = holdings.get(t.outcomeId);
      if (existing) {
        const totalShares = existing.shares + t.quantity;
        const totalCost = existing.avgCost * existing.shares + t.totalCost;
        holdings.set(t.outcomeId, { shares: totalShares, avgCost: totalCost / totalShares });
      } else {
        holdings.set(t.outcomeId, { shares: t.quantity, avgCost: t.pricePerShare });
      }
    } else {
      cash += t.totalCost;
      const existing = holdings.get(t.outcomeId);
      if (existing) {
        const remaining = existing.shares - t.quantity;
        if (remaining <= 0) {
          holdings.delete(t.outcomeId);
        } else {
          holdings.set(t.outcomeId, { ...existing, shares: remaining });
        }
      }
    }

    // Mark to market using priceAfterTrade as best available for the traded outcome
    let holdingsValue = 0;
    holdings.forEach((h, outcomeId) => {
      // Use the last known price for this outcome
      // For the outcome just traded, use priceAfterTrade
      if (outcomeId === t.outcomeId) {
        holdingsValue += h.shares * t.priceAfterTrade;
      } else {
        holdingsValue += h.shares * h.avgCost; // approximation for non-traded outcomes
      }
    });

    snapshots.push({
      timestamp: t.timestamp,
      time: new Date(t.timestamp).getTime(),
      totalValue: Math.round((cash + holdingsValue) * 100) / 100,
      cash: Math.round(cash * 100) / 100,
      holdingsValue: Math.round(holdingsValue * 100) / 100,
    });
  }

  return snapshots;
}

export interface PositionAnalysis {
  outcomeId: string;
  marketTitle: string;
  outcomeName: string;
  shares: number;
  costBasis: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
}

export function analyzePositions(
  holdings: Holding[],
  markets: Market[]
): PositionAnalysis[] {
  return holdings.map((h) => {
    const market = markets.find((m) => m.id === h.marketId);
    const outcome = market?.outcomes.find((o) => o.id === h.outcomeId);
    const currentPrice = outcome?.price ?? 0;
    const costBasis = h.shares * h.avgCostPerShare;
    const currentValue = h.shares * currentPrice;
    const pnl = currentValue - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return {
      outcomeId: h.outcomeId,
      marketTitle: h.marketTitle,
      outcomeName: h.outcomeName,
      shares: h.shares,
      costBasis: Math.round(costBasis * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 10) / 10,
    };
  }).sort((a, b) => b.pnl - a.pnl);
}

/** Slippage = how much worse the avg execution price is vs. the current price */
export function calculateSlippage(currentPrice: number, avgExecutionPrice: number, type: "BUY" | "SELL"): number {
  if (type === "BUY") {
    return Math.max(0, avgExecutionPrice - currentPrice);
  } else {
    return Math.max(0, currentPrice - avgExecutionPrice);
  }
}
