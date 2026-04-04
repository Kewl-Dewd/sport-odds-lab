/**
 * Student Analytics — Deterministic decision-quality and behavioral metrics.
 * All calculations derived from actual trade data and market outcomes.
 * No AI, no fake coaching — factual, measurable analysis only.
 */

import type { Market, Trade, UserPortfolio, Holding } from "./tradingEngine";
import { calculatePortfolioValue } from "./tradingEngine";

// ── Core Student Stats ────────────────────────────────────────────

export interface StudentStats {
  userId: string;
  displayName: string;

  // Activity
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  avgTradeSize: number;
  totalVolume: number;
  marketsTraded: number;

  // P&L
  realizedPnL: number;
  unrealizedPnL: number;
  totalReturn: number;
  totalReturnPct: number;

  // Win/Loss
  winCount: number;
  lossCount: number;
  winRate: number;
  avgWinSize: number;
  avgLossSize: number;
  profitFactor: number; // gross wins / gross losses

  // Decision Quality
  decisionQuality: DecisionQualityMetrics;

  // Risk
  riskMetrics: RiskMetrics;

  // Behavioral
  behavioral: BehavioralMetrics;

  // Strengths/Weaknesses (factual labels)
  strengths: string[];
  weaknesses: string[];
}

export interface DecisionQualityMetrics {
  // Edge: avg difference between purchase price and settlement price for winning trades
  avgEdgeCaptured: number;
  // Did they buy before favorable moves?
  earlyBuyerScore: number; // % of buys where price moved favorably after
  // Did they chase after sharp moves?
  chaseBuyRate: number; // % of buys where price had already moved >10% recently
  // Overconfidence: buying outcomes priced >80%
  overconfidentBuyRate: number;
  // Sold too early: % of sells where price continued to rise after selling
  earlySellRate: number;
  // Held winners to settlement
  heldToSettlementRate: number;
  // Composite score 0-100
  compositeScore: number;
}

export interface RiskMetrics {
  // Concentration: max % of portfolio in single market
  maxConcentration: number;
  // Diversification: number of distinct markets held
  diversificationCount: number;
  // How often all-in (>50% of portfolio in one position)
  allInFrequency: number;
  // Cash utilization
  cashUtilization: number;
  // Max drawdown from peak portfolio value
  maxDrawdown: number;
  maxDrawdownPct: number;
  // Composite risk score 0-100 (higher = better risk management)
  compositeScore: number;
}

export interface BehavioralMetrics {
  // Activity timing
  avgTimeBetweenTrades: number; // minutes
  // Overtrading: more than 2 std devs above class avg trade count
  overtradingIndicator: boolean;
  overtradingScore: number; // 0 = normal, higher = more overtrading
  // Inactivity: fewer than 0.5 std devs of class avg
  inactivityIndicator: boolean;
  inactivityScore: number;
  // Buy high tendency: avg price percentile of buys
  buyHighTendency: number; // 0-1, 1 = always buying at peak
  // Sell low tendency
  sellLowTendency: number;
  // Efficiency: return per trade
  returnPerTrade: number;
}

// ── Calculator ────────────────────────────────────────────────────

