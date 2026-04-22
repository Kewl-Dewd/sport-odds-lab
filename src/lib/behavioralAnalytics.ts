/**
 * Behavioral Finance Analytics — Deterministic detectors for common
 * decision-making biases observed in trading logs. Every signal is
 * derived from measured user actions; no commentary or inferred intent.
 */

import type { Market, Trade } from "./tradingEngine";

// ── Bias kinds ─────────────────────────────────────────────────────

export type BiasKind =
  | "overconfidence"
  | "herd-behavior"
  | "loss-aversion"
  | "anchoring"
  | "recency-bias"
  | "confirmation-bias"
  | "overreaction"
  | "underreaction"
  | "disposition-effect"
  | "gamblers-fallacy";

export const BIAS_LABELS: Record<BiasKind, string> = {
  "overconfidence": "Overconfidence",
  "herd-behavior": "Herd behavior",
  "loss-aversion": "Loss aversion",
  "anchoring": "Anchoring",
  "recency-bias": "Recency bias",
  "confirmation-bias": "Confirmation bias",
  "overreaction": "Overreaction to news",
  "underreaction": "Underreaction to news",
  "disposition-effect": "Disposition effect",
  "gamblers-fallacy": "Gambler's fallacy",
};

export const BIAS_DESCRIPTIONS: Record<BiasKind, string> = {
  "overconfidence":
    "Traders place outsized bets on their own predictions, often with high concentration in one outcome.",
  "herd-behavior":
    "Traders cluster into the most-trafficked market or follow the dominant direction without independent analysis.",
  "loss-aversion":
    "Traders refuse to sell losing positions to avoid realizing a loss, even when better trades exist.",
  "anchoring":
    "Traders weight an initial price (or salient number) too heavily when valuing later information.",
  "recency-bias":
    "Recent streaks or moves are extrapolated into the future, overweighting the latest data points.",
  "confirmation-bias":
    "Traders seek out information that supports their existing position and dismiss disconfirming evidence.",
  "overreaction":
    "Prices move further than fundamentals justify after new information, then partially revert.",
  "underreaction":
    "Prices fail to fully incorporate new information, drifting in the same direction over time.",
  "disposition-effect":
    "Traders sell winning positions too early and hold losing positions too long.",
  "gamblers-fallacy":
    "After a streak in one direction, traders bet on a reversal as if past outcomes affect independent events.",
};

// ── Per-pattern detection ──────────────────────────────────────────

export interface BiasFinding {
  id: string;
  bias: BiasKind;
  /** User the pattern was observed in. */
  userId: string;
  displayName: string;
  /** Magnitude of the pattern (interpretation depends on bias kind). */
  magnitude: number;
  /** Plain-language factual description of what was measured. */
  detail: string;
  /** Trade IDs that contributed to this finding. */
  tradeIds: string[];
  /** Market most associated with the finding (optional). */
  marketId?: string;
}

export interface BehavioralSummary {
  /** All findings, sorted by magnitude desc. */
  findings: BiasFinding[];
  /** Count of findings per bias kind. */
  countsByBias: Record<BiasKind, number>;
  /** Number of unique traders showing at least one finding. */
  affectedTraders: number;
  /** Total trades analyzed. */
  totalTrades: number;
}

// ── Tunables ───────────────────────────────────────────────────────

const CHASING_PRICE_MOVE = 0.06;        // 6¢ move triggers a "chase" window
const CHASING_WINDOW_MS = 5 * 60_000;   // 5 min lookahead
const PEAK_LOOKAHEAD = 3;               // trades after a buy used to detect a peak
const PEAK_DROP_THRESHOLD = 0.04;       // ≥ 4¢ drop after the buy
const DISPOSITION_HOLD_MS = 10 * 60_000;// holding a losing pos > 10 min
const DISPOSITION_LOSS_THRESHOLD = 0.05;// ≥ 5¢ below avg cost
const OVERCONFIDENCE_CONCENTRATION = 0.6; // ≥ 60% of user's volume in one outcome
const OVERCONFIDENCE_MIN_VOLUME = 200;  // and ≥ $200 volume
const HERD_MARKET_SHARE = 0.4;          // user's volume share in one market ≥ 40%
const HERD_MIN_TRADES = 4;
const DIVERSIFICATION_MIN_TRADES = 6;   // user with ≥ N trades but ≤ 1 market = no diversification
const GAMBLERS_RUN_LENGTH = 4;          // ≥ 4 same-direction trades market-wide
const GAMBLERS_REVERSAL_TRADES = 3;     // user trades opposite within next N

