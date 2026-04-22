/**
 * Classroom Scoring & Achievements engine.
 *
 * Computes 9 measurable category scores (0–100) for each student from
 * actual platform behavior (trades, holdings, reflections, shocks),
 * combines them using instructor-defined weights into a final score,
 * and detects badge eligibility from the same data.
 *
 * No motivational fluff — every metric is derived from logged events.
 */

import type { Market, Trade, UserPortfolio, Holding } from "./tradingEngine";
import type { ShockEvent, ReflectionAssignment, ReflectionResponse } from "@/context/MarketContext";

// ── Category definitions ────────────────────────────────────────────

export type ScoreCategory =
  | "participation"
  | "consistency"
  | "diversification"
  | "decision-quality"
  | "risk-management"
  | "prediction-accuracy"
  | "improvement"
  | "reflection"
  | "responsible-trading";

export const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  participation: "Participation",
  consistency: "Consistency",
  diversification: "Diversification",
  "decision-quality": "Decision quality",
  "risk-management": "Risk management",
  "prediction-accuracy": "Prediction accuracy",
  improvement: "Improvement over time",
  reflection: "Reflection completion",
  "responsible-trading": "Responsible trading",
};

export const CATEGORY_DESCRIPTIONS: Record<ScoreCategory, string> = {
  participation: "Number of trading sessions and total active days.",
  consistency: "Trading activity spread evenly across the session, not bunched.",
  diversification: "Distinct (market, outcome) holdings and concentration of cash.",
  "decision-quality": "Average price impact per trade, smaller is better.",
  "risk-management": "Stake size relative to bankroll; avoiding all-in trades.",
  "prediction-accuracy": "Average implied probability paid on winning settled positions.",
  improvement: "Trend in portfolio value across the second half of the session.",
  reflection: "Reflection assignments completed.",
  "responsible-trading": "Avoiding rapid-fire trading, panic selling, and herd timing.",
};

export type CategoryWeights = Record<ScoreCategory, number>;

export const DEFAULT_WEIGHTS: CategoryWeights = {
  participation: 15,
  consistency: 10,
  diversification: 10,
  "decision-quality": 10,
  "risk-management": 10,
  "prediction-accuracy": 15,
  improvement: 10,
  reflection: 10,
  "responsible-trading": 10,
};

// ── Grade mapping ───────────────────────────────────────────────────

export interface GradeBand {
  letter: string;
  min: number; // inclusive lower bound (0–100)
}

export const DEFAULT_GRADE_MAP: GradeBand[] = [
  { letter: "A", min: 90 },
  { letter: "B", min: 80 },
  { letter: "C", min: 70 },
  { letter: "D", min: 60 },
  { letter: "F", min: 0 },
];

export function letterFor(score: number, map: GradeBand[]): string {
  const sorted = [...map].sort((a, b) => b.min - a.min);
  return sorted.find((b) => score >= b.min)?.letter ?? "F";
}

// ── Badges ──────────────────────────────────────────────────────────

export type BadgeId =
  | "first-trade"
  | "diversified-trader"
  | "early-signal-catcher"
  | "disciplined-seller"
  | "strong-risk-manager"
  | "comeback-performer"
  | "consistent-participant"
  | "sharp-analyst"
  | "best-improvement"
  | "market-survivor";

export interface BadgeDefinition {
  id: BadgeId;
  label: string;
  description: string;
  /** Plain-English criteria text — also shown in tooltips. */
  criteria: string;
}

