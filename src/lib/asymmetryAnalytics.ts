import type { InfoPacket } from "@/context/MarketContext";
import type { Trade, UserPortfolio } from "@/lib/tradingEngine";

export interface AsymmetryRow {
  userId: string;
  displayName: string;
  hasInfo: boolean;
  releasedAt: string | null;
  openedAt: string | null;
  tradesBefore: number;
  tradesAfter: number;
  volumeBefore: number;
  volumeAfter: number;
  /** Trade count within 5 minutes after release, for the linked market if any. */
  reactionTrades: number;
}

export interface PriceImpact {
  outcomeId: string;
  outcomeName: string;
  priceBefore: number | null;
  priceAfter: number | null;
  delta: number | null;
}

export interface PacketAnalytics {
  packet: InfoPacket;
  releasedAt: string | null;
  recipientCount: number;
  openedCount: number;
  acknowledgedCount: number;
  rows: AsymmetryRow[];
  totals: {
    holdersAvgVolumeAfter: number;
    nonHoldersAvgVolumeAfter: number;
    holdersAvgTradesAfter: number;
    nonHoldersAvgTradesAfter: number;
  };
  priceImpacts: PriceImpact[];
  /** Total class volume in 5min before vs after release, for the linked market. */
  marketVolumeBefore: number;
  marketVolumeAfter: number;
}

const REACTION_WINDOW_MS = 5 * 60 * 1000;

export function analyzePacket(
  packet: InfoPacket,
  trades: Trade[],
  students: UserPortfolio[],
  /** Optional market outcomes used for price-impact comparison. */
  marketOutcomes?: { id: string; name: string }[],
): PacketAnalytics {
  const releasedAt = packet.releasedAt;
  const releasedMs = releasedAt ? new Date(releasedAt).getTime() : null;
  const recipientIds = new Set(packet.receipts.map((r) => r.userId));

  const relatedTrades = packet.marketId
    ? trades.filter((t) => t.marketId === packet.marketId)
    : trades;

  const rows: AsymmetryRow[] = students.map((s) => {
    const r = packet.receipts.find((x) => x.userId === s.userId);
    const userTrades = relatedTrades.filter((t) => t.userId === s.userId);

    let tradesBefore = 0,
      tradesAfter = 0,
      volumeBefore = 0,
      volumeAfter = 0,
      reactionTrades = 0;

    for (const t of userTrades) {
      const ts = new Date(t.timestamp).getTime();
      if (releasedMs == null) {
        // No release yet — treat everything as "before"
        tradesBefore += 1;
        volumeBefore += t.totalCost;
      } else if (ts < releasedMs) {
        tradesBefore += 1;
        volumeBefore += t.totalCost;
      } else {
        tradesAfter += 1;
        volumeAfter += t.totalCost;
        if (ts - releasedMs <= REACTION_WINDOW_MS) reactionTrades += 1;
      }
    }

    return {
      userId: s.userId,
      displayName: s.displayName,
      hasInfo: recipientIds.has(s.userId),
      releasedAt: r?.releasedAt ?? null,
      openedAt: r?.openedAt ?? null,
      tradesBefore,
      tradesAfter,
      volumeBefore,
      volumeAfter,
      reactionTrades,
    };
  });

  const holders = rows.filter((r) => r.hasInfo);
  const nonHolders = rows.filter((r) => !r.hasInfo);
  const avg = (arr: number[]) =>
    arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;

  const totals = {
    holdersAvgVolumeAfter: avg(holders.map((r) => r.volumeAfter)),
    nonHoldersAvgVolumeAfter: avg(nonHolders.map((r) => r.volumeAfter)),
    holdersAvgTradesAfter: avg(holders.map((r) => r.tradesAfter)),
    nonHoldersAvgTradesAfter: avg(nonHolders.map((r) => r.tradesAfter)),
  };

  // Price impact for the linked market: take last trade price per outcome
  // before release vs latest after release.
  const priceImpacts: PriceImpact[] = (marketOutcomes ?? []).map((o) => {
    const outcomeTrades = relatedTrades.filter((t) => t.outcomeId === o.id);
    let before: number | null = null;
    let after: number | null = null;
    for (const t of outcomeTrades) {
      const ts = new Date(t.timestamp).getTime();
      if (releasedMs == null || ts < releasedMs) before = t.priceAfterTrade;
      else after = t.priceAfterTrade;
    }
    const delta = before != null && after != null ? after - before : null;
    return { outcomeId: o.id, outcomeName: o.name, priceBefore: before, priceAfter: after, delta };
  });

  const marketVolumeBefore = relatedTrades
    .filter((t) => releasedMs != null && new Date(t.timestamp).getTime() < releasedMs && releasedMs - new Date(t.timestamp).getTime() <= REACTION_WINDOW_MS)
    .reduce((s, t) => s + t.totalCost, 0);
  const marketVolumeAfter = relatedTrades
    .filter((t) => releasedMs != null && new Date(t.timestamp).getTime() >= releasedMs && new Date(t.timestamp).getTime() - releasedMs <= REACTION_WINDOW_MS)
    .reduce((s, t) => s + t.totalCost, 0);

  return {
    packet,
    releasedAt,
    recipientCount: packet.receipts.length,
    openedCount: packet.receipts.filter((r) => r.openedAt).length,
    acknowledgedCount: packet.receipts.filter((r) => r.acknowledgedAt).length,
    rows,
    totals,
    priceImpacts,
    marketVolumeBefore,
    marketVolumeAfter,
  };
}
