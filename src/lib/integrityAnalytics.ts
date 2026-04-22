/**
 * Market Integrity Analytics — Deterministic detectors for suspicious
 * trading patterns. No AI, no commentary — every flag is derived from
 * measurable activity in the trade ledger so it can support classroom
 * discussion of market manipulation and ethics.
 */

import type { Market, Trade } from "./tradingEngine";

// ── Types ──────────────────────────────────────────────────────────

export type IntegrityFlagKind =
  | "volume-spike"
  | "rapid-price-move"
  | "trader-concentration"
  | "coordinated-direction"
  | "sharp-reversal"
  | "volatility-spike"
  | "whale-trade";

export interface IntegrityFlag {
  id: string;
  kind: IntegrityFlagKind;
  marketId: string;
  marketTitle: string;
  /** ISO timestamp the flagged activity centered on. */
  at: string;
  /** Numeric score the detector produced (interpretation depends on kind). */
  magnitude: number;
  /** Plain-language, factual description of what was measured. */
  detail: string;
  /** Trades involved in this flag, for replay highlighting. */
  tradeIds: string[];
  /** User IDs involved (e.g. concentration / coordination flags). */
  userIds?: string[];
}

export interface MarketIntegrityReport {
  marketId: string;
  marketTitle: string;
  windowMs: number;
  totalTrades: number;
  totalVolume: number;
  flags: IntegrityFlag[];
  /** Concentration: share of total volume by top trader. */
  topTraderShare: number;
  /** Number of distinct traders. */
  uniqueTraders: number;
  /** Maximum |Δprice| seen between two consecutive trades. */
  maxPriceJump: number;
  /** Volume in the busiest WINDOW_MS sliding window. */
  peakWindowVolume: number;
}

// ── Tunables ───────────────────────────────────────────────────────

const WINDOW_MS = 60_000;            // 1-minute rolling window
const VOLUME_SPIKE_MULT = 3.0;       // peak ≥ 3× median window
const PRICE_JUMP_THRESHOLD = 0.08;   // ≥ 8 cents between trades
const VOLATILITY_THRESHOLD = 0.05;   // std dev of price changes
const CONCENTRATION_THRESHOLD = 0.5; // single trader ≥ 50% of volume
const COORDINATION_MIN_TRADES = 4;   // ≥ N consecutive same-direction
const REVERSAL_MIN_DELTA = 0.1;      // burst then reversal of ≥ 10 cents
const WHALE_MULTIPLIER = 5;          // trade ≥ 5× median trade size

