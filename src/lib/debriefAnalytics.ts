/**
 * Debrief analytics — aggregate session/experiment data into
 * a single summary view: timelines, key trades, market outcomes,
 * and discussion talking points. All deterministic from the trade
 * ledger and existing event logs.
 */

import type { Market, Trade } from "./tradingEngine";
import type {
  ShockEvent,
  ScenarioEvent,
  InfoPacket,
} from "@/context/MarketContext";

export type DebriefEventKind =
  | "shock"
  | "scenario"
  | "info-release"
  | "price-jump"
  | "market-settled";

export interface DebriefEvent {
  id: string;
  at: string; // ISO
  kind: DebriefEventKind;
  marketId?: string;
  marketTitle?: string;
  title: string;
  detail: string;
}

export interface KeyTrade {
  trade: Trade;
  /** Absolute price impact of this trade. */
  priceImpact: number;
  /** Reason this trade is highlighted. */
  reason: "largest-cost" | "largest-impact" | "first-after-shock";
}

export interface MarketOutcomeSummary {
  marketId: string;
  marketTitle: string;
  status: Market["status"];
  totalTrades: number;
  totalVolume: number;
  uniqueTraders: number;
  /** Range of last-prices across outcomes (max - min change vs first trade). */
  priceRange: number;
  /** Final outcome name and price (highest closing probability). */
  topOutcomeName?: string;
  topOutcomePrice?: number;
  settledOutcomeName?: string;
}

export interface DebriefSummary {
  marketCount: number;
  totalTrades: number;
  totalVolume: number;
  activeTraders: number;
  events: DebriefEvent[];
  keyTrades: KeyTrade[];
  marketOutcomes: MarketOutcomeSummary[];
  discussionPoints: string[];
}

interface BuildInput {
  markets: Market[];
  trades: Trade[];
  shocks: ShockEvent[];
  scenarios: ScenarioEvent[];
  packets: InfoPacket[];
  /** Min absolute price jump between consecutive trades to flag. */
  priceJumpThreshold?: number;
}

