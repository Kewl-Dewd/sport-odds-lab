import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3,
  Brain, Shield, Clock, CheckCircle, XCircle, AlertTriangle,
  Activity, Target, Zap, Download, Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarket } from "@/context/MarketContext";
import { useMode, marketMatchesMode, MODE_LABELS } from "@/context/ModeContext";
import { useEducation } from "@/context/EducationContext";
import { NUDGE_CONTENT } from "@/components/education/LearningNudges";
import { PortfolioPerformanceChart, HoldingsDistribution } from "@/components/charts/AnalyticsCharts";
import { buildPortfolioHistory, analyzePositions } from "@/lib/marketAnalytics";
import {
  calculateStudentStats,
  getSettledTradeOutcomes,
  analyzeTradeTimings,
  type StudentStats,
} from "@/lib/studentAnalytics";
import { cn } from "@/lib/utils";
import { toAmerican } from "@/lib/oddsFormat";
import { money, signedMoney, signedPct } from "@/lib/money";
import { useStudentBook } from "@/hooks/useStudentBook";

function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const color = score >= 70 ? "bg-success/15 text-success" : score >= 40 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-semibold", color)}>
      {score}/100{label && <span className="font-normal font-sans">{label}</span>}
    </span>
  );
}

function StatRow({ label, value, icon, className }: { label: string; value: string | number; icon?: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-1.5">{icon}{label}</span>
      <span className={cn("text-sm font-mono font-medium", className)}>{value}</span>
    </div>
  );
}