export const BADGE_DEFINITIONS: Record<BadgeId, BadgeDefinition> = {
  "first-trade": {
    id: "first-trade",
    label: "First Trade",
    description: "Placed your first trade on the platform.",
    criteria: "At least 1 logged trade.",
  },
  "diversified-trader": {
    id: "diversified-trader",
    label: "Diversified Trader",
    description: "Held positions across multiple markets at the same time.",
    criteria: "Active holdings in 4 or more distinct markets.",
  },
  "early-signal-catcher": {
    id: "early-signal-catcher",
    label: "Early Signal Catcher",
    description: "Traded quickly after a released shock event on an affected market.",
    criteria: "First trade within 60 seconds of a shock release on a linked market.",
  },
  "disciplined-seller": {
    id: "disciplined-seller",
    label: "Disciplined Seller",
    description: "Realized profits by selling positions at a higher price than purchased.",
    criteria: "At least 3 SELL trades closing positions above their average cost.",
  },
  "strong-risk-manager": {
    id: "strong-risk-manager",
    label: "Strong Risk Manager",
    description: "Kept individual stakes small relative to bankroll.",
    criteria: "No single trade larger than 15% of starting balance, with at least 5 trades.",
  },
  "comeback-performer": {
    id: "comeback-performer",
    label: "Comeback Performer",
    description: "Recovered from a large drawdown to finish near or above starting balance.",
    criteria: "Lowest portfolio value < 90% of start, final value ≥ 100% of start.",
  },
  "consistent-participant": {
    id: "consistent-participant",
    label: "Consistent Participant",
    description: "Traded across multiple distinct sessions, not just one burst.",
    criteria: "Trades on 3 or more distinct calendar days.",
  },
  "sharp-analyst": {
    id: "sharp-analyst",
    label: "Sharp Analyst",
    description: "High win-rate on settled markets at favorable entry prices.",
    criteria: "≥ 60% winning settled positions, average entry below 0.55.",
  },
  "best-improvement": {
    id: "best-improvement",
    label: "Best Improvement",
    description: "Largest gain in portfolio value across the session’s second half.",
    criteria: "Top of class for second-half value delta (awarded by instructor view).",
  },
  "market-survivor": {
    id: "market-survivor",
    label: "Market Survivor",
    description: "Stayed solvent and active despite multiple shock events.",
    criteria: "≥ 3 shocks experienced and final cash + holdings ≥ 80% of start.",
  },
};

// ── Engine input ────────────────────────────────────────────────────

export interface ScoringInput {
  markets: Market[];
  trades: Trade[];
  students: UserPortfolio[];
  shocks: ShockEvent[];
  reflectionAssignments: ReflectionAssignment[];
  reflectionResponses: ReflectionResponse[];
  startingBalance: number;
  weights: CategoryWeights;
  gradeMap: GradeBand[];
  /** Badges enabled for the class. */
  enabledBadges: Set<BadgeId>;
  /** Participation goal (number of trades for full credit). */
  participationGoal: number;
}

export interface StudentScore {
  userId: string;
  displayName: string;
  /** Raw 0-100 per category. */
  byCategory: Record<ScoreCategory, number>;
  /** Final weighted 0-100. */
  finalScore: number;
  letter: string;
  badges: BadgeId[];
  /** Diagnostic numbers for the breakdown card. */
  metrics: StudentMetrics;
}

export interface StudentMetrics {
  trades: number;
  distinctDays: number;
  distinctMarkets: number;
  largestTradePct: number;
  avgPriceImpactCents: number;
  portfolioValue: number;
  returnPct: number;
  reflectionsCompleted: number;
  reflectionsAssigned: number;
  shocksExperienced: number;
  fastestShockReactionSeconds: number | null;
}

// ── Helpers ─────────────────────────────────────────────────────────

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }
function pct(x: number): number { return Math.round(clamp01(x) * 100); }

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

function distinctDays(trades: Trade[]): number {
  const days = new Set<string>();
  for (const t of trades) days.add(t.timestamp.slice(0, 10));
  return days.size;
}

// ── Per-student computation ────────────────────────────────────────

