// Write-through mirror: copies every wager/trade the in-memory engines
// produce into the durable `bets` table, and keeps status/payout in sync
// as they settle. Renders nothing.
//
// This gives instructors a permanent, gradeable record (journal, CSV
// exports, ROI stats) without rewriting MarketContext. Full read-side
// hydration of the live engines is a later phase.
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMarket } from "@/context/MarketContext";
import { useActiveMembership } from "@/features/classes/useClasses";
import { db, type BetRow } from "@/features/db";

/** Fields that change after placement — re-upsert when these move. */
function syncStamp(status: string, payout: number | undefined): string {
  return `${status}|${payout ?? ""}`;
}

export function PersistenceBridge() {
  const { user } = useAuth();
  const { portfolio, markets, trades, sportsbookWagers, raceWagers } = useMarket();
  const { data: membership } = useActiveMembership();

  // Last-synced stamp per bet id, so we only write on change.
  const syncedRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;
    const classId = membership?.klass.id ?? null;
    const marketTitle = (id: string) => markets.find((m) => m.id === id)?.title ?? "";
    const rows: Partial<BetRow>[] = [];
    const stamps: [string, string][] = [];

    for (const w of sportsbookWagers) {
      if (w.userId !== portfolio.userId) continue;
      const stamp = syncStamp(w.status, w.settledPayout);
      if (syncedRef.current.get(w.id) === stamp) continue;
      rows.push({
        id: w.id,
        class_id: classId,
        user_id: user.id,
        mode: "sportsbook",
        market_id: w.marketId,
        market_title: marketTitle(w.marketId),
        selection: w.label,
        bet_type: w.kind,
        stake: w.stake,
        odds_decimal: w.decimalOdds,
        potential_payout: w.stake * w.decimalOdds,
        status: w.status,
        payout: w.settledPayout ?? null,
        placed_at: w.placedAt,
        settled_at: w.settledAt ?? null,
        raw: w,
      });
      stamps.push([w.id, stamp]);
    }

    for (const w of raceWagers) {
      if (w.userId !== portfolio.userId) continue;
      const stamp = syncStamp(w.status, w.settledPayout);
      if (syncedRef.current.get(w.id) === stamp) continue;
      rows.push({
        id: w.id,
        class_id: classId,
        user_id: user.id,
        mode: "racetrack",
        market_id: w.marketId,
        market_title: marketTitle(w.marketId),
        selection: `${w.runnerName} (#${w.runnerNumber})`,
        bet_type: w.pool,
        stake: w.stake,
        odds_decimal: null, // pari-mutuel: odds unknown until pool closes
        potential_payout: null,
        status: w.status,
        payout: w.settledPayout ?? null,
        placed_at: w.placedAt,
        settled_at: w.settledAt ?? null,
        raw: w,
      });
      stamps.push([w.id, stamp]);
    }

    for (const t of trades) {
      if (t.userId !== portfolio.userId) continue;
      if (syncedRef.current.has(t.id)) continue;
      rows.push({
        id: t.id,
        class_id: classId,
        user_id: user.id,
        mode: "prediction",
        market_id: t.marketId,
        market_title: t.marketTitle,
        selection: t.outcomeName,
        bet_type: t.type,
        stake: t.totalCost,
        odds_decimal: t.pricePerShare,
        potential_payout: t.type === "BUY" ? t.quantity : null,
        status: "executed",
        payout: null,
        placed_at: t.timestamp,
        settled_at: null,
        raw: t,
      });
      stamps.push([t.id, "executed|"]);
    }

    if (rows.length === 0) return;
    // Optimistically mark synced so re-renders mid-flight don't double-write;
    // roll back on failure so the next change retries.
    for (const [id, stamp] of stamps) syncedRef.current.set(id, stamp);
    db.from("bets")
      .upsert(rows, { onConflict: "id" })
      .then(({ error }) => {
        if (error) {
          console.error("PersistenceBridge: failed to sync bets:", error.message);
          for (const [id] of stamps) syncedRef.current.delete(id);
        }
      });
  }, [user, membership, portfolio.userId, markets, trades, sportsbookWagers, raceWagers]);

  return null;
}