export default function Portfolio() {
  const { portfolio: rawPortfolio, portfolioStats, realizedPnL, markets: allMarkets, trades: allTrades, classroom, students } = useMarket();
  const { mode } = useMode();
  const book = useStudentBook();
  const modeMarketIds = useMemo(
    () => new Set(mode ? allMarkets.filter((m) => marketMatchesMode(m, mode)).map((m) => m.id) : allMarkets.map((m) => m.id)),
    [allMarkets, mode],
  );
  const markets = useMemo(() => allMarkets.filter((m) => modeMarketIds.has(m.id)), [allMarkets, modeMarketIds]);
  const trades = useMemo(() => allTrades.filter((t) => modeMarketIds.has(t.marketId)), [allTrades, modeMarketIds]);
  const portfolio = useMemo(
    () => ({ ...rawPortfolio, holdings: rawPortfolio.holdings.filter((h) => modeMarketIds.has(h.marketId)) }),
    [rawPortfolio, modeMarketIds],
  );
  const { cash, holdingsValue, totalValue, unrealizedPnL } = portfolioStats;
  const { educationEnabled, pushNudge } = useEducation();

  // Nudge for unrealized P&L on first portfolio view with holdings
  useMemo(() => {
    if (educationEnabled && portfolio.holdings.length > 0 && unrealizedPnL !== 0) {
      pushNudge(NUDGE_CONTENT.unrealized);
    }
  }, [educationEnabled, portfolio.holdings.length > 0]); // eslint-disable-line

  const userTrades = useMemo(() => trades.filter((t) => t.userId === portfolio.userId), [trades, portfolio.userId]);

  const portfolioHistory = useMemo(
    () => buildPortfolioHistory(userTrades, classroom.startingBalance),
    [userTrades, classroom.startingBalance]
  );

  const positions = useMemo(
    () => analyzePositions(portfolio.holdings, markets),
    [portfolio.holdings, markets]
  );

  // Student analytics
  const stats: StudentStats | null = useMemo(() => {
    if (userTrades.length === 0) return null;
    const tradeCounts = students.map((s) => trades.filter((t) => t.userId === s.userId).length);
    const avg = tradeCounts.length > 0 ? tradeCounts.reduce((s, c) => s + c, 0) / tradeCounts.length : 0;
    const std = tradeCounts.length > 1 ? Math.sqrt(tradeCounts.reduce((s, c) => s + (c - avg) ** 2, 0) / tradeCounts.length) : 1;
    return calculateStudentStats(portfolio, trades, markets, classroom.startingBalance, avg, std);
  }, [portfolio, trades, markets, classroom.startingBalance, students, userTrades.length]);

  const settledOutcomes = useMemo(
    () => getSettledTradeOutcomes(portfolio.userId, trades, markets),
    [portfolio.userId, trades, markets]
  );

  const tradeTimings = useMemo(
    () => analyzeTradeTimings(portfolio.userId, trades),
    [portfolio.userId, trades]
  );

  const cashUtilization = totalValue > 0 ? ((totalValue - cash) / totalValue) * 100 : 0;
  const returnPct = classroom.startingBalance > 0
    ? ((totalValue - classroom.startingBalance) / classroom.startingBalance) * 100
    : 0;

  const winners = positions.filter((p) => p.pnl > 0);
  const losers = positions.filter((p) => p.pnl < 0);

  const handlePrintReport = () => window.print();

  const handleExportPersonalCsv = () => {
    if (!stats) return;
    const lines = [
      `Sports Market Lab — Personal Performance Report`,
      `Student,${portfolio.displayName}`,
      `Class,${classroom.name}`,
      `Date,${new Date().toLocaleDateString()}`,
      ``,
      `Total Value,$${totalValue.toFixed(2)}`,
      `Return,${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(1)}%`,
      `Cash,$${cash.toFixed(2)}`,
      `At Risk,$${holdingsValue.toFixed(2)}`,
      `Realized P&L,$${realizedPnL.toFixed(2)}`,
      `Unrealized P&L,$${unrealizedPnL.toFixed(2)}`,
      ``,
      `Bets,${stats.tradeCount}`,
      `Games Bet,${stats.marketsTraded}`,
      `Win Rate,${(stats.winRate * 100).toFixed(0)}%`,
      `Decision Score,${stats.decisionQuality.compositeScore}/100`,
      `Risk Score,${stats.riskMetrics.compositeScore}/100`,
      ``,
      `Strengths,"${stats.strengths.join("; ")}"`,
      `Areas for Improvement,"${stats.weaknesses.join("; ")}"`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "my_performance.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container py-8 space-y-8 animate-slide-up print:py-2 print:space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Bets {mode && <span className="text-base font-normal text-muted-foreground">· {MODE_LABELS[mode]}</span>}</h1>
          <p className="text-muted-foreground">Your open bets, results, and betting analytics</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handleExportPersonalCsv} disabled={!stats}>
            <Download className="h-3.5 w-3.5 mr-1" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintReport}>
            <Printer className="h-3.5 w-3.5 mr-1" />Print
          </Button>
        </div>
      </div>

      {/* Summary Stats — from the durable bet record */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Bankroll</span>
          <p className="text-lg md:text-xl font-bold font-mono">{money(book.bankroll)}</p>
          <span className={cn("text-xs font-mono", book.roiPct >= 0 ? "price-up" : "price-down")}>
            {signedPct(book.roiPct)}
          </span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Starting bankroll</span>
          <p className="text-lg md:text-xl font-bold font-mono">{money(book.startingBankroll)}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">At Risk</span>
          <p className="text-lg md:text-xl font-bold font-mono">{money(book.atRisk)}</p>
          <span className="text-xs text-muted-foreground">{book.openBets.length} open</span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Could win</span>
          <p className="text-lg md:text-xl font-bold font-mono text-success">{money(book.toWin)}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Settled P&L</span>
          <p className={cn("text-lg md:text-xl font-bold font-mono", book.netPnl >= 0 ? "price-up" : "price-down")}>
            {signedMoney(book.netPnl)}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Win rate</span>
          <p className="text-lg md:text-xl font-bold font-mono">
            {book.wins + book.losses > 0 ? `${book.winRate.toFixed(0)}%` : "—"}
          </p>
          <span className="text-xs text-muted-foreground">{book.wins}W · {book.losses}L</span>
        </div>
      </div>

      {/* Bet record */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Your bets</CardTitle></CardHeader>
        <CardContent>
          {book.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading your bets…</p>
          ) : book.bets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No bets yet — head to the board to place your first one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Game</th>
                    <th className="py-2">Pick</th>
                    <th className="py-2 text-right">Stake</th>
                    <th className="py-2 text-right">To win</th>
                    <th className="py-2 text-right">Status</th>
                    <th className="py-2 text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {book.bets.map((b) => {
                    const open = b.status === "open" || b.status === "executed";
                    const net = Number(b.payout ?? 0) - Number(b.stake ?? 0);
                    const toWin = Math.max(0, Number(b.potential_payout ?? b.stake) - Number(b.stake));
                    return (
                      <tr key={b.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3">{b.market_title}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{b.selection}</td>
                        <td className="py-2.5 text-right font-mono">{money(b.stake)}</td>
                        <td className="py-2.5 text-right font-mono">{money(toWin)}</td>
                        <td className="py-2.5 text-right capitalize">{open ? "Open" : b.status}</td>
                        <td className={cn("py-2.5 text-right font-mono", open ? "text-muted-foreground" : net >= 0 ? "price-up" : "price-down")}>
                          {open ? "—" : signedMoney(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Quality Scores */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card text-center">
            <Brain className="h-4 w-4 mx-auto text-primary mb-1" />
            <span className="text-[10px] text-muted-foreground uppercase">Decision Quality</span>
            <div className="mt-1"><ScoreBadge score={stats.decisionQuality.compositeScore} /></div>
          </div>
          <div className="stat-card text-center">
            <Shield className="h-4 w-4 mx-auto text-primary mb-1" />
            <span className="text-[10px] text-muted-foreground uppercase">Risk Management</span>
            <div className="mt-1"><ScoreBadge score={stats.riskMetrics.compositeScore} /></div>
          </div>
          <div className="stat-card text-center">
            <Target className="h-4 w-4 mx-auto text-primary mb-1" />
            <span className="text-[10px] text-muted-foreground uppercase">Win Rate</span>
            <div className="mt-1">
              <span className="text-lg font-bold font-mono">{(stats.winRate * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="stat-card text-center">
            <Activity className="h-4 w-4 mx-auto text-primary mb-1" />
            <span className="text-[10px] text-muted-foreground uppercase">Efficiency</span>
            <div className="mt-1">
              <span className={cn("text-lg font-bold font-mono", stats.behavioral.returnPerTrade >= 0 ? "price-up" : "price-down")}>
                ${stats.behavioral.returnPerTrade.toFixed(2)}
              </span>
              <span className="text-[10px] text-muted-foreground block">/bet</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Bankroll History</CardTitle></CardHeader>
          <CardContent>
            <PortfolioPerformanceChart snapshots={portfolioHistory} startingCash={classroom.startingBalance} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieIcon className="h-4 w-4" />Where Your Money Is</CardTitle></CardHeader>
          <CardContent>
            <HoldingsDistribution positions={positions} cash={cash} />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="stats">
        <TabsList className="flex-wrap">
          <TabsTrigger value="stats"><BarChart3 className="h-3.5 w-3.5 mr-1" />Personal Stats</TabsTrigger>
          <TabsTrigger value="decisions"><Brain className="h-3.5 w-3.5 mr-1" />Decision Quality</TabsTrigger>
          <TabsTrigger value="settled"><CheckCircle className="h-3.5 w-3.5 mr-1" />Settled Outcomes</TabsTrigger>
          <TabsTrigger value="timing"><Clock className="h-3.5 w-3.5 mr-1" />Bet Timing</TabsTrigger>
          <TabsTrigger value="positions"><TrendingUp className="h-3.5 w-3.5 mr-1" />Open Bets</TabsTrigger>
        </TabsList>

        {/* Personal Stats Tab */}
        <TabsContent value="stats">
          {stats ? (
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <StatRow label="Total bets" value={stats.tradeCount} icon={<Zap className="h-3 w-3" />} />
                  <StatRow label="Bets placed" value={stats.buyCount} />
                  <StatRow label="Cash-outs" value={stats.sellCount} />
                  <StatRow label="Avg stake" value={`$${stats.avgTradeSize.toFixed(2)}`} />
                  <StatRow label="Total handle" value={`$${stats.totalVolume.toFixed(0)}`} />
                  <StatRow label="Games bet" value={stats.marketsTraded} />
                  <StatRow label="Avg time between bets" value={stats.behavioral.avgTimeBetweenTrades > 0 ? `${stats.behavioral.avgTimeBetweenTrades.toFixed(1)}m` : "—"} />
                  {stats.behavioral.overtradingIndicator && (
                    <div className="flex items-center gap-1.5 pt-2 text-xs text-warning">
                      <AlertTriangle className="h-3 w-3" />Betting too often
                    </div>
                  )}
                  {stats.behavioral.inactivityIndicator && (
                    <div className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" />Below class average activity
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Performance</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <StatRow label="Total return" value={`${stats.totalReturn >= 0 ? "+" : ""}$${stats.totalReturn.toFixed(2)}`}
                    className={stats.totalReturn >= 0 ? "price-up" : "price-down"} />
                  <StatRow label="Return %" value={`${stats.totalReturnPct >= 0 ? "+" : ""}${stats.totalReturnPct.toFixed(1)}%`}
                    className={stats.totalReturnPct >= 0 ? "price-up" : "price-down"} />
                  <StatRow label="Win rate" value={`${(stats.winRate * 100).toFixed(0)}%`} />
                  <StatRow label="Wins / Losses" value={`${stats.winCount} / ${stats.lossCount}`} />
                  <StatRow label="Avg win size" value={`$${stats.avgWinSize.toFixed(2)}`} className="price-up" />
                  <StatRow label="Avg loss size" value={`$${stats.avgLossSize.toFixed(2)}`} className="price-down" />
                  <StatRow label="Profit factor" value={stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2)} />
                  <StatRow label="Return/bet" value={`$${stats.behavioral.returnPerTrade.toFixed(2)}`}
                    className={stats.behavioral.returnPerTrade >= 0 ? "price-up" : "price-down"} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Strengths & Weaknesses</CardTitle></CardHeader>
                <CardContent>
                  {stats.strengths.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase">Strengths</p>
                      {stats.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <CheckCircle className="h-3 w-3 text-success shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {stats.weaknesses.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase">Areas for Improvement</p>
                      {stats.weaknesses.map((w, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <AlertTriangle className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {stats.strengths.length === 0 && stats.weaknesses.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      More bets needed for analysis
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Place some bets to see your stats.</p>
          )}
        </TabsContent>

        {/* Decision Quality Tab */}
        <TabsContent value="decisions">
          {stats ? (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4" />Decision Metrics</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <StatRow label="Early bet score" value={`${(stats.decisionQuality.earlyBuyerScore * 100).toFixed(0)}%`}
                    icon={<TrendingUp className="h-3 w-3" />} />
                  <StatRow label="Chasing the line rate" value={`${(stats.decisionQuality.chaseBuyRate * 100).toFixed(0)}%`}
                    className={stats.decisionQuality.chaseBuyRate > 0.3 ? "price-down" : ""} />
                  <StatRow label="Betting heavy favorites rate" value={`${(stats.decisionQuality.overconfidentBuyRate * 100).toFixed(0)}%`}
                    className={stats.decisionQuality.overconfidentBuyRate > 0.2 ? "price-down" : ""} />
                  <StatRow label="Early cash-out rate" value={`${(stats.decisionQuality.earlySellRate * 100).toFixed(0)}%`}
                    className={stats.decisionQuality.earlySellRate > 0.4 ? "price-down" : ""} />
                  <StatRow label="Held to settlement" value={`${(stats.decisionQuality.heldToSettlementRate * 100).toFixed(0)}%`} />
                  <StatRow label="Avg edge captured" value={`${(stats.decisionQuality.avgEdgeCaptured * 100).toFixed(1)}¢`}
                    className={stats.decisionQuality.avgEdgeCaptured >= 0 ? "price-up" : "price-down"} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Risk Metrics</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <StatRow label="Max concentration" value={`${(stats.riskMetrics.maxConcentration * 100).toFixed(0)}%`}
                    className={stats.riskMetrics.maxConcentration > 0.5 ? "price-down" : ""} />
                  <StatRow label="Diversification" value={`${stats.riskMetrics.diversificationCount} markets`} />
                  <StatRow label="All-in frequency" value={`${(stats.riskMetrics.allInFrequency * 100).toFixed(0)}%`}
                    className={stats.riskMetrics.allInFrequency > 0.3 ? "price-down" : ""} />
                  <StatRow label="Cash utilization" value={`${(stats.riskMetrics.cashUtilization * 100).toFixed(0)}%`} />
                  <StatRow label="Max drawdown" value={`$${stats.riskMetrics.maxDrawdown.toFixed(2)}`} className="price-down" />
                  <StatRow label="Max drawdown %" value={`${stats.riskMetrics.maxDrawdownPct.toFixed(1)}%`} className="price-down" />
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Behavioral Patterns</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Buy High Tendency</p>
                      <p className={cn("text-xl font-bold font-mono", stats.behavioral.buyHighTendency > 0.6 ? "price-down" : "")}>
                        {(stats.behavioral.buyHighTendency * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Sell Low Tendency</p>
                      <p className={cn("text-xl font-bold font-mono", stats.behavioral.sellLowTendency > 0.6 ? "price-down" : "")}>
                        {(stats.behavioral.sellLowTendency * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Overtrading</p>
                      <p className="text-xl font-bold font-mono">
                        {stats.behavioral.overtradingIndicator ? (
                          <span className="text-warning">Yes</span>
                        ) : "No"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Inactive</p>
                      <p className="text-xl font-bold font-mono">
                        {stats.behavioral.inactivityIndicator ? (
                          <span className="text-warning">Yes</span>
                        ) : "No"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Place some bets to see decision analytics.</p>
          )}
        </TabsContent>

        {/* Settled Outcomes Tab */}
        <TabsContent value="settled">
          <Card>
            <CardHeader><CardTitle className="text-sm">Settled Bets</CardTitle></CardHeader>
            <CardContent>
              {settledOutcomes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No settled bets yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Market</th>
                        <th className="pb-3 font-medium">Outcome</th>
                        <th className="pb-3 font-medium text-right">Type</th>
                        <th className="pb-3 font-medium text-right">Current odds</th>
                        <th className="pb-3 font-medium text-right">Settlement</th>
                        <th className="pb-3 font-medium text-right">Edge</th>
                        <th className="pb-3 font-medium text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settledOutcomes.map((o) => (
                        <tr key={o.tradeId} className="border-b last:border-0">
                          <td className="py-3 font-medium">{o.marketTitle}</td>
                          <td className="py-3">{o.outcomeName}</td>
                          <td className="py-3 text-right">
                            <span className={cn("font-semibold", o.type === "BUY" ? "price-up" : "price-down")}>{o.type}</span>
                          </td>
                          <td className="py-3 text-right font-mono">{toAmerican(o.pricePerShare)}</td>
                          <td className="py-3 text-right">
                            {o.settlementValue === 1 ? (
                              <Badge variant="outline" className="text-success text-xs">Won</Badge>
                            ) : (
                              <Badge variant="outline" className="text-destructive text-xs">Lost</Badge>
                            )}
                          </td>
                          <td className={cn("py-3 text-right font-mono", o.edgeCaptured >= 0 ? "price-up" : "price-down")}>
                            {o.edgeCaptured >= 0 ? "+" : ""}{(o.edgeCaptured * 100).toFixed(1)}¢
                          </td>
                          <td className={cn("py-3 text-right font-mono font-medium", o.totalPnl >= 0 ? "price-up" : "price-down")}>
                            {o.totalPnl >= 0 ? "+" : ""}${o.totalPnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade Timing Tab */}
        <TabsContent value="timing">
          <Card>
            <CardHeader><CardTitle className="text-sm">Bet Timing Review</CardTitle></CardHeader>
            <CardContent>
              {tradeTimings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No bets to review.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Time</th>
                        <th className="pb-3 font-medium">Market</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium text-right">Price Move</th>
                        <th className="pb-3 font-medium text-right">Favorable?</th>
                        <th className="pb-3 font-medium text-right hidden sm:table-cell">Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeTimings.slice(0, 30).map((t) => (
                        <tr key={t.tradeId} className="border-b last:border-0">
                          <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(t.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-3">
                            <div className="font-medium">{t.marketTitle}</div>
                            <div className="text-xs text-muted-foreground">{t.outcomeName}</div>
                          </td>
                          <td className="py-3">
                            <span className={cn("font-semibold", t.type === "BUY" ? "price-up" : "price-down")}>{t.type}</span>
                          </td>
                          <td className="py-3 text-right font-mono text-xs">
                            {toAmerican(t.priceBefore)} → {toAmerican(t.priceAfter)}
                          </td>
                          <td className="py-3 text-right">
                            {t.priceMoveFavorable ? (
                              <CheckCircle className="h-4 w-4 text-success inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive inline" />
                            )}
                          </td>
                          <td className="py-3 text-right hidden sm:table-cell">
                            <div className="flex gap-1 justify-end">
                              {t.wasChase && <Badge variant="outline" className="text-[10px] text-warning">Chase</Badge>}
                              {t.wasOverconfident && <Badge variant="outline" className="text-[10px] text-destructive">Overconf.</Badge>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <div className="space-y-6">
            {/* Winners / Losers */}
            {positions.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />Winning Positions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {winners.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No winning bets yet</p>
                    ) : (
                      <div className="space-y-2">
                        {winners.slice(0, 5).map((p) => (
                          <div key={p.outcomeId} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                            <div>
                              <p className="font-medium">{p.outcomeName}</p>
                              <p className="text-xs text-muted-foreground">{p.marketTitle}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono price-up font-semibold">+${p.pnl.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground font-mono">+{p.pnlPct.toFixed(1)}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />Losing Positions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {losers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No losing bets yet</p>
                    ) : (
                      <div className="space-y-2">
                        {losers.slice(0, 5).map((p) => (
                          <div key={p.outcomeId} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                            <div>
                              <p className="font-medium">{p.outcomeName}</p>
                              <p className="text-xs text-muted-foreground">{p.marketTitle}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono price-down font-semibold">${p.pnl.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground font-mono">{p.pnlPct.toFixed(1)}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Open Positions Table */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Open Bets</CardTitle></CardHeader>
              <CardContent>
                {portfolio.holdings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No open bets yet. <Link to="/markets" className="text-primary underline">Browse the board</Link> to place your first bet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 font-medium">Market</th>
                          <th className="pb-3 font-medium">Outcome</th>
                          <th className="pb-3 font-medium text-right">Payout if win</th>
                          <th className="pb-3 font-medium text-right">Your odds</th>
                          <th className="pb-3 font-medium text-right">Current odds</th>
                          <th className="pb-3 font-medium text-right">Value</th>
                          <th className="pb-3 font-medium text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((p) => (
                          <tr key={p.outcomeId} className="border-b last:border-0">
                            <td className="py-3 font-medium">
                              <Link to={`/markets/${portfolio.holdings.find((h) => h.outcomeId === p.outcomeId)?.marketId}`} className="hover:text-primary transition-colors">
                                {p.marketTitle}
                              </Link>
                            </td>
                            <td className="py-3">{p.outcomeName}</td>
                            <td className="py-3 text-right font-mono">${p.shares.toFixed(2)}</td>
                            <td className="py-3 text-right font-mono">{toAmerican(p.costBasis / p.shares)}</td>
                            <td className="py-3 text-right font-mono">{toAmerican(p.currentValue / p.shares)}</td>
                            <td className="py-3 text-right font-mono">${p.currentValue.toFixed(2)}</td>
                            <td className={cn("py-3 text-right font-mono font-medium", p.pnl >= 0 ? "price-up" : "price-down")}>
                              {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)} ({p.pnlPct > 0 ? "+" : ""}{p.pnlPct.toFixed(1)}%)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Trade History */}
      {userTrades.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Bet History ({userTrades.length} total)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Market</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Qty</th>
                    <th className="pb-3 font-medium text-right">Current odds</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-right">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {userTrades.slice(0, 30).map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3">
                        <div className="font-medium">{t.marketTitle}</div>
                        <div className="text-xs text-muted-foreground">{t.outcomeName}</div>
                      </td>
                      <td className="py-3">
                        <span className={cn("font-semibold", t.type === "BUY" ? "price-up" : "price-down")}>{t.type}</span>
                      </td>
                      <td className="py-3 text-right font-mono">${t.quantity.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono">{toAmerican(t.pricePerShare)}</td>
                      <td className="py-3 text-right font-mono">${t.totalCost.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono text-xs">
                        {toAmerican(t.priceBeforeTrade)} → {toAmerican(t.priceAfterTrade)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
