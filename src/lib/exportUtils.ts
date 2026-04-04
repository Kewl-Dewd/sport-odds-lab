/**
 * Export utilities for Sports Market Lab — CSV generation and grading calculations.
 * All metrics are deterministic and derived from actual platform data.
 */

import type { Market, Trade, UserPortfolio } from "./tradingEngine";
import { calculatePortfolioValue } from "./tradingEngine";
import { calculateAllStudentStats, type StudentStats } from "./studentAnalytics";

// ── Grading Configuration ─────────────────────────────────────────

export type GradingMode =
  | "participation"
  | "participation_reflection"
  | "return_performance"
  | "decision_quality"
  | "custom";

export interface GradingWeights {
  participation: number;    // 0-100
  returnPerformance: number;
  decisionQuality: number;
  riskManagement: number;
}

export interface GradingConfig {
  mode: GradingMode;
  weights: GradingWeights;
  leaderboardPublic: boolean;
  showRealNames: boolean; // false = aliases only
}

export const DEFAULT_GRADING_CONFIG: GradingConfig = {
  mode: "participation",
  weights: { participation: 40, returnPerformance: 20, decisionQuality: 20, riskManagement: 20 },
  leaderboardPublic: true,
  showRealNames: true,
};

export const GRADING_PRESETS: Record<Exclude<GradingMode, "custom">, GradingWeights> = {
  participation: { participation: 100, returnPerformance: 0, decisionQuality: 0, riskManagement: 0 },
  participation_reflection: { participation: 60, returnPerformance: 0, decisionQuality: 20, riskManagement: 20 },
  return_performance: { participation: 20, returnPerformance: 50, decisionQuality: 15, riskManagement: 15 },
  decision_quality: { participation: 15, returnPerformance: 15, decisionQuality: 40, riskManagement: 30 },
};

// ── Grading Metrics ───────────────────────────────────────────────

export interface GradingMetrics {
  userId: string;
  displayName: string;
  participationScore: number;    // 0-100
  completionScore: number;       // 0-100
  activeTradingDays: number;
  marketsEngaged: number;
  decisionScore: number;
  riskScore: number;
  returnPct: number;
  compositeGrade: number;        // 0-100 weighted
  reflectionEligible: boolean;   // has enough data for meaningful reflection
}

export function calculateGradingMetrics(
  students: UserPortfolio[],
  trades: Trade[],
  markets: Market[],
  startingBalance: number,
  config: GradingConfig,
): GradingMetrics[] {
  const allStats = calculateAllStudentStats(students, trades, markets, startingBalance);
  const totalMarkets = markets.filter((m) => m.status !== "settled" || m.status === "settled").length;

  return allStats.map((stats) => {
    const userTrades = trades.filter((t) => t.userId === stats.userId);

    // Active trading days
    const tradeDays = new Set(userTrades.map((t) => new Date(t.timestamp).toDateString()));
    const activeTradingDays = tradeDays.size;

    // Participation: trade count relative to reasonable target (e.g., 2 per market)
    const targetTrades = Math.max(totalMarkets * 2, 5);
    const participationScore = Math.min(100, Math.round((stats.tradeCount / targetTrades) * 100));

    // Completion: % of markets engaged
    const completionScore = totalMarkets > 0 ? Math.min(100, Math.round((stats.marketsTraded / totalMarkets) * 100)) : 0;

    // Reflection eligibility: at least 5 trades and 2 markets
    const reflectionEligible = stats.tradeCount >= 5 && stats.marketsTraded >= 2;

    // Composite grade
    const { weights } = config;
    const totalWeight = weights.participation + weights.returnPerformance + weights.decisionQuality + weights.riskManagement;
    const normalizedReturn = Math.min(100, Math.max(0, 50 + stats.totalReturnPct)); // center at 50

    const compositeGrade = totalWeight > 0
      ? Math.round(
          (participationScore * weights.participation +
           normalizedReturn * weights.returnPerformance +
           stats.decisionQuality.compositeScore * weights.decisionQuality +
           stats.riskMetrics.compositeScore * weights.riskManagement) / totalWeight
        )
      : participationScore;

    return {
      userId: stats.userId,
      displayName: stats.displayName,
      participationScore,
      completionScore,
      activeTradingDays,
      marketsEngaged: stats.marketsTraded,
      decisionScore: stats.decisionQuality.compositeScore,
      riskScore: stats.riskMetrics.compositeScore,
      returnPct: stats.totalReturnPct,
      compositeGrade,
      reflectionEligible,
    };
  });
}