// ── Helpers ────────────────────────────────────────────────────────

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((s, v) => s + v, 0) / nums.length;
  const variance =
    nums.reduce((s, v) => s + (v - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

// ── Main analysis ──────────────────────────────────────────────────

export function analyzeMarketIntegrity(
  market: Market,
  allTrades: Trade[],
): MarketIntegrityReport {
  const trades = allTrades
    .filter((t) => t.marketId === market.id)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  const flags: IntegrityFlag[] = [];

  if (trades.length === 0) {
    return {
      marketId: market.id,
      marketTitle: market.title,
      windowMs: WINDOW_MS,
      totalTrades: 0,
      totalVolume: 0,
      flags,
      topTraderShare: 0,
      uniqueTraders: 0,
      maxPriceJump: 0,
      peakWindowVolume: 0,
    };
  }

  const totalVolume = trades.reduce((s, t) => s + t.totalCost, 0);
  const traderVolumes = new Map<string, number>();
  for (const t of trades) {
    traderVolumes.set(
      t.userId,
      (traderVolumes.get(t.userId) ?? 0) + t.totalCost,
    );
  }
  const topTraderEntry = [...traderVolumes.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];
  const topTraderShare =
    totalVolume > 0 ? topTraderEntry[1] / totalVolume : 0;
  const uniqueTraders = traderVolumes.size;

  // ── Trader concentration ─────────────────────────────────────────
  if (topTraderShare >= CONCENTRATION_THRESHOLD && trades.length >= 5) {
    flags.push({
      id: `flg-${crypto.randomUUID().slice(0, 8)}`,
      kind: "trader-concentration",
      marketId: market.id,
      marketTitle: market.title,
      at: trades[trades.length - 1].timestamp,
      magnitude: topTraderShare,
      detail: `One trader accounted for ${(topTraderShare * 100).toFixed(0)}% of $${totalVolume.toFixed(0)} traded across ${uniqueTraders} participants.`,
      tradeIds: trades.filter((t) => t.userId === topTraderEntry[0]).map((t) => t.id),
      userIds: [topTraderEntry[0]],
    });
  }

  // ── Whale trades ─────────────────────────────────────────────────
  const med = median(trades.map((t) => t.totalCost));
  for (const t of trades) {
    if (med > 0 && t.totalCost >= med * WHALE_MULTIPLIER && t.totalCost > 100) {
      flags.push({
        id: `flg-${crypto.randomUUID().slice(0, 8)}`,
        kind: "whale-trade",
        marketId: market.id,
        marketTitle: market.title,
        at: t.timestamp,
        magnitude: t.totalCost / med,
        detail: `Single $${t.totalCost.toFixed(0)} ${t.type} (${t.quantity} shares of "${t.outcomeName}") — ${(t.totalCost / med).toFixed(1)}× the median trade in this market.`,
        tradeIds: [t.id],
        userIds: [t.userId],
      });
    }
  }

  // ── Rapid price moves between consecutive trades ─────────────────
  let maxJump = 0;
  for (let i = 1; i < trades.length; i++) {
    const a = trades[i - 1];
    const b = trades[i];
    if (a.outcomeId !== b.outcomeId) continue;
    const jump = Math.abs(b.priceAfterTrade - a.priceAfterTrade);
    if (jump > maxJump) maxJump = jump;
    if (jump >= PRICE_JUMP_THRESHOLD) {
      flags.push({
        id: `flg-${crypto.randomUUID().slice(0, 8)}`,
        kind: "rapid-price-move",
        marketId: market.id,
        marketTitle: market.title,
        at: b.timestamp,
        magnitude: jump,
        detail: `Price of "${b.outcomeName}" moved ${(jump * 100).toFixed(1)}¢ in a single trade.`,
        tradeIds: [a.id, b.id],
      });
    }
  }

  // ── Rolling-window volume spike ──────────────────────────────────
  const windowVols: number[] = [];
  let peakWindow = 0;
  let peakWindowAt = trades[0].timestamp;
  let peakWindowTrades: Trade[] = [];
  for (let i = 0; i < trades.length; i++) {
    const start = new Date(trades[i].timestamp).getTime();
    const inWindow = trades.filter((t) => {
      const ts = new Date(t.timestamp).getTime();
      return ts >= start && ts < start + WINDOW_MS;
    });
    const vol = inWindow.reduce((s, t) => s + t.totalCost, 0);
    windowVols.push(vol);
    if (vol > peakWindow) {
      peakWindow = vol;
      peakWindowAt = trades[i].timestamp;
      peakWindowTrades = inWindow;
    }
  }
  const medWindow = median(windowVols.filter((v) => v > 0));
  if (
    medWindow > 0 &&
    peakWindow >= medWindow * VOLUME_SPIKE_MULT &&
    peakWindowTrades.length >= 3
  ) {
    flags.push({
      id: `flg-${crypto.randomUUID().slice(0, 8)}`,
      kind: "volume-spike",
      marketId: market.id,
      marketTitle: market.title,
      at: peakWindowAt,
      magnitude: peakWindow / medWindow,
      detail: `$${peakWindow.toFixed(0)} traded in 60s — ${(peakWindow / medWindow).toFixed(1)}× the typical 60s window.`,
      tradeIds: peakWindowTrades.map((t) => t.id),
    });
  }

  // ── Coordinated same-direction streaks ───────────────────────────
  const byOutcome = new Map<string, Trade[]>();
  for (const t of trades) {
    if (!byOutcome.has(t.outcomeId)) byOutcome.set(t.outcomeId, []);
    byOutcome.get(t.outcomeId)!.push(t);
  }
  for (const [, oTrades] of byOutcome) {
    let runStart = 0;
    for (let i = 1; i <= oTrades.length; i++) {
      const prev = oTrades[i - 1];
      const curr = oTrades[i];
      const breakRun = !curr || curr.type !== prev.type;
      if (breakRun) {
        const run = oTrades.slice(runStart, i);
        const distinctUsers = new Set(run.map((t) => t.userId));
        if (run.length >= COORDINATION_MIN_TRADES && distinctUsers.size >= 2) {
          const dir = run[0].type;
          const priceDelta = run[run.length - 1].priceAfterTrade - run[0].priceBeforeTrade;
          flags.push({
            id: `flg-${crypto.randomUUID().slice(0, 8)}`,
            kind: "coordinated-direction",
            marketId: market.id,
            marketTitle: market.title,
            at: run[run.length - 1].timestamp,
            magnitude: run.length,
            detail: `${run.length} consecutive ${dir} trades on "${run[0].outcomeName}" by ${distinctUsers.size} traders moved price ${priceDelta >= 0 ? "+" : ""}${(priceDelta * 100).toFixed(1)}¢.`,
            tradeIds: run.map((t) => t.id),
            userIds: [...distinctUsers],
          });
        }
        runStart = i;
      }
    }
  }

  // ── Sharp reversal after a burst ─────────────────────────────────
  for (const [, oTrades] of byOutcome) {
    for (let i = COORDINATION_MIN_TRADES; i < oTrades.length; i++) {
      const window = oTrades.slice(i - COORDINATION_MIN_TRADES, i);
      const allBuy = window.every((t) => t.type === "BUY");
      const allSell = window.every((t) => t.type === "SELL");
      if (!allBuy && !allSell) continue;
      const peakPrice = window[window.length - 1].priceAfterTrade;
      const lookahead = oTrades.slice(i, i + 5);
      for (const next of lookahead) {
        const delta = next.priceAfterTrade - peakPrice;
        if (
          (allBuy && delta <= -REVERSAL_MIN_DELTA) ||
          (allSell && delta >= REVERSAL_MIN_DELTA)
        ) {
          flags.push({
            id: `flg-${crypto.randomUUID().slice(0, 8)}`,
            kind: "sharp-reversal",
            marketId: market.id,
            marketTitle: market.title,
            at: next.timestamp,
            magnitude: Math.abs(delta),
            detail: `After a ${allBuy ? "buying" : "selling"} burst, "${next.outcomeName}" reversed ${(Math.abs(delta) * 100).toFixed(1)}¢ within a few trades.`,
            tradeIds: [...window.map((t) => t.id), next.id],
          });
          break;
        }
      }
    }
  }

  // ── Volatility spike (std dev of consecutive price changes) ──────
  const priceChanges: number[] = [];
  for (let i = 1; i < trades.length; i++) {
    if (trades[i].outcomeId === trades[i - 1].outcomeId) {
      priceChanges.push(
        trades[i].priceAfterTrade - trades[i - 1].priceAfterTrade,
      );
    }
  }
  const vol = stdev(priceChanges);
  if (vol >= VOLATILITY_THRESHOLD && priceChanges.length >= 5) {
    flags.push({
      id: `flg-${crypto.randomUUID().slice(0, 8)}`,
      kind: "volatility-spike",
      marketId: market.id,
      marketTitle: market.title,
      at: trades[trades.length - 1].timestamp,
      magnitude: vol,
      detail: `Price-change volatility of ${(vol * 100).toFixed(1)}¢ across ${priceChanges.length} consecutive trades.`,
      tradeIds: trades.map((t) => t.id),
    });
  }

  // De-duplicate flags that share kind+at+marketId (can happen with
  // multiple jumps inside one volume spike, etc.) by keeping max magnitude.
  const dedup = new Map<string, IntegrityFlag>();
  for (const f of flags) {
    const key = `${f.kind}-${f.at}`;
    const existing = dedup.get(key);
    if (!existing || f.magnitude > existing.magnitude) dedup.set(key, f);
  }

  return {
    marketId: market.id,
    marketTitle: market.title,
    windowMs: WINDOW_MS,
    totalTrades: trades.length,
    totalVolume,
    flags: [...dedup.values()].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    ),
    topTraderShare,
    uniqueTraders,
    maxPriceJump: maxJump,
    peakWindowVolume: peakWindow,
  };
}

// ── Cross-market summary ───────────────────────────────────────────

export interface ClassIntegritySummary {
  reports: MarketIntegrityReport[];
  totalFlags: number;
  flagsByKind: Record<IntegrityFlagKind, number>;
}

export function summarizeClassIntegrity(
  markets: Market[],
  trades: Trade[],
): ClassIntegritySummary {
  const reports = markets.map((m) => analyzeMarketIntegrity(m, trades));
  const flagsByKind: Record<IntegrityFlagKind, number> = {
    "volume-spike": 0,
    "rapid-price-move": 0,
    "trader-concentration": 0,
    "coordinated-direction": 0,
    "sharp-reversal": 0,
    "volatility-spike": 0,
    "whale-trade": 0,
  };
  let total = 0;
  for (const r of reports) {
    for (const f of r.flags) {
      flagsByKind[f.kind] += 1;
      total += 1;
    }
  }
  return { reports, totalFlags: total, flagsByKind };
}

// ── Labels (for UI) ────────────────────────────────────────────────

export const FLAG_LABELS: Record<IntegrityFlagKind, string> = {
  "volume-spike": "Volume spike",
  "rapid-price-move": "Rapid price move",
  "trader-concentration": "Trader concentration",
  "coordinated-direction": "Coordinated direction",
  "sharp-reversal": "Sharp reversal",
  "volatility-spike": "Volatility spike",
  "whale-trade": "Whale trade",
};