export function buildDebriefSummary({
  markets, trades, shocks, scenarios, packets,
  priceJumpThreshold = 0.08,
}: BuildInput): DebriefSummary {
  const marketById = new Map(markets.map((m) => [m.id, m]));
  const events: DebriefEvent[] = [];

  // Shocks → events
  for (const s of shocks) {
    if (s.status !== "released" && s.status !== "corrected") continue;
    if (!s.releasedAt) continue;
    const mTitles = s.marketIds.length > 0
      ? s.marketIds.map((id) => marketById.get(id)?.title ?? id).join(", ")
      : "All markets";
    events.push({
      id: `e-shock-${s.id}`,
      at: s.releasedAt,
      kind: "shock",
      marketId: s.marketIds[0],
      marketTitle: mTitles,
      title: `${s.urgency === "breaking" ? "🚨 " : ""}${s.title}`,
      detail: s.description,
    });
  }

  // Scenario events
  for (const e of scenarios) {
    events.push({
      id: `e-scn-${e.id}`,
      at: e.injectedAt,
      kind: "scenario",
      marketId: e.marketId ?? undefined,
      marketTitle: e.marketId ? marketById.get(e.marketId)?.title : undefined,
      title: `Scenario: ${e.kind.replace(/-/g, " ")}`,
      detail: e.note,
    });
  }

  // Info packet releases
  for (const p of packets) {
    events.push({
      id: `e-info-${p.id}`,
      at: p.createdAt,
      kind: "info-release",
      marketId: p.marketId ?? undefined,
      marketTitle: p.marketId ? marketById.get(p.marketId)?.title : undefined,
      title: `Info packet: ${p.title}`,
      detail: `Released to ${p.audience.userIds.length} student(s)`,
    });
  }

  // Price jumps from consecutive trades on same outcome.
  const tradesByMarketOutcome = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = `${t.marketId}::${t.outcomeId}`;
    if (!tradesByMarketOutcome.has(k)) tradesByMarketOutcome.set(k, []);
    tradesByMarketOutcome.get(k)!.push(t);
  }
  for (const [, ts] of tradesByMarketOutcome) {
    ts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (let i = 1; i < ts.length; i++) {
      const jump = ts[i].priceAfterTrade - ts[i - 1].priceAfterTrade;
      if (Math.abs(jump) >= priceJumpThreshold) {
        events.push({
          id: `e-jmp-${ts[i].id}`,
          at: ts[i].timestamp,
          kind: "price-jump",
          marketId: ts[i].marketId,
          marketTitle: marketById.get(ts[i].marketId)?.title,
          title: `Price jump on ${ts[i].outcomeName}`,
          detail: `${(jump * 100).toFixed(1)}¢ in one trade (${ts[i - 1].priceAfterTrade.toFixed(2)} → ${ts[i].priceAfterTrade.toFixed(2)})`,
        });
      }
    }
  }

  // Settled markets
  for (const m of markets) {
    if (m.status === "settled" && m.settledAt) {
      const winner = m.outcomes.find((o) => o.id === m.winningOutcomeId);
      events.push({
        id: `e-set-${m.id}`,
        at: m.settledAt,
        kind: "market-settled",
        marketId: m.id,
        marketTitle: m.title,
        title: `Market settled: ${m.title}`,
        detail: winner ? `Winner: ${winner.name}` : "Settled",
      });
    }
  }

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  // Key trades — largest cost + largest single-trade impact + first-after-shock.
  const tradesByImpact = trades
    .map((t) => {
      // Find prior trade on same outcome to compute impact, fall back to 0.
      const prior = trades
        .filter((x) => x.marketId === t.marketId && x.outcomeId === t.outcomeId &&
          new Date(x.timestamp).getTime() < new Date(t.timestamp).getTime())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      const priceImpact = prior ? Math.abs(t.priceAfterTrade - prior.priceAfterTrade) : 0;
      return { trade: t, priceImpact };
    });

  const keyTrades: KeyTrade[] = [];
  const largestCost = [...trades].sort((a, b) => b.totalCost - a.totalCost).slice(0, 3);
  const largestImpact = [...tradesByImpact].sort((a, b) => b.priceImpact - a.priceImpact).slice(0, 3);
  const seenIds = new Set<string>();

  for (const t of largestCost) {
    if (seenIds.has(t.id)) continue;
    seenIds.add(t.id);
    const impact = tradesByImpact.find((x) => x.trade.id === t.id)?.priceImpact ?? 0;
    keyTrades.push({ trade: t, priceImpact: impact, reason: "largest-cost" });
  }
  for (const { trade, priceImpact } of largestImpact) {
    if (seenIds.has(trade.id)) continue;
    seenIds.add(trade.id);
    keyTrades.push({ trade, priceImpact, reason: "largest-impact" });
  }
  // First trade after each released shock
  const releasedShocks = shocks.filter((s) => s.releasedAt && (s.status === "released" || s.status === "corrected"));
  for (const s of releasedShocks) {
    const released = new Date(s.releasedAt!).getTime();
    const linked = s.marketIds.length > 0 ? s.marketIds : markets.map((m) => m.id);
    const first = trades
      .filter((t) => linked.includes(t.marketId) && new Date(t.timestamp).getTime() >= released)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
    if (first && !seenIds.has(first.id)) {
      seenIds.add(first.id);
      const impact = tradesByImpact.find((x) => x.trade.id === first.id)?.priceImpact ?? 0;
      keyTrades.push({ trade: first, priceImpact: impact, reason: "first-after-shock" });
    }
  }

  // Per-market outcomes
  const marketOutcomes: MarketOutcomeSummary[] = markets.map((m) => {
    const mTrades = trades.filter((t) => t.marketId === m.id);
    const uniq = new Set(mTrades.map((t) => t.userId)).size;
    const top = [...m.outcomes].sort((a, b) => b.currentPrice - a.currentPrice)[0];
    const winner = m.outcomes.find((o) => o.id === m.winningOutcomeId);
    // priceRange = max abs change of any outcome from initial 1/n
    const initial = 1 / Math.max(m.outcomes.length, 1);
    const priceRange = Math.max(...m.outcomes.map((o) => Math.abs(o.currentPrice - initial)), 0);
    return {
      marketId: m.id,
      marketTitle: m.title,
      status: m.status,
      totalTrades: mTrades.length,
      totalVolume: mTrades.reduce((s, t) => s + t.totalCost, 0),
      uniqueTraders: uniq,
      priceRange,
      topOutcomeName: top?.name,
      topOutcomePrice: top?.currentPrice,
      settledOutcomeName: winner?.name,
    };
  });

  const totalVolume = trades.reduce((s, t) => s + t.totalCost, 0);
  const activeTraders = new Set(trades.map((t) => t.userId)).size;

  // Discussion talking points (factual, derived from data).
  const discussionPoints: string[] = [];
  const concentrated = marketOutcomes.filter((m) => m.uniqueTraders > 0 && m.totalTrades / m.uniqueTraders >= 5);
  if (concentrated.length > 0) {
    discussionPoints.push(`${concentrated.length} market(s) had high per-trader trade frequency (≥5 trades/trader). Discuss: were students chasing prices?`);
  }
  const bigJumps = events.filter((e) => e.kind === "price-jump");
  if (bigJumps.length > 0) {
    discussionPoints.push(`${bigJumps.length} large single-trade price jumps occurred. Discuss low-liquidity dynamics and how few orders can shift prices.`);
  }
  const trueShocks = shocks.filter((s) => s.truthStatus === "true" && s.releasedAt);
  const falseShocks = shocks.filter((s) => s.truthStatus === "false" && s.releasedAt);
  if (trueShocks.length > 0 && falseShocks.length > 0) {
    discussionPoints.push(`The class saw ${trueShocks.length} true and ${falseShocks.length} false-alarm shock(s). Compare reaction sizes — did students distinguish the two?`);
  }
  if (packets.length > 0) {
    discussionPoints.push(`${packets.length} information packet(s) were released. Discuss whether information holders traded differently than non-holders.`);
  }
  if (marketOutcomes.some((m) => m.priceRange > 0.3)) {
    discussionPoints.push(`Some markets moved >30¢ from their starting probability. Discuss what new information (or behavior) drove the largest moves.`);
  }

  return {
    marketCount: markets.length,
    totalTrades: trades.length,
    totalVolume,
    activeTraders,
    events,
    keyTrades,
    marketOutcomes,
    discussionPoints,
  };
}