export function calculateStudentStats(
  student: UserPortfolio,
  allTrades: Trade[],
  markets: Market[],
  startingBalance: number,
  classTradeCountAvg?: number,
  classTradeCountStd?: number,
): StudentStats {
  const userTrades = allTrades
    .filter((t) => t.userId === student.userId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const buys = userTrades.filter((t) => t.type === "BUY");
  const sells = userTrades.filter((t) => t.type === "SELL");
  const totalVolume = userTrades.reduce((s, t) => s + t.totalCost, 0);
  const avgTradeSize = userTrades.length > 0 ? totalVolume / userTrades.length : 0;
  const marketsTraded = new Set(userTrades.map((t) => t.marketId)).size;

  const portfolioStats = calculatePortfolioValue(student, markets);
  const totalReturn = portfolioStats.totalValue - startingBalance;
  const totalReturnPct = startingBalance > 0 ? (totalReturn / startingBalance) * 100 : 0;

  // Win/Loss from trade-level P&L
  let winCount = 0, lossCount = 0;
  let grossWins = 0, grossLosses = 0;
  const tradePnLs: number[] = [];

  for (const t of userTrades) {
    const pnl = t.type === "BUY"
      ? (t.priceAfterTrade - t.pricePerShare) * t.quantity
      : (t.pricePerShare - t.priceBeforeTrade) * t.quantity;
    tradePnLs.push(pnl);
    if (pnl > 0) { winCount++; grossWins += pnl; }
    if (pnl < 0) { lossCount++; grossLosses += Math.abs(pnl); }
  }

  const winRate = userTrades.length > 0 ? winCount / userTrades.length : 0;
  const avgWinSize = winCount > 0 ? grossWins / winCount : 0;
  const avgLossSize = lossCount > 0 ? grossLosses / lossCount : 0;
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;

  // ── Decision Quality ─────────────────────────────────────────

  // Edge captured: for settled markets, compare buy price to settlement outcome
  const settledMarkets = markets.filter((m) => m.status === "settled");
  let edgeSum = 0, edgeCount = 0;
  let heldToSettlement = 0, settledPositions = 0;

  for (const m of settledMarkets) {
    const winningId = m.resolvedOutcomeId;
    const userMarketTrades = userTrades.filter((t) => t.marketId === m.id);
    if (userMarketTrades.length === 0) continue;

    for (const t of userMarketTrades) {
      if (t.type === "BUY") {
        const settledValue = t.outcomeId === winningId ? 1.0 : 0.0;
        edgeSum += settledValue - t.pricePerShare;
        edgeCount++;
      }
    }

    // Check if held to settlement (has holdings in this market at settle time)
    const netShares = new Map<string, number>();
    for (const t of userMarketTrades) {
      const cur = netShares.get(t.outcomeId) ?? 0;
      netShares.set(t.outcomeId, t.type === "BUY" ? cur + t.quantity : cur - t.quantity);
    }
    for (const [outcomeId, shares] of netShares) {
      if (shares > 0) {
        settledPositions++;
        if (outcomeId === winningId) heldToSettlement++;
      }
    }
  }

  const avgEdgeCaptured = edgeCount > 0 ? r2(edgeSum / edgeCount) : 0;
  const heldToSettlementRate = settledPositions > 0 ? r2(heldToSettlement / settledPositions) : 0;

  // Early buyer: did price move favorably after buy?
  let earlyBuyCount = 0;
  for (const t of buys) {
    if (t.priceAfterTrade > t.pricePerShare) earlyBuyCount++;
  }
  const earlyBuyerScore = buys.length > 0 ? r2(earlyBuyCount / buys.length) : 0;

  // Chase buy: buying after sharp recent move (price already up >10% from where it was)
  let chaseBuyCount = 0;
  for (const t of buys) {
    // Price had already moved up significantly before this trade
    if (t.priceBeforeTrade > 0.6 && t.pricePerShare > t.priceBeforeTrade * 0.95) {
      chaseBuyCount++;
    }
  }
  const chaseBuyRate = buys.length > 0 ? r2(chaseBuyCount / buys.length) : 0;

  // Overconfident: buying outcomes priced >80%
  let overconfidentCount = 0;
  for (const t of buys) {
    if (t.priceBeforeTrade > 0.8) overconfidentCount++;
  }
  const overconfidentBuyRate = buys.length > 0 ? r2(overconfidentCount / buys.length) : 0;

  // Early sell: sold and price continued up after
  let earlySellCount = 0;
  for (const t of sells) {
    if (t.priceAfterTrade > t.pricePerShare) earlySellCount++;
  }
  const earlySellRate = sells.length > 0 ? r2(earlySellCount / sells.length) : 0;

  // Composite decision quality score (0-100)
  const dqScore = Math.round(
    Math.min(100, Math.max(0,
      earlyBuyerScore * 30 +
      (1 - chaseBuyRate) * 20 +
      (1 - overconfidentBuyRate) * 15 +
      (1 - earlySellRate) * 15 +
      heldToSettlementRate * 10 +
      Math.min(1, avgEdgeCaptured + 0.5) * 10
    ))
  );

  const decisionQuality: DecisionQualityMetrics = {
    avgEdgeCaptured,
    earlyBuyerScore,
    chaseBuyRate,
    overconfidentBuyRate,
    earlySellRate,
    heldToSettlementRate,
    compositeScore: dqScore,
  };

  // ── Risk Metrics ────────────────────────────────────────────

  // Concentration
  const holdingsByMarket = new Map<string, number>();
  for (const h of student.holdings) {
    const market = markets.find((m) => m.id === h.marketId);
    const outcome = market?.outcomes.find((o) => o.id === h.outcomeId);
    const value = h.shares * (outcome?.price ?? 0);
    holdingsByMarket.set(h.marketId, (holdingsByMarket.get(h.marketId) ?? 0) + value);
  }

  const maxHoldingValue = Math.max(0, ...Array.from(holdingsByMarket.values()));
  const maxConcentration = portfolioStats.totalValue > 0 ? r2(maxHoldingValue / portfolioStats.totalValue) : 0;
  const diversificationCount = holdingsByMarket.size;
  const cashUtilization = portfolioStats.totalValue > 0 ? r2(portfolioStats.holdingsValue / portfolioStats.totalValue) : 0;

  // All-in frequency: count trades where >50% of current cash was spent
  let allInCount = 0;
  let runningCash = startingBalance;
  for (const t of userTrades) {
    if (t.type === "BUY" && t.totalCost > runningCash * 0.5) allInCount++;
    runningCash += t.type === "SELL" ? t.totalCost : -t.totalCost;
  }
  const allInFrequency = userTrades.length > 0 ? r2(allInCount / userTrades.length) : 0;

  // Max drawdown from portfolio history
  let peak = startingBalance;
  let maxDD = 0;
  let runningValue = startingBalance;
  let cash = startingBalance;
  const holdingsMap = new Map<string, { shares: number; lastPrice: number }>();

  for (const t of userTrades) {
    if (t.type === "BUY") {
      cash -= t.totalCost;
      const ex = holdingsMap.get(t.outcomeId);
      holdingsMap.set(t.outcomeId, {
        shares: (ex?.shares ?? 0) + t.quantity,
        lastPrice: t.priceAfterTrade,
      });
    } else {
      cash += t.totalCost;
      const ex = holdingsMap.get(t.outcomeId);
      if (ex) {
        const rem = ex.shares - t.quantity;
        if (rem <= 0) holdingsMap.delete(t.outcomeId);
        else holdingsMap.set(t.outcomeId, { ...ex, shares: rem });
      }
    }
    // Update last known price for traded outcome
    const h = holdingsMap.get(t.outcomeId);
    if (h) h.lastPrice = t.priceAfterTrade;

    let hv = 0;
    holdingsMap.forEach((h) => { hv += h.shares * h.lastPrice; });
    runningValue = cash + hv;

    if (runningValue > peak) peak = runningValue;
    const dd = peak - runningValue;
    if (dd > maxDD) maxDD = dd;
  }

  const maxDrawdownPct = peak > 0 ? r2((maxDD / peak) * 100) : 0;

  // Risk composite (higher = better risk management)
  const riskScore = Math.round(
    Math.min(100, Math.max(0,
      (1 - maxConcentration) * 25 +
      Math.min(1, diversificationCount / 5) * 25 +
      (1 - allInFrequency) * 25 +
      (1 - Math.min(1, maxDrawdownPct / 30)) * 25
    ))
  );

  const riskMetrics: RiskMetrics = {
    maxConcentration,
    diversificationCount,
    allInFrequency,
    cashUtilization,
    maxDrawdown: r2(maxDD),
    maxDrawdownPct,
    compositeScore: riskScore,
  };

  // ── Behavioral Metrics ──────────────────────────────────────

  // Avg time between trades
  let avgTimeBetween = 0;
  if (userTrades.length >= 2) {
    const times = userTrades.map((t) => new Date(t.timestamp).getTime());
    const diffs: number[] = [];
    for (let i = 1; i < times.length; i++) diffs.push(times[i] - times[i - 1]);
    avgTimeBetween = r2(diffs.reduce((s, d) => s + d, 0) / diffs.length / 60000);
  }

  // Overtrading / inactivity relative to class
  const classAvg = classTradeCountAvg ?? userTrades.length;
  const classStd = classTradeCountStd ?? 1;
  const zScore = classStd > 0 ? (userTrades.length - classAvg) / classStd : 0;
  const overtradingIndicator = zScore > 2;
  const inactivityIndicator = zScore < -0.5;

  // Buy high tendency: avg percentile of buy price within outcome's historical range
  let buyHighSum = 0;
  for (const t of buys) {
    // Use priceBeforeTrade as proxy for "where is price"
    buyHighSum += t.priceBeforeTrade;
  }
  const buyHighTendency = buys.length > 0 ? r2(buyHighSum / buys.length) : 0;

  let sellLowSum = 0;
  for (const t of sells) {
    sellLowSum += 1 - t.priceBeforeTrade; // low sell = price is low
  }
  const sellLowTendency = sells.length > 0 ? r2(sellLowSum / sells.length) : 0;

  const returnPerTrade = userTrades.length > 0 ? r2(totalReturn / userTrades.length) : 0;

  const behavioral: BehavioralMetrics = {
    avgTimeBetweenTrades: avgTimeBetween,
    overtradingIndicator,
    overtradingScore: r2(Math.max(0, zScore)),
    inactivityIndicator,
    inactivityScore: r2(Math.max(0, -zScore)),
    buyHighTendency,
    sellLowTendency,
    returnPerTrade,
  };

  // ── Strengths / Weaknesses ──────────────────────────────────

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (earlyBuyerScore > 0.6) strengths.push("Good timing — buys before favorable moves");
  if (chaseBuyRate < 0.2) strengths.push("Avoids chasing price spikes");
  if (overconfidentBuyRate < 0.1) strengths.push("Avoids overpriced outcomes");
  if (diversificationCount >= 3) strengths.push("Well-diversified across markets");
  if (maxConcentration < 0.4) strengths.push("Balanced position sizing");
  if (profitFactor > 1.5) strengths.push("Strong profit factor");
  if (winRate > 0.55) strengths.push("Above-average win rate");
  if (maxDrawdownPct < 5) strengths.push("Small maximum drawdown");

  if (earlyBuyerScore < 0.3 && buys.length > 3) weaknesses.push("Often buys after unfavorable price moves");
  if (chaseBuyRate > 0.4) weaknesses.push("Tends to chase momentum");
  if (overconfidentBuyRate > 0.3) weaknesses.push("Frequently buys overpriced outcomes");
  if (earlySellRate > 0.5 && sells.length > 2) weaknesses.push("Sells winning positions too early");
  if (maxConcentration > 0.6) weaknesses.push("Too concentrated in a single market");
  if (allInFrequency > 0.3) weaknesses.push("Frequently makes oversized bets");
  if (overtradingIndicator) weaknesses.push("Trade frequency is well above class average");
  if (inactivityIndicator && userTrades.length < 3) weaknesses.push("Very few trades — limited data for analysis");
  if (maxDrawdownPct > 20) weaknesses.push("Large drawdown experienced");

  return {
    userId: student.userId,
    displayName: student.displayName,
    tradeCount: userTrades.length,
    buyCount: buys.length,
    sellCount: sells.length,
    avgTradeSize: r2(avgTradeSize),
    totalVolume: r2(totalVolume),
    marketsTraded,
    realizedPnL: r2(portfolioStats.totalValue - startingBalance - portfolioStats.unrealizedPnL),
    unrealizedPnL: r2(portfolioStats.unrealizedPnL),
    totalReturn: r2(totalReturn),
    totalReturnPct: r2(totalReturnPct),
    winCount,
    lossCount,
    winRate: r2(winRate),
    avgWinSize: r2(avgWinSize),
    avgLossSize: r2(avgLossSize),
    profitFactor: profitFactor === Infinity ? 999 : r2(profitFactor),
    decisionQuality,
    riskMetrics,
    behavioral,
    strengths,
    weaknesses,
  };
}

// ── Batch: all students ───────────────────────────────────────────

export function calculateAllStudentStats(
  students: UserPortfolio[],
  trades: Trade[],
  markets: Market[],
  startingBalance: number,
): StudentStats[] {
  const tradeCounts = students.map((s) => trades.filter((t) => t.userId === s.userId).length);
  const avg = tradeCounts.length > 0 ? tradeCounts.reduce((s, c) => s + c, 0) / tradeCounts.length : 0;
  const std = tradeCounts.length > 1
    ? Math.sqrt(tradeCounts.reduce((s, c) => s + (c - avg) ** 2, 0) / tradeCounts.length)
    : 1;

  return students.map((s) => calculateStudentStats(s, trades, markets, startingBalance, avg, std));
}

// ── Settled Trade Outcomes ────────────────────────────────────────

export interface SettledTradeOutcome {
  tradeId: string;
  marketTitle: string;
  outcomeName: string;
  type: "BUY" | "SELL";
  quantity: number;
  pricePerShare: number;
  settlementValue: number; // 1.0 if won, 0.0 if lost
  pnlPerShare: number;
  totalPnl: number;
  edgeCaptured: number; // settlement - buy price
}

export function getSettledTradeOutcomes(
  userId: string,
  trades: Trade[],
  markets: Market[],
): SettledTradeOutcome[] {
  const settled = markets.filter((m) => m.status === "settled");
  const results: SettledTradeOutcome[] = [];

  for (const m of settled) {
    const userTrades = trades.filter((t) => t.userId === userId && t.marketId === m.id);
    for (const t of userTrades) {
      const isWinner = t.outcomeId === m.resolvedOutcomeId;
      const settlementValue = isWinner ? 1.0 : 0.0;
      const pnlPerShare = t.type === "BUY"
        ? settlementValue - t.pricePerShare
        : t.pricePerShare - settlementValue;

      results.push({
        tradeId: t.id,
        marketTitle: t.marketTitle,
        outcomeName: t.outcomeName,
        type: t.type,
        quantity: t.quantity,
        pricePerShare: t.pricePerShare,
        settlementValue,
        pnlPerShare: r2(pnlPerShare),
        totalPnl: r2(pnlPerShare * t.quantity),
        edgeCaptured: t.type === "BUY" ? r2(settlementValue - t.pricePerShare) : 0,
      });
    }
  }

  return results;
}

// ── Trade Timing Analysis ─────────────────────────────────────────

export interface TradeTimingEntry {
  tradeId: string;
  timestamp: string;
  marketTitle: string;
  outcomeName: string;
  type: "BUY" | "SELL";
  priceBefore: number;
  priceAfter: number;
  priceMoveFavorable: boolean;
  wasChase: boolean; // bought after sharp move up
  wasOverconfident: boolean; // bought >80% priced outcome
}

export function analyzeTradeTimings(
  userId: string,
  trades: Trade[],
): TradeTimingEntry[] {
  const userTrades = trades
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return userTrades.map((t) => {
    const priceMoveFavorable = t.type === "BUY"
      ? t.priceAfterTrade > t.pricePerShare
      : t.priceAfterTrade < t.pricePerShare;

    return {
      tradeId: t.id,
      timestamp: t.timestamp,
      marketTitle: t.marketTitle,
      outcomeName: t.outcomeName,
      type: t.type,
      priceBefore: t.priceBeforeTrade,
      priceAfter: t.priceAfterTrade,
      priceMoveFavorable,
      wasChase: t.type === "BUY" && t.priceBeforeTrade > 0.6,
      wasOverconfident: t.type === "BUY" && t.priceBeforeTrade > 0.8,
    };
  });
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
