// Pari-mutuel racetrack engine.
// Win/Place/Show pools: each pool collects all stakes, takeout is removed,
// remaining pool is divided proportionally among winning stakes.
//
// - Win pool: pays only on the 1st-place runner.
// - Place pool: pays on 1st and 2nd-place runners.
// - Show pool: pays on 1st, 2nd, and 3rd-place runners.

export type RacePoolKind = "win" | "place" | "show";

export interface RaceRunner {
  id: string;
  number: number; // post position
  name: string;
  jockey?: string;
  /** Morning-line decimal odds (display only; payout is pari-mutuel) */
  morningLine?: number;
  /** Scratched runners refund their wagers */
  scratched?: boolean;
}

export interface RacetrackSurface {
  enabled: boolean;
  /** Snapshot when last refreshed */
  lastUpdated?: string;
  /** Optional API source — currently always 'manual' */
  source: "manual";
  raceName?: string;
  postTime?: string;
  /** Track takeout per pool (e.g. 0.16 for 16%) */
  takeout: number;
  runners: RaceRunner[];
  /** Optional results (set on settlement) */
  finishOrder?: string[]; // runner ids in finishing order, top 3+ for show settlement
}

export interface RaceWager {
  id: string;
  userId: string;
  marketId: string;
  runnerId: string;
  pool: RacePoolKind;
  stake: number;
  /** Snapshot of runner display name */
  runnerName: string;
  runnerNumber: number;
  placedAt: string;
  status: "open" | "won" | "lost" | "void";
  settledPayout?: number;
  settledAt?: string;
}

export interface PoolTotals {
  win: number;
  place: number;
  show: number;
  /** Stakes per runner per pool */
  perRunner: Record<string, { win: number; place: number; show: number }>;
}

/** Aggregate all wagers for a market into pool totals. */
export function calculatePoolTotals(wagers: RaceWager[], runners: RaceRunner[]): PoolTotals {
  const perRunner: Record<string, { win: number; place: number; show: number }> = {};
  for (const r of runners) perRunner[r.id] = { win: 0, place: 0, show: 0 };

  let win = 0, place = 0, show = 0;
  for (const w of wagers) {
    if (w.status !== "open") continue;
    if (!perRunner[w.runnerId]) perRunner[w.runnerId] = { win: 0, place: 0, show: 0 };
    perRunner[w.runnerId][w.pool] += w.stake;
    if (w.pool === "win") win += w.stake;
    if (w.pool === "place") place += w.stake;
    if (w.pool === "show") show += w.stake;
  }
  return { win, place, show, perRunner };
}

/**
 * Compute live indicative odds for the win pool (post-takeout).
 * payout per $1 = (winPool * (1 - takeout)) / runnerWinStake
 * decimal odds = payout / 1 (already includes stake return)
 */
export function indicativeWinOdds(
  pools: PoolTotals,
  runnerId: string,
  takeout: number,
): number | null {
  const runnerStake = pools.perRunner[runnerId]?.win ?? 0;
  if (runnerStake <= 0 || pools.win <= 0) return null;
  const distributable = pools.win * (1 - takeout);
  return distributable / runnerStake;
}

export interface PlaceRaceWagerRequest {
  userId: string;
  marketId: string;
  runner: RaceRunner;
  pool: RacePoolKind;
  stake: number;
  cash: number;
  maxStake?: number;
}

export interface RaceWagerValidation {
  ok: boolean;
  error?: string;
  indicativeOdds?: number;
}

export function validateRaceWager(
  req: PlaceRaceWagerRequest,
  pools: PoolTotals,
  takeout: number,
): RaceWagerValidation {
  if (req.runner.scratched) return { ok: false, error: "Runner has been scratched" };
  if (!Number.isFinite(req.stake) || req.stake <= 0) return { ok: false, error: "Enter a positive stake" };
  if (req.stake > req.cash) return { ok: false, error: `Stake exceeds cash ($${req.cash.toFixed(2)})` };
  if (req.maxStake !== undefined && req.stake > req.maxStake) {
    return { ok: false, error: `Stake exceeds per-wager limit ($${req.maxStake.toFixed(2)})` };
  }
  return { ok: true, indicativeOdds: indicativeWinOdds(pools, req.runner.id, takeout) ?? undefined };
}

/**
 * Settle all wagers given a finish order.
 * - Win pool divided among winners (1st place).
 * - Place pool divided among horses finishing 1st OR 2nd. Each placeholder gets
 *   (placePool * (1 - takeout) / 2) / runnerPlaceStake on that runner.
 * - Show pool divided among 1st, 2nd, 3rd similarly into thirds.
 *
 * If no one bet on a winner in a given pool, that pool returns stakes to all bettors
 * in that pool (pro-rata refund).
 */
export function settleRaceWagers(
  wagers: RaceWager[],
  runners: RaceRunner[],
  finishOrder: string[],
  takeout: number,
): RaceWager[] {
  const pools = calculatePoolTotals(wagers, runners);
  const winnersWin = finishOrder.slice(0, 1);
  const winnersPlace = finishOrder.slice(0, 2);
  const winnersShow = finishOrder.slice(0, 3);

  // Pre-compute pool payouts per $1 staked on each winning runner per pool
  const payoutPerDollar: Record<RacePoolKind, Record<string, number>> = {
    win: {},
    place: {},
    show: {},
  };

  // Helper: split a pool equally among N winners
  const splitPool = (
    poolKind: RacePoolKind,
    poolTotal: number,
    winners: string[],
  ) => {
    if (poolTotal <= 0 || winners.length === 0) return;
    const distributable = poolTotal * (1 - takeout);
    const sharePerWinner = distributable / winners.length;
    for (const wid of winners) {
      const stakeOnWinner = pools.perRunner[wid]?.[poolKind] ?? 0;
      if (stakeOnWinner > 0) {
        payoutPerDollar[poolKind][wid] = sharePerWinner / stakeOnWinner;
      }
    }
  };

  splitPool("win", pools.win, winnersWin);
  splitPool("place", pools.place, winnersPlace);
  splitPool("show", pools.show, winnersShow);

  return wagers.map((w) => {
    if (w.status !== "open") return w;
    const runner = runners.find((r) => r.id === w.runnerId);
    if (runner?.scratched) {
      return { ...w, status: "void" as const, settledPayout: w.stake, settledAt: new Date().toISOString() };
    }
    const winners =
      w.pool === "win" ? winnersWin : w.pool === "place" ? winnersPlace : winnersShow;
    const wonOnRunner = winners.includes(w.runnerId);
    const pps = payoutPerDollar[w.pool][w.runnerId] ?? 0;

    if (wonOnRunner && pps > 0) {
      // Payout includes stake return as part of the pari-mutuel share
      const payout = Math.round(w.stake * pps * 100) / 100;
      return { ...w, status: "won" as const, settledPayout: payout, settledAt: new Date().toISOString() };
    }
    // No winning ticket on this runner for this pool. Check no-winner refund condition.
    const winnerHadStake = winners.some((wid) => (pools.perRunner[wid]?.[w.pool] ?? 0) > 0);
    if (!winnerHadStake) {
      return { ...w, status: "void" as const, settledPayout: w.stake, settledAt: new Date().toISOString() };
    }
    return { ...w, status: "lost" as const, settledPayout: 0, settledAt: new Date().toISOString() };
  });
}