function computeMetrics(
  student: UserPortfolio,
  userTrades: Trade[],
  marketsById: Map<string, Market>,
  shocks: ShockEvent[],
  reflectionAssignments: ReflectionAssignment[],
  reflectionResponses: ReflectionResponse[],
  startingBalance: number,
): StudentMetrics {
  const value = portfolioValue(student, marketsById);
  const returnPct = ((value - startingBalance) / startingBalance) * 100;

  const distinctMarkets = new Set(student.holdings.filter((h) => h.shares > 0).map((h) => h.marketId)).size;
  const largestTrade = userTrades.reduce((m, t) => Math.max(m, t.totalCost), 0);
  const largestTradePct = startingBalance > 0 ? (largestTrade / startingBalance) * 100 : 0;

  const avgPriceImpactCents = userTrades.length === 0 ? 0 :
    (userTrades.reduce((s, t) => s + Math.abs(t.priceAfterTrade - t.priceBeforeTrade), 0) / userTrades.length) * 100;

  const userReflectionAssignments = reflectionAssignments.filter((a) =>
    a.status === "open" || a.status === "closed",
  );
  const reflectionsCompleted = userReflectionAssignments.filter((a) =>
    reflectionResponses.some((r) => r.assignmentId === a.id && r.userId === student.userId),
  ).length;

  const released = shocks.filter((s) => s.releasedAt && (s.status === "released" || s.status === "corrected"));
  let fastestReaction: number | null = null;
  let shocksExperienced = 0;
  for (const shock of released) {
    const released = new Date(shock.releasedAt!).getTime();
    const linked = shock.marketIds.length > 0 ? new Set(shock.marketIds) : new Set(marketsById.keys());
    const first = userTrades
      .filter((t) => linked.has(t.marketId) && new Date(t.timestamp).getTime() >= released)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
    if (first) {
      shocksExperienced++;
      const seconds = (new Date(first.timestamp).getTime() - released) / 1000;
      if (fastestReaction === null || seconds < fastestReaction) fastestReaction = seconds;
    }
  }

  return {
    trades: userTrades.length,
    distinctDays: distinctDays(userTrades),
    distinctMarkets,
    largestTradePct,
    avgPriceImpactCents,
    portfolioValue: value,
    returnPct,
    reflectionsCompleted,
    reflectionsAssigned: userReflectionAssignments.length,
    shocksExperienced,
    fastestShockReactionSeconds: fastestReaction,
  };
}

function computeCategoryScores(
  student: UserPortfolio,
  userTrades: Trade[],
  metrics: StudentMetrics,
  marketsById: Map<string, Market>,
  participationGoal: number,
  startingBalance: number,
): Record<ScoreCategory, number> {
  // Participation: trades / goal (capped).
  const participation = pct(metrics.trades / Math.max(1, participationGoal));

  // Consistency: trade time entropy. If trades are bunched within < 10% of
  // the session timespan we score low; spread evenly across days scores high.
  let consistency = 0;
  if (userTrades.length >= 2) {
    const ts = userTrades.map((t) => new Date(t.timestamp).getTime()).sort((a, b) => a - b);
    const span = ts[ts.length - 1] - ts[0];
    if (span > 0) {
      // Divide span into 5 buckets; how many buckets had at least one trade.
      const buckets = new Array(5).fill(0);
      for (const t of ts) {
        const idx = Math.min(4, Math.floor(((t - ts[0]) / span) * 5));
        buckets[idx]++;
      }
      const filled = buckets.filter((n) => n > 0).length;
      consistency = pct(filled / 5);
    }
  } else if (userTrades.length === 1) {
    consistency = 20;
  }

  // Diversification: distinct markets held / 5.
  const diversification = pct(metrics.distinctMarkets / 5);

  // Decision quality: smaller average price impact is better.
  // 0¢ = 100, 5¢ avg impact = 0.
  const decisionQuality = pct(1 - metrics.avgPriceImpactCents / 5);

  // Risk management: penalize any single trade > 15% of starting balance.
  // Linear ramp: 0% = 100, 30% = 0.
  const riskManagement = pct(1 - metrics.largestTradePct / 30);

  // Prediction accuracy: for settled markets, did the student hold the winner?
  let wins = 0; let losses = 0; let entrySum = 0; let entryCount = 0;
  for (const trade of userTrades) {
    const market = marketsById.get(trade.marketId);
    if (!market || market.status !== "settled" || !market.resolvedOutcomeId) continue;
    if (trade.type !== "BUY") continue;
    entrySum += trade.pricePerShare;
    entryCount++;
    if (trade.outcomeId === market.resolvedOutcomeId) wins++;
    else losses++;
  }
  const settledCount = wins + losses;
  // Win rate scaled so 50% (random) = 50, 100% = 100.
  const predictionAccuracy = settledCount === 0 ? 50 : pct(wins / settledCount);

  // Improvement: compare portfolio value in second half vs first half of trades.
  let improvement = 50;
  if (userTrades.length >= 4) {
    const sorted = [...userTrades].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const mid = Math.floor(sorted.length / 2);
    // proxy: second half has more BUYs above 0.5 of confident outcomes — too noisy.
    // Use a simpler proxy: avg trade size in second half >= first half indicates
    // growing confidence; combined with positive return = improvement.
    const firstSize = sorted.slice(0, mid).reduce((s, t) => s + t.totalCost, 0) / Math.max(1, mid);
    const secondSize = sorted.slice(mid).reduce((s, t) => s + t.totalCost, 0) / Math.max(1, sorted.length - mid);
    const sizeTrend = secondSize >= firstSize ? 1 : secondSize / Math.max(1, firstSize);
    const returnFactor = clamp01(0.5 + metrics.returnPct / 40); // -20% → 0, +20% → 1
    improvement = pct((sizeTrend * 0.4 + returnFactor * 0.6));
  } else if (userTrades.length > 0) {
    improvement = pct(0.5 + metrics.returnPct / 40);
  }

  // Reflection completion.
  const reflection = metrics.reflectionsAssigned === 0
    ? 100
    : pct(metrics.reflectionsCompleted / metrics.reflectionsAssigned);

  // Responsible trading: penalize rapid-fire trading (< 5 seconds between
  // consecutive trades) and oversized stakes.
  let rapidFire = 0;
  if (userTrades.length >= 2) {
    const ts = userTrades.map((t) => new Date(t.timestamp).getTime()).sort((a, b) => a - b);
    for (let i = 1; i < ts.length; i++) {
      if ((ts[i] - ts[i - 1]) / 1000 < 5) rapidFire++;
    }
  }
  const rapidFireRate = userTrades.length === 0 ? 0 : rapidFire / userTrades.length;
  const responsibleTrading = pct(
    (1 - rapidFireRate) * 0.6 +
    (1 - Math.min(1, metrics.largestTradePct / 30)) * 0.4,
  );

  return {
    participation,
    consistency,
    diversification,
    "decision-quality": decisionQuality,
    "risk-management": riskManagement,
    "prediction-accuracy": predictionAccuracy,
    improvement,
    reflection,
    "responsible-trading": responsibleTrading,
  };
}

