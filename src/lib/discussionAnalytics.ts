/**
 * Discussion Mode analytics — anonymized cohort comparisons for
 * classroom debrief. Splits the class on multiple dimensions and
 * surfaces aggregate stats so individuals are not singled out.
 *
 * All functions are deterministic from the trade ledger + portfolios.
 */

import type { Market, Trade, UserPortfolio, Holding } from "./tradingEngine";
import type { ShockEvent, InfoPacket } from "@/context/MarketContext";

export type ComparisonDimension =
  | "early-vs-late"
  | "diversified-vs-concentrated"
  | "info-holders"
  | "fast-vs-slow-reactors"
  | "high-return-vs-low-risk";

export const COMPARISON_LABELS: Record<ComparisonDimension, string> = {
  "early-vs-late": "Early vs late traders",
  "diversified-vs-concentrated": "Diversified vs concentrated",
  "info-holders": "Information holders vs non-holders",
  "fast-vs-slow-reactors": "Fast vs slow reactors after shocks",
  "high-return-vs-low-risk": "High-return vs low-risk students",
};

export const COMPARISON_DESCRIPTIONS: Record<ComparisonDimension, string> = {
  "early-vs-late":
    "Splits the class by their first-trade timestamp into the earliest half and the latest half.",
  "diversified-vs-concentrated":
    "Splits by number of distinct (market, outcome) holdings — top half vs bottom half.",
  "info-holders":
    "Compares students who received any information packet to those who did not.",
  "fast-vs-slow-reactors":
    "Compares median seconds-to-first-trade after each released shock.",
  "high-return-vs-low-risk":
    "Splits by realized + unrealized return; contrasts top-return cohort vs lowest-volatility cohort.",
};

export interface CohortStats {
  /** Anonymized label for the cohort (no real names). */
  label: string;
  /** Stable alias keys for members ("Trader A", "Trader B"...). */
  memberAliases: string[];
  userCount: number;
  totalTrades: number;
  totalVolume: number;
  /** Mean trades per trader. */
  avgTradesPerTrader: number;
  /** Mean number of distinct positions held per trader. */
  avgPositionsPerTrader: number;
  /** Mean portfolio value (cash + holdings@last price). */
  avgPortfolioValue: number;
  /** Mean portfolio return vs starting balance. */
  avgReturnPct: number;
  /** Mean seconds between first and last trade per trader. */
  avgSessionSeconds: number;
  /** Mean seconds-to-first-trade after each shock release. null if no shocks. */
  avgSecondsToShockReaction: number | null;
}

export interface ComparisonResult {
  dimension: ComparisonDimension;
  label: string;
  description: string;
  cohorts: CohortStats[];
  /** Plain-English finding lines derived from the cohort stats. */
  observations: string[];
}

interface BuildInput {
  markets: Market[];
  trades: Trade[];
  students: UserPortfolio[];
  shocks: ShockEvent[];
  packets: InfoPacket[];
  startingBalance: number;
}

// ── Helpers ──────────────────────────────────────────────────────────

function aliasFor(index: number): string {
  // Trader A, B, …, Z, AA, AB, …
  let n = index;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `Trader ${s}`;
}

function lastPrice(market: Market | undefined, outcomeId: string): number {
  if (!market) return 0;
  return market.outcomes.find((o) => o.id === outcomeId)?.price ?? 0;
}

function holdingValue(h: Holding, marketsById: Map<string, Market>): number {
  return h.shares * lastPrice(marketsById.get(h.marketId), h.outcomeId);
}