// ── Helpers ────────────────────────────────────────────────────────

function nameLookup(trades: Trade[], userId: string): string {
  // The trade ledger doesn't carry display names, so callers should
  // pass a lookup. Here we just return the userId as fallback.
  return userId;
}

function uid() {
  return `bf-${crypto.randomUUID().slice(0, 8)}`;
}

// ── Main analyzer ──────────────────────────────────────────────────

export interface AnalyzeInput {
  markets: Market[];
  trades: Trade[];
  /** Map of userId → display name. */
  displayNames: Record<string, string>;
}

export function analyzeBehavior({
  markets,
  trades,
  displayNames,
}: AnalyzeInput): BehavioralSummary {
  const findings: BiasFinding[] = [];
  const countsByBias: Record<BiasKind, number> = {
    "overconfidence": 0,
    "herd-behavior": 0,
    "loss-aversion": 0,
    "anchoring": 0,
    "recency-bias": 0,
    "confirmation-bias": 0,
    "overreaction": 0,
    "underreaction": 0,
    "disposition-effect": 0,
    "gamblers-fallacy": 0,
  };

  const nameOf = (uid: string) => displayNames[uid] ?? uid;

  if (trades.length === 0) {
    return { findings, countsByBias, affectedTraders: 0, totalTrades: 0 };
  }

  const sorted = [...trades].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Group trades per user for cross-trade analyses.
  const byUser = new Map<string, Trade[]>();
  for (const t of sorted) {
    if (!byUser.has(t.userId)) byUser.set(t.userId, []);
    byUser.get(t.userId)!.push(t);
  }

  // Group per market for market-wide pattern detection.
  const byMarket = new Map<string, Trade[]>();
  for (const t of sorted) {
    if (!byMarket.has(t.marketId)) byMarket.set(t.marketId, []);
    byMarket.get(t.marketId)!.push(t);
  }

  // ── Overconfidence: high concentration of one user in one outcome ─
  for (const [userId, uTrades] of byUser) {
    const totalVol = uTrades.reduce((s, t) => s + t.totalCost, 0);
    if (totalVol < OVERCONFIDENCE_MIN_VOLUME) continue;
    const byOutcome = new Map<string, { vol: number; name: string; ids: string[] }>();
    for (const t of uTrades) {
      if (!byOutcome.has(t.outcomeId)) {
        byOutcome.set(t.outcomeId, { vol: 0, name: t.outcomeName, ids: [] });
      }
      const e = byOutcome.get(t.outcomeId)!;
      e.vol += t.totalCost;
      e.ids.push(t.id);
    }
    const top = [...byOutcome.entries()].sort((a, b) => b[1].vol - a[1].vol)[0];
    const share = top[1].vol / totalVol;
    if (share >= OVERCONFIDENCE_CONCENTRATION) {
      findings.push({
        id: uid(),
        bias: "overconfidence",
        userId,
        displayName: nameOf(userId),
        magnitude: share,
        detail: `Concentrated ${(share * 100).toFixed(0)}% of $${totalVol.toFixed(0)} traded into "${top[1].name}".`,
        tradeIds: top[1].ids,
      });
    }
  }

  // ── Herd: user's volume share in a single market is high ────────
  for (const [userId, uTrades] of byUser) {
    if (uTrades.length < HERD_MIN_TRADES) continue;
    const byMkt = new Map<string, { vol: number; title: string; ids: string[] }>();
    const totalVol = uTrades.reduce((s, t) => s + t.totalCost, 0);
    for (const t of uTrades) {
      if (!byMkt.has(t.marketId)) {
        byMkt.set(t.marketId, { vol: 0, title: t.marketTitle, ids: [] });
      }
      const e = byMkt.get(t.marketId)!;
      e.vol += t.totalCost;
      e.ids.push(t.id);
    }
    // Find the most-trafficked market across the class.
    const classByMkt = new Map<string, number>();
    for (const t of sorted) {
      classByMkt.set(t.marketId, (classByMkt.get(t.marketId) ?? 0) + t.totalCost);
    }
    const topClassMkt = [...classByMkt.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topClassMkt) continue;
    const userInTop = byMkt.get(topClassMkt);
    if (userInTop && userInTop.vol / totalVol >= HERD_MARKET_SHARE) {
      findings.push({
        id: uid(),
        bias: "herd-behavior",
        userId,
        displayName: nameOf(userId),
        magnitude: userInTop.vol / totalVol,
        detail: `Placed ${(userInTop.vol / totalVol * 100).toFixed(0)}% of personal volume in "${userInTop.title}", the most-trafficked market in the class.`,
        tradeIds: userInTop.ids,
        marketId: topClassMkt,
      });
    }
  }

  // ── Loss aversion / disposition effect ──────────────────────────
  // For each user × outcome, compute running average cost and check
  // whether they held positions trading below avgCost for a long time
  // (loss aversion) and whether they sold winners early (disposition).
  for (const [userId, uTrades] of byUser) {
    type Pos = { shares: number; avgCost: number; lastBuyTime: number; ids: string[]; outcomeName: string };
    const positions = new Map<string, Pos>();
    const dispositionWinners: { ids: string[]; outcomeName: string; gain: number }[] = [];

    for (const t of uTrades) {
      const key = `${t.marketId}:${t.outcomeId}`;
      const pos = positions.get(key) ?? { shares: 0, avgCost: 0, lastBuyTime: 0, ids: [], outcomeName: t.outcomeName };
      if (t.type === "BUY") {
        const newShares = pos.shares + t.quantity;
        pos.avgCost =
          newShares > 0
            ? (pos.avgCost * pos.shares + t.pricePerShare * t.quantity) / newShares
            : 0;
        pos.shares = newShares;
        pos.lastBuyTime = new Date(t.timestamp).getTime();
        pos.ids.push(t.id);
      } else {
        // SELL
        const gain = t.pricePerShare - pos.avgCost;
        if (pos.shares > 0 && gain >= 0.03) {
          // Disposition: selling a winner. Check whether the user still
          // holds losers in other markets at the same time.
          dispositionWinners.push({ ids: [...pos.ids, t.id], outcomeName: t.outcomeName, gain });
        }
        pos.shares = Math.max(0, pos.shares - t.quantity);
        pos.ids.push(t.id);
      }
      positions.set(key, pos);
    }

    // Loss aversion: open positions held > threshold while market price
    // is well below avg cost.
    const now = sorted[sorted.length - 1]
      ? new Date(sorted[sorted.length - 1].timestamp).getTime()
      : Date.now();
    for (const [key, pos] of positions) {
      if (pos.shares <= 0) continue;
      const [marketId, outcomeId] = key.split(":");
      const market = markets.find((m) => m.id === marketId);
      const outcome = market?.outcomes.find((o) => o.id === outcomeId);
      if (!outcome) continue;
      const loss = pos.avgCost - outcome.price;
      const heldMs = now - pos.lastBuyTime;
      if (
        loss >= DISPOSITION_LOSS_THRESHOLD &&
        heldMs >= DISPOSITION_HOLD_MS
      ) {
        findings.push({
          id: uid(),
          bias: "loss-aversion",
          userId,
          displayName: nameOf(userId),
          magnitude: loss,
          detail: `Still holding ${pos.shares} shares of "${pos.outcomeName}" at ${(loss * 100).toFixed(1)}¢ below avg cost (${(pos.avgCost * 100).toFixed(0)}¢ → ${(outcome.price * 100).toFixed(0)}¢).`,
          tradeIds: pos.ids,
          marketId,
        });
      }
    }

    // Disposition effect: sold winners while still holding losers.
    if (dispositionWinners.length > 0) {
      const stillHoldingLoser = [...positions.entries()].some(([key, pos]) => {
        if (pos.shares <= 0) return false;
        const [mid, oid] = key.split(":");
        const m = markets.find((mm) => mm.id === mid);
        const o = m?.outcomes.find((oo) => oo.id === oid);
        if (!o) return false;
        return pos.avgCost - o.price >= 0.03;
      });
      if (stillHoldingLoser) {
        const sample = dispositionWinners[0];
        findings.push({
          id: uid(),
          bias: "disposition-effect",
          userId,
          displayName: nameOf(userId),
          magnitude: sample.gain,
          detail: `Sold winning position in "${sample.outcomeName}" (+${(sample.gain * 100).toFixed(1)}¢) while continuing to hold a losing position in another market.`,
          tradeIds: sample.ids,
        });
      }
    }
  }

  // ── Chasing / recency bias / overreaction ───────────────────────
  // After a market-wide price move ≥ CHASING_PRICE_MOVE within 5 min,
  // detect users who buy in the same direction inside that window
  // (chasing the move).
  for (const [marketId, mTrades] of byMarket) {
    const market = markets.find((m) => m.id === marketId);
    for (let i = 1; i < mTrades.length; i++) {
      const a = mTrades[i - 1];
      const b = mTrades[i];
      if (a.outcomeId !== b.outcomeId) continue;
      const moveDir = b.priceAfterTrade - a.priceAfterTrade;
      if (Math.abs(moveDir) < CHASING_PRICE_MOVE) continue;
      const tStart = new Date(b.timestamp).getTime();
      const chasers = mTrades.filter((t) => {
        const ts = new Date(t.timestamp).getTime();
        return (
          ts > tStart &&
          ts <= tStart + CHASING_WINDOW_MS &&
          t.outcomeId === b.outcomeId &&
          ((moveDir > 0 && t.type === "BUY") ||
            (moveDir < 0 && t.type === "SELL"))
        );
      });
      const chaserUsers = new Map<string, string[]>();
      for (const c of chasers) {
        if (!chaserUsers.has(c.userId)) chaserUsers.set(c.userId, []);
        chaserUsers.get(c.userId)!.push(c.id);
      }
      for (const [userId, ids] of chaserUsers) {
        if (ids.length >= 2) {
          findings.push({
            id: uid(),
            bias: "recency-bias",
            userId,
            displayName: nameOf(userId),
            magnitude: Math.abs(moveDir),
            detail: `Placed ${ids.length} ${moveDir > 0 ? "BUY" : "SELL"}s on "${b.outcomeName}" within 5 minutes of a ${(Math.abs(moveDir) * 100).toFixed(1)}¢ ${moveDir > 0 ? "rise" : "drop"}.`,
            tradeIds: ids,
            marketId,
          });
        }
      }

      // Overreaction: did the price reverse ≥ half the move within the next 10 trades?
      const after = mTrades.slice(i + 1, i + 11);
      const reversal = after.find((t) => {
        const delta = t.priceAfterTrade - b.priceAfterTrade;
        return Math.sign(delta) !== Math.sign(moveDir) && Math.abs(delta) >= Math.abs(moveDir) * 0.5;
      });
      if (reversal && market) {
        // Attribute to whoever pushed the original move.
        findings.push({
          id: uid(),
          bias: "overreaction",
          userId: b.userId,
          displayName: nameOf(b.userId),
          magnitude: Math.abs(moveDir),
          detail: `Price of "${b.outcomeName}" jumped ${(Math.abs(moveDir) * 100).toFixed(1)}¢ then reversed by half within ${after.indexOf(reversal) + 1} trades.`,
          tradeIds: [a.id, b.id, reversal.id],
          marketId,
        });
      }
    }
  }

  // ── Peak buying: bought just before a local price drop ──────────
  for (const [marketId, mTrades] of byMarket) {
    for (let i = 0; i < mTrades.length - PEAK_LOOKAHEAD; i++) {
      const t = mTrades[i];
      if (t.type !== "BUY") continue;
      const sameOutcomeAfter = mTrades
        .slice(i + 1, i + 1 + PEAK_LOOKAHEAD * 2)
        .filter((x) => x.outcomeId === t.outcomeId);
      if (sameOutcomeAfter.length === 0) continue;
      const minAfter = Math.min(...sameOutcomeAfter.map((x) => x.priceAfterTrade));
      const drop = t.priceAfterTrade - minAfter;
      if (drop >= PEAK_DROP_THRESHOLD) {
        findings.push({
          id: uid(),
          bias: "anchoring",
          userId: t.userId,
          displayName: nameOf(t.userId),
          magnitude: drop,
          detail: `Bought "${t.outcomeName}" at ${(t.priceAfterTrade * 100).toFixed(0)}¢; price dropped to ${(minAfter * 100).toFixed(0)}¢ within the next few trades.`,
          tradeIds: [t.id],
          marketId,
        });
      }
    }
  }

  // ── Lack of diversification ──────────────────────────────────────
  for (const [userId, uTrades] of byUser) {
    if (uTrades.length < DIVERSIFICATION_MIN_TRADES) continue;
    const distinctMarkets = new Set(uTrades.map((t) => t.marketId));
    if (distinctMarkets.size <= 1) {
      findings.push({
        id: uid(),
        bias: "confirmation-bias",
        userId,
        displayName: nameOf(userId),
        magnitude: uTrades.length,
        detail: `${uTrades.length} trades all placed in a single market — no exposure to alternative markets.`,
        tradeIds: uTrades.map((t) => t.id),
      });
    }
  }

  // ── Gambler's fallacy: bet against an established run ───────────
  for (const [marketId, mTrades] of byMarket) {
    // Per outcome, find runs of ≥ N same-type trades.
    const byOutcome = new Map<string, Trade[]>();
    for (const t of mTrades) {
      if (!byOutcome.has(t.outcomeId)) byOutcome.set(t.outcomeId, []);
      byOutcome.get(t.outcomeId)!.push(t);
    }
    for (const [, oTrades] of byOutcome) {
      let runStart = 0;
      for (let i = 1; i <= oTrades.length; i++) {
        const prev = oTrades[i - 1];
        const curr = oTrades[i];
        const breakRun = !curr || curr.type !== prev.type;
        if (breakRun && i - runStart >= GAMBLERS_RUN_LENGTH) {
          const runDir = oTrades[runStart].type;
          const reversers = oTrades.slice(i, i + GAMBLERS_REVERSAL_TRADES);
          for (const r of reversers) {
            if (r.type !== runDir) {
              findings.push({
                id: uid(),
                bias: "gamblers-fallacy",
                userId: r.userId,
                displayName: nameOf(r.userId),
                magnitude: i - runStart,
                detail: `Bet ${r.type} on "${r.outcomeName}" immediately after ${i - runStart} consecutive ${runDir}s in the same outcome.`,
                tradeIds: [r.id],
                marketId,
              });
            }
          }
        }
        if (breakRun) runStart = i;
      }
    }
  }

  // ── Underreaction: sustained directional drift with low participation ─
  for (const [marketId, mTrades] of byMarket) {
    if (mTrades.length < 8) continue;
    const first = mTrades[0];
    const last = mTrades[mTrades.length - 1];
    if (first.outcomeId !== last.outcomeId) continue;
    const drift = last.priceAfterTrade - first.priceAfterTrade;
    if (Math.abs(drift) < 0.1) continue;
    const distinctTraders = new Set(mTrades.map((t) => t.userId)).size;
    if (distinctTraders <= 3) {
      // Few traders moved a lot — suggests slow uptake of the signal.
      const market = markets.find((m) => m.id === marketId);
      findings.push({
        id: uid(),
        bias: "underreaction",
        userId: first.userId,
        displayName: nameOf(first.userId),
        magnitude: Math.abs(drift),
        detail: `"${first.outcomeName}" drifted ${(drift * 100).toFixed(1)}¢ over ${mTrades.length} trades but only ${distinctTraders} distinct traders participated.`,
        tradeIds: mTrades.slice(0, 3).map((t) => t.id),
        marketId,
      });
    }
  }

  // ── Tally ────────────────────────────────────────────────────────
  for (const f of findings) countsByBias[f.bias] += 1;
  const affectedTraders = new Set(findings.map((f) => f.userId)).size;

  // Sort by magnitude descending.
  findings.sort((a, b) => b.magnitude - a.magnitude);

  return {
    findings,
    countsByBias,
    affectedTraders,
    totalTrades: trades.length,
  };
}

// ── Group comparison ───────────────────────────────────────────────

export interface GroupComparisonInput extends AnalyzeInput {
  /** Group label → set of userIds. */
  groups: Record<string, string[]>;
}

export interface GroupComparison {
  groups: {
    label: string;
    userCount: number;
    summary: BehavioralSummary;
  }[];
}

export function compareGroups(input: GroupComparisonInput): GroupComparison {
  const groups = Object.entries(input.groups).map(([label, userIds]) => {
    const filtered = input.trades.filter((t) => userIds.includes(t.userId));
    return {
      label,
      userCount: userIds.length,
      summary: analyzeBehavior({
        markets: input.markets,
        trades: filtered,
        displayNames: input.displayNames,
      }),
    };
  });
  return { groups };
}
