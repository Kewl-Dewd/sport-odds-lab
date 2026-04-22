/**
 * Shock event analytics — measure market reaction to instructor-released
 * shock events. All metrics are derived from the trade ledger and are
 * deterministic.
 */

import type { Market, Trade } from "./tradingEngine";
import type { ShockEvent } from "@/context/MarketContext";

const REACTION_WINDOW_MS = 5 * 60_000; // 5 minutes after release
const PRE_WINDOW_MS = 5 * 60_000;      // 5 minutes before release for baseline

export interface ShockMarketImpact {
  marketId: string;
  marketTitle: string;
  /** Volume in the 5min before release. */
  preVolume: number;
  /** Volume in the 5min after release. */
  postVolume: number;
  /** Trade count before / after. */
  preTrades: number;
  postTrades: number;
  /** Largest absolute price move on any outcome in the window. */
  priceMove: number;
  /** Outcome that moved the most (label). */
  movedOutcomeName?: string;
  /** Direction of biggest move: +1 up, -1 down, 0 none. */
  direction: 1 | -1 | 0;
  /** Whether a reversal of ≥ 50% of the initial move occurred within the window. */
  reversed: boolean;
}

export interface ShockReaction {
  shockId: string;
  shock: ShockEvent;
  perMarket: ShockMarketImpact[];
  /** Aggregated across all linked markets. */
  totalPostVolume: number;
  totalPreVolume: number;
  volumeSurge: number; // postVolume / max(preVolume, 1)
  /** UserIds of the first 5 traders to act after release, ordered. */
  firstReactors: { userId: string; displayName: string; secondsAfter: number }[];
  /** Count of distinct traders who acted within the window. */
  reactorCount: number;
}

interface AnalyzeInput {
  shocks: ShockEvent[];
  markets: Market[];
  trades: Trade[];
  displayNames: Record<string, string>;
}

export function analyzeShockReactions({
  shocks,
  markets,
  trades,
  displayNames,
}: AnalyzeInput): ShockReaction[] {
  return shocks
    .filter((s) => s.releasedAt)
    .map((s) => buildReaction(s, markets, trades, displayNames));
}

function buildReaction(
  shock: ShockEvent,
  markets: Market[],
  trades: Trade[],
  displayNames: Record<string, string>,
): ShockReaction {
  const released = new Date(shock.releasedAt!).getTime();
  const linked = shock.marketIds.length > 0
    ? shock.marketIds
    : Array.from(new Set(trades.map((t) => t.marketId)));

  const perMarket: ShockMarketImpact[] = linked.map((mid) => {
    const market = markets.find((m) => m.id === mid);
    const mTrades = trades
      .filter((t) => t.marketId === mid)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const pre = mTrades.filter((t) => {
      const ts = new Date(t.timestamp).getTime();
      return ts >= released - PRE_WINDOW_MS && ts < released;
    });
    const post = mTrades.filter((t) => {
      const ts = new Date(t.timestamp).getTime();
      return ts >= released && ts <= released + REACTION_WINDOW_MS;
    });

    // Find biggest single-outcome price move in the post window.
    let bestMove = 0;
    let movedOutcome: string | undefined;
    let direction: 1 | -1 | 0 = 0;
    let reversed = false;

    if (post.length > 0) {
      const byOutcome = new Map<string, Trade[]>();
      for (const t of post) {
        if (!byOutcome.has(t.outcomeId)) byOutcome.set(t.outcomeId, []);
        byOutcome.get(t.outcomeId)!.push(t);
      }
      // Reference price = last trade in pre-window for that outcome, or first post-trade.
      for (const [oid, ts] of byOutcome) {
        const preLast = [...pre].reverse().find((t) => t.outcomeId === oid);
        const startPrice = preLast?.priceAfterTrade ?? ts[0].priceAfterTrade;
        const peakPrice = ts.reduce(
          (acc, t) => Math.abs(t.priceAfterTrade - startPrice) > Math.abs(acc - startPrice) ? t.priceAfterTrade : acc,
          startPrice,
        );
        const move = peakPrice - startPrice;
        if (Math.abs(move) > Math.abs(bestMove)) {
          bestMove = move;
          movedOutcome = ts[0].outcomeName;
          direction = move > 0 ? 1 : move < 0 ? -1 : 0;
          // Reversal: did the price come back ≥ 50% toward startPrice by window end?
          const endPrice = ts[ts.length - 1].priceAfterTrade;
          reversed =
            Math.sign(endPrice - startPrice) !== Math.sign(move) ||
            Math.abs(endPrice - startPrice) <= Math.abs(move) * 0.5;
        }
      }
    }

    return {
      marketId: mid,
      marketTitle: market?.title ?? mid,
      preVolume: pre.reduce((s, t) => s + t.totalCost, 0),
      postVolume: post.reduce((s, t) => s + t.totalCost, 0),
      preTrades: pre.length,
      postTrades: post.length,
      priceMove: Math.abs(bestMove),
      movedOutcomeName: movedOutcome,
      direction,
      reversed,
    };
  });

  // Aggregate first reactors across all linked markets.
  const reactors = trades
    .filter((t) => {
      const ts = new Date(t.timestamp).getTime();
      return (
        linked.includes(t.marketId) &&
        ts >= released &&
        ts <= released + REACTION_WINDOW_MS
      );
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const seen = new Set<string>();
  const firstReactors: ShockReaction["firstReactors"] = [];
  for (const t of reactors) {
    if (seen.has(t.userId)) continue;
    seen.add(t.userId);
    firstReactors.push({
      userId: t.userId,
      displayName: displayNames[t.userId] ?? t.userId,
      secondsAfter: Math.round((new Date(t.timestamp).getTime() - released) / 1000),
    });
    if (firstReactors.length >= 5) break;
  }

  const totalPreVolume = perMarket.reduce((s, m) => s + m.preVolume, 0);
  const totalPostVolume = perMarket.reduce((s, m) => s + m.postVolume, 0);

  return {
    shockId: shock.id,
    shock,
    perMarket,
    totalPreVolume,
    totalPostVolume,
    volumeSurge: totalPostVolume / Math.max(totalPreVolume, 1),
    firstReactors,
    reactorCount: seen.size,
  };
}

/** Compare aggregate reactions for true vs false-alarm shocks. */
export interface TruthComparison {
  trueShocks: { count: number; avgVolumeSurge: number; avgPriceMove: number; avgReversalRate: number };
  falseShocks: { count: number; avgVolumeSurge: number; avgPriceMove: number; avgReversalRate: number };
}

export function compareTruthReactions(reactions: ShockReaction[]): TruthComparison {
  const summarize = (rs: ShockReaction[]) => {
    if (rs.length === 0) {
      return { count: 0, avgVolumeSurge: 0, avgPriceMove: 0, avgReversalRate: 0 };
    }
    const surges = rs.map((r) => r.volumeSurge);
    const moves = rs.flatMap((r) => r.perMarket.map((m) => m.priceMove));
    const reversals = rs.flatMap((r) => r.perMarket.map((m) => (m.reversed ? 1 : 0)));
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1);
    return {
      count: rs.length,
      avgVolumeSurge: mean(surges),
      avgPriceMove: mean(moves),
      avgReversalRate: mean(reversals),
    };
  };
  return {
    trueShocks: summarize(reactions.filter((r) => r.shock.truthStatus === "true")),
    falseShocks: summarize(reactions.filter((r) => r.shock.truthStatus === "false")),
  };
}