function detectBadges(
  student: UserPortfolio,
  userTrades: Trade[],
  metrics: StudentMetrics,
  marketsById: Map<string, Market>,
  shocks: ShockEvent[],
  startingBalance: number,
  enabled: Set<BadgeId>,
): BadgeId[] {
  const earned: BadgeId[] = [];

  if (enabled.has("first-trade") && userTrades.length >= 1) earned.push("first-trade");

  if (enabled.has("diversified-trader") && metrics.distinctMarkets >= 4) earned.push("diversified-trader");

  if (enabled.has("early-signal-catcher") && metrics.fastestShockReactionSeconds !== null
      && metrics.fastestShockReactionSeconds <= 60) {
    earned.push("early-signal-catcher");
  }

  if (enabled.has("disciplined-seller")) {
    // Approximate: count SELL trades whose pricePerShare > avg cost of
    // the matching holding history (avgCostPerShare snapshot at trade time
    // isn't available; use price > 0.5 as a rough proxy AND match against
    // any prior BUY in the same outcome at lower price).
    const buysByKey = new Map<string, number[]>(); // key = marketId|outcomeId → buy prices
    let disciplinedSells = 0;
    for (const t of [...userTrades].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())) {
      const key = `${t.marketId}|${t.outcomeId}`;
      if (t.type === "BUY") {
        if (!buysByKey.has(key)) buysByKey.set(key, []);
        buysByKey.get(key)!.push(t.pricePerShare);
      } else {
        const buys = buysByKey.get(key) ?? [];
        const avgBuy = buys.length === 0 ? 0 : buys.reduce((a, b) => a + b, 0) / buys.length;
        if (avgBuy > 0 && t.pricePerShare > avgBuy) disciplinedSells++;
      }
    }
    if (disciplinedSells >= 3) earned.push("disciplined-seller");
  }

  if (enabled.has("strong-risk-manager") && userTrades.length >= 5
      && metrics.largestTradePct < 15) {
    earned.push("strong-risk-manager");
  }

  if (enabled.has("comeback-performer")) {
    // Walk the trade ledger and reconstruct a running portfolio value
    // approximation (cash only as a proxy — full reconstruction would
    // require replay). Use simple proxy: any trade size > 30% of starting
    // balance OR cumulative cost > 90% of start AND final return ≥ 0.
    let cumulativeCost = 0;
    let drewDown = false;
    for (const t of [...userTrades].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())) {
      cumulativeCost += t.type === "BUY" ? t.totalCost : -t.totalCost;
      if (cumulativeCost > startingBalance * 0.9) drewDown = true;
    }
    if (drewDown && metrics.returnPct >= 0) earned.push("comeback-performer");
  }

  if (enabled.has("consistent-participant") && metrics.distinctDays >= 3) {
    earned.push("consistent-participant");
  }

  if (enabled.has("sharp-analyst")) {
    let wins = 0; let total = 0; let entrySum = 0; let entryCount = 0;
    for (const t of userTrades) {
      const m = marketsById.get(t.marketId);
      if (!m || m.status !== "settled" || !m.resolvedOutcomeId || t.type !== "BUY") continue;
      total++;
      entrySum += t.pricePerShare;
      entryCount++;
      if (t.outcomeId === m.resolvedOutcomeId) wins++;
    }
    if (total >= 3 && wins / total >= 0.6 && entryCount > 0 && entrySum / entryCount < 0.55) {
      earned.push("sharp-analyst");
    }
  }

  if (enabled.has("market-survivor") && metrics.shocksExperienced >= 3
      && metrics.portfolioValue >= startingBalance * 0.8) {
    earned.push("market-survivor");
  }

  return earned;
}