function portfolioValue(p: UserPortfolio, marketsById: Map<string, Market>): number {
  return p.cash + p.holdings.reduce((s, h) => s + holdingValue(h, marketsById), 0);
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

// ── Cohort statistics ────────────────────────────────────────────────

interface CohortBuildContext {
  marketsById: Map<string, Market>;
  trades: Trade[];
  students: UserPortfolio[];
  shocks: ShockEvent[];
  startingBalance: number;
  /** Stable alias map keyed by userId. */
  aliasByUser: Map<string, string>;
}

function buildCohortStats(
  label: string,
  userIds: string[],
  ctx: CohortBuildContext,
): CohortStats {
  const studentMap = new Map(ctx.students.map((s) => [s.userId, s]));
  const members = userIds
    .map((uid) => studentMap.get(uid))
    .filter((s): s is UserPortfolio => !!s);

  const tradesByUser = new Map<string, Trade[]>();
  for (const t of ctx.trades) {
    if (!userIds.includes(t.userId)) continue;
    if (!tradesByUser.has(t.userId)) tradesByUser.set(t.userId, []);
    tradesByUser.get(t.userId)!.push(t);
  }

  const totalTrades = Array.from(tradesByUser.values()).reduce((s, ts) => s + ts.length, 0);
  const totalVolume = Array.from(tradesByUser.values())
    .flat()
    .reduce((s, t) => s + t.totalCost, 0);

  const positionsPerTrader = members.map((m) => m.holdings.filter((h) => h.shares > 0).length);
  const portfolioValues = members.map((m) => portfolioValue(m, ctx.marketsById));
  const returnsPct = members.map(
    (m) => ((portfolioValue(m, ctx.marketsById) - ctx.startingBalance) / ctx.startingBalance) * 100,
  );

  // Session length per trader.
  const sessionSeconds = members.map((m) => {
    const ts = (tradesByUser.get(m.userId) ?? [])
      .map((t) => new Date(t.timestamp).getTime())
      .sort((a, b) => a - b);
    if (ts.length < 2) return 0;
    return (ts[ts.length - 1] - ts[0]) / 1000;
  });

  // Median seconds to first reaction per shock per trader.
  const releasedShocks = ctx.shocks.filter((s) => s.releasedAt && (s.status === "released" || s.status === "corrected"));
  const reactionSecondsAll: number[] = [];
  for (const member of members) {
    const memberTrades = tradesByUser.get(member.userId) ?? [];
    for (const shock of releasedShocks) {
      const released = new Date(shock.releasedAt!).getTime();
      const linked = shock.marketIds.length > 0
        ? new Set(shock.marketIds)
        : new Set(ctx.marketsById.keys());
      const first = memberTrades
        .filter((t) => linked.has(t.marketId) && new Date(t.timestamp).getTime() >= released)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
      if (first) {
        reactionSecondsAll.push((new Date(first.timestamp).getTime() - released) / 1000);
      }
    }
  }

  return {
    label,
    memberAliases: userIds.map((uid) => ctx.aliasByUser.get(uid) ?? "Trader ?"),
    userCount: members.length,
    totalTrades,
    totalVolume,
    avgTradesPerTrader: members.length === 0 ? 0 : totalTrades / members.length,
    avgPositionsPerTrader: mean(positionsPerTrader),
    avgPortfolioValue: mean(portfolioValues),
    avgReturnPct: mean(returnsPct),
    avgSessionSeconds: mean(sessionSeconds),
    avgSecondsToShockReaction: reactionSecondsAll.length > 0 ? median(reactionSecondsAll) : null,
  };
}

// ── Cohort selection per dimension ──────────────────────────────────

function splitEarlyVsLate(students: UserPortfolio[], trades: Trade[]): [string[], string[]] {
  const firstTradeAt = new Map<string, number>();
  for (const t of trades) {
    const ts = new Date(t.timestamp).getTime();
    const cur = firstTradeAt.get(t.userId);
    if (cur === undefined || ts < cur) firstTradeAt.set(t.userId, ts);
  }
  const traders = students.filter((s) => firstTradeAt.has(s.userId));
  traders.sort((a, b) => (firstTradeAt.get(a.userId)! - firstTradeAt.get(b.userId)!));
  const half = Math.floor(traders.length / 2);
  return [
    traders.slice(0, half).map((s) => s.userId),
    traders.slice(half).map((s) => s.userId),
  ];
}

function splitDiversifiedVsConcentrated(students: UserPortfolio[]): [string[], string[]] {
  const positions = students
    .map((s) => ({ uid: s.userId, n: s.holdings.filter((h) => h.shares > 0).length }))
    .filter((x) => x.n > 0);
  positions.sort((a, b) => b.n - a.n);
  const half = Math.floor(positions.length / 2);
  return [
    positions.slice(0, half).map((p) => p.uid),
    positions.slice(half).map((p) => p.uid),
  ];
}

function splitInfoHolders(students: UserPortfolio[], packets: InfoPacket[]): [string[], string[]] {
  const holderIds = new Set<string>();
  for (const p of packets) for (const uid of p.audience.userIds) holderIds.add(uid);
  return [
    students.filter((s) => holderIds.has(s.userId)).map((s) => s.userId),
    students.filter((s) => !holderIds.has(s.userId)).map((s) => s.userId),
  ];
}

function splitFastVsSlowReactors(
  students: UserPortfolio[], trades: Trade[], shocks: ShockEvent[], marketsById: Map<string, Market>,
): [string[], string[]] {
  const released = shocks.filter((s) => s.releasedAt && (s.status === "released" || s.status === "corrected"));
  const medianByUser = new Map<string, number>();
  for (const s of students) {
    const userTrades = trades.filter((t) => t.userId === s.userId);
    const reactions: number[] = [];
    for (const shock of released) {
      const r = new Date(shock.releasedAt!).getTime();
      const linked = shock.marketIds.length > 0 ? new Set(shock.marketIds) : new Set(marketsById.keys());
      const first = userTrades
        .filter((t) => linked.has(t.marketId) && new Date(t.timestamp).getTime() >= r)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
      if (first) reactions.push((new Date(first.timestamp).getTime() - r) / 1000);
    }
    if (reactions.length > 0) medianByUser.set(s.userId, median(reactions));
  }
  const ranked = Array.from(medianByUser.entries()).sort((a, b) => a[1] - b[1]);
  const half = Math.floor(ranked.length / 2);
  return [
    ranked.slice(0, half).map(([uid]) => uid),
    ranked.slice(half).map(([uid]) => uid),
  ];
}

function splitHighReturnVsLowRisk(
  students: UserPortfolio[], trades: Trade[], marketsById: Map<string, Market>, startingBalance: number,
): [string[], string[]] {
  const stats = students.map((s) => {
    const value = portfolioValue(s, marketsById);
    const returnPct = ((value - startingBalance) / startingBalance) * 100;
    // "Risk" proxy: stdev of trade sizes (totalCost) for this trader.
    const userTradeSizes = trades.filter((t) => t.userId === s.userId).map((t) => t.totalCost);
    const risk = stdDev(userTradeSizes);
    return { uid: s.userId, returnPct, risk };
  });
  // High return = top half by returnPct
  const byReturn = [...stats].sort((a, b) => b.returnPct - a.returnPct);
  const halfReturn = Math.floor(byReturn.length / 2);
  const highReturn = byReturn.slice(0, halfReturn).map((x) => x.uid);
  // Low risk = bottom half by risk (stdev)
  const byRisk = [...stats].sort((a, b) => a.risk - b.risk);
  const halfRisk = Math.floor(byRisk.length / 2);
  const lowRisk = byRisk.slice(0, halfRisk).map((x) => x.uid);
  return [highReturn, lowRisk];
}

// ── Public: build a comparison ──────────────────────────────────────

export function buildComparison(
  dimension: ComparisonDimension,
  input: BuildInput,
): ComparisonResult {
  const marketsById = new Map(input.markets.map((m) => [m.id, m]));

  // Stable anonymization: alphabetize user ids and assign aliases.
  const sortedIds = [...input.students].map((s) => s.userId).sort();
  const aliasByUser = new Map<string, string>();
  sortedIds.forEach((uid, i) => aliasByUser.set(uid, aliasFor(i)));

  const ctx: CohortBuildContext = {
    marketsById, trades: input.trades, students: input.students,
    shocks: input.shocks, startingBalance: input.startingBalance, aliasByUser,
  };

  let cohorts: CohortStats[] = [];

  switch (dimension) {
    case "early-vs-late": {
      const [early, late] = splitEarlyVsLate(input.students, input.trades);
      cohorts = [
        buildCohortStats("Early traders", early, ctx),
        buildCohortStats("Late traders", late, ctx),
      ];
      break;
    }
    case "diversified-vs-concentrated": {
      const [div, con] = splitDiversifiedVsConcentrated(input.students);
      cohorts = [
        buildCohortStats("Diversified", div, ctx),
        buildCohortStats("Concentrated", con, ctx),
      ];
      break;
    }
    case "info-holders": {
      const [holders, nonHolders] = splitInfoHolders(input.students, input.packets);
      cohorts = [
        buildCohortStats("Information holders", holders, ctx),
        buildCohortStats("Non-holders", nonHolders, ctx),
      ];
      break;
    }
    case "fast-vs-slow-reactors": {
      const [fast, slow] = splitFastVsSlowReactors(input.students, input.trades, input.shocks, marketsById);
      cohorts = [
        buildCohortStats("Fast reactors", fast, ctx),
        buildCohortStats("Slow reactors", slow, ctx),
      ];
      break;
    }
    case "high-return-vs-low-risk": {
      const [hr, lr] = splitHighReturnVsLowRisk(input.students, input.trades, marketsById, input.startingBalance);
      cohorts = [
        buildCohortStats("High return", hr, ctx),
        buildCohortStats("Low risk", lr, ctx),
      ];
      break;
    }
  }

  const observations = generateObservations(dimension, cohorts);

  return {
    dimension,
    label: COMPARISON_LABELS[dimension],
    description: COMPARISON_DESCRIPTIONS[dimension],
    cohorts,
    observations,
  };
}

function generateObservations(dim: ComparisonDimension, cohorts: CohortStats[]): string[] {
  if (cohorts.length < 2) return [];
  const [a, b] = cohorts;
  const out: string[] = [];

  if (a.userCount === 0 || b.userCount === 0) {
    out.push(`One cohort is empty (${a.label}: ${a.userCount}, ${b.label}: ${b.userCount}). Need more data to compare.`);
    return out;
  }

  const tradeDiff = a.avgTradesPerTrader - b.avgTradesPerTrader;
  if (Math.abs(tradeDiff) >= 0.5) {
    out.push(
      `${tradeDiff > 0 ? a.label : b.label} traded more on average ` +
      `(${a.avgTradesPerTrader.toFixed(1)} vs ${b.avgTradesPerTrader.toFixed(1)} trades/trader).`,
    );
  }

  const retDiff = a.avgReturnPct - b.avgReturnPct;
  if (Math.abs(retDiff) >= 1) {
    out.push(
      `${retDiff > 0 ? a.label : b.label} had higher average returns ` +
      `(${a.avgReturnPct.toFixed(1)}% vs ${b.avgReturnPct.toFixed(1)}%).`,
    );
  }

  const posDiff = a.avgPositionsPerTrader - b.avgPositionsPerTrader;
  if (Math.abs(posDiff) >= 0.5) {
    out.push(
      `${posDiff > 0 ? a.label : b.label} held more distinct positions per trader ` +
      `(${a.avgPositionsPerTrader.toFixed(1)} vs ${b.avgPositionsPerTrader.toFixed(1)}).`,
    );
  }

  if (a.avgSecondsToShockReaction !== null && b.avgSecondsToShockReaction !== null) {
    const fast = a.avgSecondsToShockReaction < b.avgSecondsToShockReaction ? a : b;
    const slow = a.avgSecondsToShockReaction < b.avgSecondsToShockReaction ? b : a;
    out.push(
      `${fast.label} reacted faster after shocks ` +
      `(median ${fast.avgSecondsToShockReaction!.toFixed(0)}s vs ${slow.avgSecondsToShockReaction!.toFixed(0)}s).`,
    );
  }

  if (dim === "info-holders" && retDiff > 1) {
    out.push("Information holders out-performed in this session — discuss whether the edge came from the information itself or other factors.");
  }
  if (dim === "diversified-vs-concentrated" && a.avgReturnPct < b.avgReturnPct && a.label === "Diversified") {
    out.push("Concentrated portfolios out-performed here. Discuss the role of luck vs skill in small samples.");
  }

  if (out.length === 0) {
    out.push("No notable differences between the two cohorts on standard metrics.");
  }
  return out;
}

/** Public: build aliases-only roster (for instructor reveal toggle). */
export function buildAliasMap(students: UserPortfolio[]): Map<string, string> {
  const sortedIds = students.map((s) => s.userId).sort();
  const map = new Map<string, string>();
  sortedIds.forEach((uid, i) => map.set(uid, aliasFor(i)));
  return map;
}