// ── CSV Export Helpers ─────────────────────────────────────────────

function escCsv(v: string | number): string {
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvFromRows(header: string[], rows: (string | number)[][]): string {
  return [header.join(","), ...rows.map((r) => r.map(escCsv).join(","))].join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Specific Exports ──────────────────────────────────────────────

export function exportLeaderboardCsv(
  students: UserPortfolio[], markets: Market[], trades: Trade[], startingBalance: number,
) {
  const stats = calculateAllStudentStats(students, trades, markets, startingBalance);
  const header = ["Rank", "Name", "Portfolio Value", "Cash", "Return %", "Trades", "Win Rate", "Decision Score", "Risk Score"];
  const sorted = [...stats].sort((a, b) =>
    (calculatePortfolioValue(students.find((s) => s.userId === b.userId)!, markets).totalValue) -
    (calculatePortfolioValue(students.find((s) => s.userId === a.userId)!, markets).totalValue)
  );
  const rows = sorted.map((s, i) => {
    const pv = calculatePortfolioValue(students.find((st) => st.userId === s.userId)!, markets);
    return [i + 1, s.displayName, pv.totalValue.toFixed(2), pv.cash.toFixed(2), s.totalReturnPct.toFixed(1), s.tradeCount, (s.winRate * 100).toFixed(0) + "%", s.decisionQuality.compositeScore, s.riskMetrics.compositeScore];
  });
  downloadCsv("leaderboard.csv", csvFromRows(header, rows));
}

export function exportPortfolioSummaryCsv(
  students: UserPortfolio[], markets: Market[], trades: Trade[], startingBalance: number,
) {
  const stats = calculateAllStudentStats(students, trades, markets, startingBalance);
  const header = ["Name", "Cash", "Holdings Value", "Total Value", "Realized P&L", "Unrealized P&L", "Return %", "Trades", "Markets", "Win Rate"];
  const rows = stats.map((s) => {
    const pv = calculatePortfolioValue(students.find((st) => st.userId === s.userId)!, markets);
    return [s.displayName, pv.cash.toFixed(2), pv.holdingsValue.toFixed(2), pv.totalValue.toFixed(2), s.realizedPnL.toFixed(2), s.unrealizedPnL.toFixed(2), s.totalReturnPct.toFixed(1), s.tradeCount, s.marketsTraded, (s.winRate * 100).toFixed(0) + "%"];
  });
  downloadCsv("portfolio_summaries.csv", csvFromRows(header, rows));
}

export function exportTradeHistoryByUserCsv(trades: Trade[], students: UserPortfolio[], userId?: string) {
  const filtered = userId ? trades.filter((t) => t.userId === userId) : trades;
  const sorted = [...filtered].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const header = ["Timestamp", "Trader", "Market", "Outcome", "Type", "Qty", "Price", "Cost", "Price Before", "Price After"];
  const rows = sorted.map((t) => {
    const student = students.find((s) => s.userId === t.userId);
    return [t.timestamp, student?.displayName ?? t.userId, t.marketTitle, t.outcomeName, t.type, t.quantity, t.pricePerShare.toFixed(4), t.totalCost.toFixed(2), t.priceBeforeTrade.toFixed(4), t.priceAfterTrade.toFixed(4)];
  });
  downloadCsv(userId ? `trades_${userId}.csv` : "trades_all.csv", csvFromRows(header, rows));
}

export function exportTradeHistoryByMarketCsv(trades: Trade[], students: UserPortfolio[], marketId: string, marketTitle: string) {
  const filtered = trades.filter((t) => t.marketId === marketId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const header = ["Timestamp", "Trader", "Outcome", "Type", "Qty", "Price", "Cost", "Price Before", "Price After"];
  const rows = filtered.map((t) => {
    const student = students.find((s) => s.userId === t.userId);
    return [t.timestamp, student?.displayName ?? t.userId, t.outcomeName, t.type, t.quantity, t.pricePerShare.toFixed(4), t.totalCost.toFixed(2), t.priceBeforeTrade.toFixed(4), t.priceAfterTrade.toFixed(4)];
  });
  downloadCsv(`trades_market_${marketTitle.replace(/\s+/g, "_")}.csv`, csvFromRows(header, rows));
}

export function exportParticipationSummaryCsv(
  students: UserPortfolio[], trades: Trade[], markets: Market[], startingBalance: number, config: GradingConfig,
) {
  const metrics = calculateGradingMetrics(students, trades, markets, startingBalance, config);
  const header = ["Name", "Participation", "Completion", "Active Days", "Markets Engaged", "Decision Score", "Risk Score", "Return %", "Composite Grade", "Reflection Eligible"];
  const rows = metrics.map((m) => [
    m.displayName, m.participationScore, m.completionScore, m.activeTradingDays, m.marketsEngaged, m.decisionScore, m.riskScore, m.returnPct.toFixed(1), m.compositeGrade, m.reflectionEligible ? "Yes" : "No",
  ]);
  downloadCsv("participation_summary.csv", csvFromRows(header, rows));
}

export function exportSettlementReportCsv(markets: Market[], trades: Trade[], students: UserPortfolio[]) {
  const settled = markets.filter((m) => m.status === "settled");
  const header = ["Market", "League", "Sport", "Winner", "Total Trades", "Total Volume", "Unique Traders"];
  const rows = settled.map((m) => {
    const mt = trades.filter((t) => t.marketId === m.id);
    const volume = mt.reduce((s, t) => s + t.totalCost, 0);
    const traders = new Set(mt.map((t) => t.userId)).size;
    const winner = m.outcomes.find((o) => o.id === m.resolvedOutcomeId)?.name ?? "—";
    return [m.title, m.league, m.sport, winner, mt.length, volume.toFixed(2), traders];
  });
  downloadCsv("settlement_report.csv", csvFromRows(header, rows));
}

export function exportStudentAnalyticsCsv(
  students: UserPortfolio[], trades: Trade[], markets: Market[], startingBalance: number,
) {
  const stats = calculateAllStudentStats(students, trades, markets, startingBalance);
  const header = [
    "Name", "Trades", "Volume", "Markets", "Return %", "Win Rate", "Profit Factor",
    "Edge Captured", "Early Buyer", "Chase Rate", "Overconfidence Rate", "Early Sell Rate",
    "Decision Score", "Max Concentration", "Diversification", "Max Drawdown %", "Risk Score",
    "Strengths", "Weaknesses",
  ];
  const rows = stats.map((s) => [
    s.displayName, s.tradeCount, s.totalVolume.toFixed(2), s.marketsTraded, s.totalReturnPct.toFixed(1),
    (s.winRate * 100).toFixed(0) + "%", s.profitFactor.toFixed(2),
    s.decisionQuality.avgEdgeCaptured.toFixed(3), (s.decisionQuality.earlyBuyerScore * 100).toFixed(0) + "%",
    (s.decisionQuality.chaseBuyRate * 100).toFixed(0) + "%", (s.decisionQuality.overconfidentBuyRate * 100).toFixed(0) + "%",
    (s.decisionQuality.earlySellRate * 100).toFixed(0) + "%", s.decisionQuality.compositeScore,
    (s.riskMetrics.maxConcentration * 100).toFixed(0) + "%", s.riskMetrics.diversificationCount,
    s.riskMetrics.maxDrawdownPct.toFixed(1), s.riskMetrics.compositeScore,
    s.strengths.join("; "), s.weaknesses.join("; "),
  ]);
  downloadCsv("student_analytics.csv", csvFromRows(header, rows));
}