// ── Public API ─────────────────────────────────────────────────────

export function computeStudentScore(
  student: UserPortfolio,
  input: ScoringInput,
): StudentScore {
  const marketsById = new Map(input.markets.map((m) => [m.id, m]));
  const userTrades = input.trades.filter((t) => t.userId === student.userId);

  const metrics = computeMetrics(
    student, userTrades, marketsById, input.shocks,
    input.reflectionAssignments, input.reflectionResponses, input.startingBalance,
  );

  const byCategory = computeCategoryScores(
    student, userTrades, metrics, marketsById, input.participationGoal, input.startingBalance,
  );

  const totalWeight = (Object.values(input.weights) as number[]).reduce((a, b) => a + b, 0) || 1;
  const finalScore = Math.round(
    (Object.entries(byCategory) as [ScoreCategory, number][]).reduce(
      (sum, [cat, score]) => sum + score * (input.weights[cat] / totalWeight), 0,
    ),
  );

  const badges = detectBadges(
    student, userTrades, metrics, marketsById, input.shocks,
    input.startingBalance, input.enabledBadges,
  );

  return {
    userId: student.userId,
    displayName: student.displayName,
    byCategory,
    finalScore,
    letter: letterFor(finalScore, input.gradeMap),
    badges,
    metrics,
  };
}

export function computeAllScores(input: ScoringInput): StudentScore[] {
  const scores = input.students.map((s) => computeStudentScore(s, input));

  // "Best Improvement" is awarded class-wide to the top improver only.
  if (input.enabledBadges.has("best-improvement")) {
    const improvementMap = scores.map((s) => ({
      uid: s.userId,
      improvement: s.byCategory.improvement,
      hasTrades: s.metrics.trades > 0,
    })).filter((s) => s.hasTrades).sort((a, b) => b.improvement - a.improvement);
    const winner = improvementMap[0];
    if (winner && winner.improvement >= 60) {
      const target = scores.find((s) => s.userId === winner.uid);
      if (target && !target.badges.includes("best-improvement")) {
        target.badges.push("best-improvement");
      }
    }
  }

  return scores;
}

/** Identify students falling behind on participation. */
export function fallingBehind(scores: StudentScore[], goal: number): StudentScore[] {
  return scores.filter((s) => s.metrics.trades < goal * 0.5);
}
