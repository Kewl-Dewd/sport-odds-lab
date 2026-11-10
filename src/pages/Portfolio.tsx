import { useMemo } from "react";
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
  const color =
    score >= 70
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
      : score >= 40
        ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
        : "bg-rose-500/10 text-rose-500 border-rose-500/30";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-mono font-semibold", color)}>
      {score}/100{label && <span className="font-normal font-sans text-muted-foreground">{label}</span>}
    </span>
  );
}

function StatRow({ label, value, icon, className }: { label: string; value: string | number; icon?: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</span>
      <span className={cn("text-xs font-mono font-medium", className)}>{value}</span>
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
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
              Personal Terminal
            </span>
            {mode && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                · {MODE_LABELS[mode]}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Portfolio &amp; Analytics</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Track bankroll velocity, open liability, execution history, and calibration metrics.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handleExportPersonalCsv} disabled={!stats} className="h-8 text-xs font-mono">
            <Download className="h-3.5 w-3.5 mr-1.5" />Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintReport} className="h-8 text-xs font-mono">
            <Printer className="h-3.5 w-3.5 mr-1.5" />Print
          </Button>
        </div>
      </div>

      {/* Summary Stats Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3.5 shadow-subtle-card hover:border-emerald-500/30 transition-all">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Bankroll</span>
          <p className="text-lg md:text-xl font-bold font-mono tracking-tight">{book.enrolled ? money(book.bankroll) : "—"}</p>
          <span className={cn("text-xs font-mono font-medium block mt-1", book.roiPct >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {signedPct(book.roiPct)}
          </span>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3.5 shadow-subtle-card hover:border-emerald-500/30 transition-all">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Starting</span>
          <p className="text-lg md:text-xl font-bold font-mono tracking-tight">{book.enrolled ? money(book.startingBankroll) : "—"}</p>
          <span className="text-xs font-mono text-muted-foreground block mt-1">Base balance</span>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3.5 shadow-subtle-card hover:border-emerald-500/30 transition-all">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">At Risk</span>
          <p className="text-lg md:text-xl font-bold font-mono tracking-tight">{money(book.atRisk)}</p>
          <span className="text-xs font-mono text-muted-foreground block mt-1">{book.openBets.length} active bets</span>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3.5 shadow-subtle-card hover:border-emerald-500/30 transition-all">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">To Win</span>
          <p className="text-lg md:text-xl font-bold font-mono tracking-tight text-emerald-500">{money(book.toWin)}</p>
          <span className="text-xs font-mono text-muted-foreground block mt-1">Potential upside</span>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3.5 shadow-subtle-card hover:border-emerald-500/30 transition-all">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Settled P&amp;L</span>
          <p className={cn("text-lg md:text-xl font-bold font-mono tracking-tight", book.netPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {signedMoney(book.netPnl)}
          </p>
          <span className="text-xs font-mono text-muted-foreground block mt-1">Realized return</span>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3.5 shadow-subtle-card hover:border-emerald-500/30 transition-all">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Win Rate</span>
          <p className="text-lg md:text-xl font-bold font-mono tracking-tight">
            {book.wins + book.losses > 0 ? `${book.winRate.toFixed(0)}%` : "—"}
          </p>
          <span className="text-xs font-mono text-muted-foreground block mt-1">{book.wins}W · {book.losses}L</span>
        </div>
      </div>

      {/* Primary Bet Record Card */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
              <span>Active Orders &amp; Placed Bets</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded border border-border/60 bg-muted/30 text-muted-foreground">
                {book.bets.length}
              </span>
            </CardTitle>
            <Link to="/markets" className="text-xs font-mono text-emerald-500 hover:text-emerald-400 hover:underline">
              + Browse Board
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {book.isLoading ? (
            <p className="py-8 text-center text-xs font-mono text-muted-foreground">Loading bet records…</p>
          ) : book.bets.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground mb-3">No bets placed yet.</p>
              <Link to="/markets">
                <Button variant="terminal" size="sm">Go to Markets Board</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 font-medium">Market</th>
                    <th className="py-2.5 font-medium">Pick</th>
                    <th className="py-2.5 text-right font-medium">Stake</th>
                    <th className="py-2.5 text-right font-medium">To Win</th>
                    <th className="py-2.5 text-right font-medium">Status</th>
                    <th className="py-2.5 text-right font-medium">Net P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-mono">
                  {book.bets.map((b) => {
                    const open = b.status === "open" || b.status === "executed";
                    const net = Number(b.payout ?? 0) - Number(b.stake ?? 0);
                    const toWin = Math.max(0, Number(b.potential_payout ?? b.stake) - Number(b.stake));
                    return (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-3 font-sans font-medium text-foreground">{b.market_title}</td>
                        <td className="py-3 pr-3 text-muted-foreground">{b.selection}</td>
                        <td className="py-3 text-right">{money(b.stake)}</td>
                        <td className="py-3 text-right text-emerald-500">{money(toWin)}</td>
                        <td className="py-3 text-right">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] uppercase font-semibold border",
                            open
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : net >= 0
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                          )}>
                            {open ? "Open" : b.status}
                          </span>
                        </td>
                        <td className={cn("py-3 text-right font-semibold", open ? "text-muted-foreground" : net >= 0 ? "text-emerald-500" : "text-rose-500")}>
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
          <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-center shadow-subtle-card">
            <Brain className="h-4 w-4 mx-auto text-emerald-500 mb-1.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Decision Quality</span>
            <div className="mt-2"><ScoreBadge score={stats.decisionQuality.compositeScore} /></div>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-center shadow-subtle-card">
            <Shield className="h-4 w-4 mx-auto text-emerald-500 mb-1.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Risk Management</span>
            <div className="mt-2"><ScoreBadge score={stats.riskMetrics.compositeScore} /></div>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-center shadow-subtle-card">
            <Target className="h-4 w-4 mx-auto text-emerald-500 mb-1.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Win Rate</span>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono tracking-tight">{(stats.winRate * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-center shadow-subtle-card">
            <Activity className="h-4 w-4 mx-auto text-emerald-500 mb-1.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Efficiency</span>
            <div className="mt-2">
              <span className={cn("text-xl font-bold font-mono tracking-tight", stats.behavioral.returnPerTrade >= 0 ? "text-emerald-500" : "text-rose-500")}>
                ${stats.behavioral.returnPerTrade.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground block">/bet</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight">Bankroll Trajectory</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <PortfolioPerformanceChart snapshots={portfolioHistory} startingCash={classroom.startingBalance} />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-500" />
              Capital Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <HoldingsDistribution positions={positions} cash={cash} />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="bg-muted/40 p-1 border border-border/60 rounded-lg">
          <TabsTrigger value="stats" className="text-xs font-mono"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Personal Stats</TabsTrigger>
          <TabsTrigger value="decisions" className="text-xs font-mono"><Brain className="h-3.5 w-3.5 mr-1.5" />Decision Quality</TabsTrigger>
          <TabsTrigger value="settled" className="text-xs font-mono"><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Settled Outcomes</TabsTrigger>
          <TabsTrigger value="timing" className="text-xs font-mono"><Clock className="h-3.5 w-3.5 mr-1.5" />Bet Timing</TabsTrigger>
          <TabsTrigger value="positions" className="text-xs font-mono"><TrendingUp className="h-3.5 w-3.5 mr-1.5" />Open Bets</TabsTrigger>
        </TabsList>

        {/* Personal Stats Tab */}
        <TabsContent value="stats">
          {stats ? (
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-border/60 bg-card/60">
                <CardHeader className="pb-2 border-b border-border/40">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <StatRow label="Total bets" value={stats.tradeCount} icon={<Zap className="h-3 w-3 text-emerald-500" />} />
                  <StatRow label="Bets placed" value={stats.buyCount} />
                  <StatRow label="Cash-outs" value={stats.sellCount} />
                  <StatRow label="Avg stake" value={`$${stats.avgTradeSize.toFixed(2)}`} />
                  <StatRow label="Total handle" value={`$${stats.totalVolume.toFixed(0)}`} />
                  <StatRow label="Games bet" value={stats.marketsTraded} />
                  <StatRow label="Avg time between bets" value={stats.behavioral.avgTimeBetweenTrades > 0 ? `${stats.behavioral.avgTimeBetweenTrades.toFixed(1)}m` : "—"} />
                  {stats.behavioral.overtradingIndicator && (
                    <div className="flex items-center gap-1.5 pt-2 text-xs font-mono text-amber-500">
                      <AlertTriangle className="h-3 w-3" />High execution frequency flagged
                    </div>
                  )}
                  {stats.behavioral.inactivityIndicator && (
                    <div className="flex items-center gap-1.5 pt-2 text-xs font-mono text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" />Below class average activity
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60">
                <CardHeader className="pb-2 border-b border-border/40">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Performance Ratios</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <StatRow label="Total return" value={`${stats.totalReturn >= 0 ? "+" : ""}$${stats.totalReturn.toFixed(2)}`}
                    className={stats.totalReturn >= 0 ? "text-emerald-500" : "text-rose-500"} />
                  <StatRow label="Return %" value={`${stats.totalReturnPct >= 0 ? "+" : ""}${stats.totalReturnPct.toFixed(1)}%`}
                    className={stats.totalReturnPct >= 0 ? "text-emerald-500" : "text-rose-500"} />
                  <StatRow label="Win rate" value={`${(stats.winRate * 100).toFixed(0)}%`} />
                  <StatRow label="Wins / Losses" value={`${stats.winCount} / ${stats.lossCount}`} />
                  <StatRow label="Avg win size" value={`$${stats.avgWinSize.toFixed(2)}`} className="text-emerald-500" />
                  <StatRow label="Avg loss size" value={`$${stats.avgLossSize.toFixed(2)}`} className="text-rose-500" />
                  <StatRow label="Profit factor" value={stats.profitFactor >= 999 ? "∞" : stats.profitFactor.toFixed(2)} />
                  <StatRow label="Return/bet" value={`$${stats.behavioral.returnPerTrade.toFixed(2)}`}
                    className={stats.behavioral.returnPerTrade >= 0 ? "text-emerald-500" : "text-rose-500"} />
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60">
                <CardHeader className="pb-2 border-b border-border/40">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Diagnostic Insights</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  {stats.strengths.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-[10px] font-mono font-medium text-emerald-500 uppercase tracking-wider">Strengths</p>
                      {stats.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {stats.weaknesses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono font-medium text-amber-500 uppercase tracking-wider">Improvement Areas</p>
                      {stats.weaknesses.map((w, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {stats.strengths.length === 0 && stats.weaknesses.length === 0 && (
                    <p className="text-xs font-mono text-muted-foreground text-center py-6">
                      More bet history required for diagnostic output.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-xs font-mono text-muted-foreground text-center py-8">Place bets to generate analytics profile.</p>
          )}
        </TabsContent>

        {/* Decision Quality Tab */}
        <TabsContent value="decisions">
          {stats ? (
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-border/60 bg-card/60">
                <CardHeader className="pb-2 border-b border-border/40">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                    <Brain className="h-3.5 w-3.5 text-emerald-500" />Execution Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <StatRow label="Early bet score" value={`${(stats.decisionQuality.earlyBuyerScore * 100).toFixed(0)}%`}
                    icon={<TrendingUp className="h-3 w-3 text-emerald-500" />} />
                  <StatRow label="Chasing line rate" value={`${(stats.decisionQuality.chaseBuyRate * 100).toFixed(0)}%`}
                    className={stats.decisionQuality.chaseBuyRate > 0.3 ? "text-rose-500" : ""} />
                  <StatRow label="Heavy favorite bias" value={`${(stats.decisionQuality.overconfidentBuyRate * 100).toFixed(0)}%`}
                    className={stats.decisionQuality.overconfidentBuyRate > 0.2 ? "text-rose-500" : ""} />
                  <StatRow label="Early exit rate" value={`${(stats.decisionQuality.earlySellRate * 100).toFixed(0)}%`}
                    className={stats.decisionQuality.earlySellRate > 0.4 ? "text-rose-500" : ""} />
                  <StatRow label="Held to settlement" value={`${(stats.decisionQuality.heldToSettlementRate * 100).toFixed(0)}%`} />
                  <StatRow label="Avg edge captured" value={`${(stats.decisionQuality.avgEdgeCaptured * 100).toFixed(1)}¢`}
                    className={stats.decisionQuality.avgEdgeCaptured >= 0 ? "text-emerald-500" : "text-rose-500"} />
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60">
                <CardHeader className="pb-2 border-b border-border/40">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" />Risk Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <StatRow label="Max concentration" value={`${(stats.riskMetrics.maxConcentration * 100).toFixed(0)}%`}
                    className={stats.riskMetrics.maxConcentration > 0.5 ? "text-rose-500" : ""} />
                  <StatRow label="Diversification" value={`${stats.riskMetrics.diversificationCount} markets`} />
                  <StatRow label="All-in frequency" value={`${(stats.riskMetrics.allInFrequency * 100).toFixed(0)}%`}
                    className={stats.riskMetrics.allInFrequency > 0.3 ? "text-rose-500" : ""} />
                  <StatRow label="Cash utilization" value={`${(stats.riskMetrics.cashUtilization * 100).toFixed(0)}%`} />
                  <StatRow label="Max drawdown" value={`$${stats.riskMetrics.maxDrawdown.toFixed(2)}`} className="text-rose-500" />
                  <StatRow label="Max drawdown %" value={`${stats.riskMetrics.maxDrawdownPct.toFixed(1)}%`} className="text-rose-500" />
                </CardContent>
              </Card>

              <Card className="md:col-span-2 border-border/60 bg-card/60">
                <CardHeader className="pb-2 border-b border-border/40">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Behavioral Tendencies</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg border border-border/40 bg-background/50">
                      <p className="text-[11px] font-mono text-muted-foreground uppercase">Buy High Bias</p>
                      <p className={cn("text-xl font-bold font-mono mt-1", stats.behavioral.buyHighTendency > 0.6 ? "text-rose-500" : "text-foreground")}>
                        {(stats.behavioral.buyHighTendency * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-border/40 bg-background/50">
                      <p className="text-[11px] font-mono text-muted-foreground uppercase">Sell Low Bias</p>
                      <p className={cn("text-xl font-bold font-mono mt-1", stats.behavioral.sellLowTendency > 0.6 ? "text-rose-500" : "text-foreground")}>
                        {(stats.behavioral.sellLowTendency * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-border/40 bg-background/50">
                      <p className="text-[11px] font-mono text-muted-foreground uppercase">Overtrading</p>
                      <p className="text-xl font-bold font-mono mt-1">
                        {stats.behavioral.overtradingIndicator ? (
                          <span className="text-amber-500">Yes</span>
                        ) : <span className="text-emerald-500">Normal</span>}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-border/40 bg-background/50">
                      <p className="text-[11px] font-mono text-muted-foreground uppercase">Activity Level</p>
                      <p className="text-xl font-bold font-mono mt-1">
                        {stats.behavioral.inactivityIndicator ? (
                          <span className="text-amber-500">Low</span>
                        ) : <span className="text-emerald-500">Active</span>}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-xs font-mono text-muted-foreground text-center py-8">Place bets to reveal behavioral diagnostics.</p>
          )}
        </TabsContent>

        {/* Settled Outcomes Tab */}
        <TabsContent value="settled">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight">Graded Bets &amp; Settlements</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {settledOutcomes.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground text-center py-6">No settled outcomes on record.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="py-2.5 font-medium font-sans">Market</th>
                        <th className="py-2.5 font-medium font-sans">Outcome</th>
                        <th className="py-2.5 font-medium text-right">Type</th>
                        <th className="py-2.5 font-medium text-right">Odds</th>
                        <th className="py-2.5 font-medium text-right">Settlement</th>
                        <th className="py-2.5 font-medium text-right">Edge</th>
                        <th className="py-2.5 font-medium text-right">P&amp;L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {settledOutcomes.map((o) => (
                        <tr key={o.tradeId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 font-sans font-medium text-foreground">{o.marketTitle}</td>
                          <td className="py-3 font-sans text-muted-foreground">{o.outcomeName}</td>
                          <td className="py-3 text-right">
                            <span className={cn("font-semibold", o.type === "BUY" ? "text-emerald-500" : "text-rose-500")}>{o.type}</span>
                          </td>
                          <td className="py-3 text-right">{toAmerican(o.pricePerShare)}</td>
                          <td className="py-3 text-right">
                            {o.settlementValue === 1 ? (
                              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-[10px]">Won</Badge>
                            ) : (
                              <Badge variant="outline" className="border-rose-500/40 text-rose-500 bg-rose-500/10 text-[10px]">Lost</Badge>
                            )}
                          </td>
                          <td className={cn("py-3 text-right", o.edgeCaptured >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {o.edgeCaptured >= 0 ? "+" : ""}{(o.edgeCaptured * 100).toFixed(1)}¢
                          </td>
                          <td className={cn("py-3 text-right font-semibold", o.totalPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
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
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight">Execution Timing &amp; Line Shift</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {tradeTimings.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground text-center py-6">No timing events to analyze.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="py-2.5 font-medium">Time</th>
                        <th className="py-2.5 font-medium font-sans">Market</th>
                        <th className="py-2.5 font-medium">Type</th>
                        <th className="py-2.5 font-medium text-right">Price Shift</th>
                        <th className="py-2.5 font-medium text-right">Favorable?</th>
                        <th className="py-2.5 font-medium text-right hidden sm:table-cell">Flags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {tradeTimings.slice(0, 30).map((t) => (
                        <tr key={t.tradeId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 text-muted-foreground whitespace-nowrap">
                            {new Date(t.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-3 font-sans">
                            <div className="font-medium text-foreground">{t.marketTitle}</div>
                            <div className="text-xs text-muted-foreground">{t.outcomeName}</div>
                          </td>
                          <td className="py-3">
                            <span className={cn("font-semibold", t.type === "BUY" ? "text-emerald-500" : "text-rose-500")}>{t.type}</span>
                          </td>
                          <td className="py-3 text-right">
                            {toAmerican(t.priceBefore)} → {toAmerican(t.priceAfter)}
                          </td>
                          <td className="py-3 text-right">
                            {t.priceMoveFavorable ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-500 inline" />
                            )}
                          </td>
                          <td className="py-3 text-right hidden sm:table-cell">
                            <div className="flex gap-1 justify-end">
                              {t.wasChase && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500 bg-amber-500/10">Chase</Badge>}
                              {t.wasOverconfident && <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-500 bg-rose-500/10">Overconf.</Badge>}
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
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-border/60 bg-card/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2 text-emerald-500">
                      <TrendingUp className="h-4 w-4" />Profitable Positions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    {winners.length === 0 ? (
                      <p className="text-xs font-mono text-muted-foreground text-center py-4">No winning bets yet</p>
                    ) : (
                      <div className="space-y-2">
                        {winners.slice(0, 5).map((p) => (
                          <div key={p.outcomeId} className="flex justify-between text-xs py-2 border-b border-border/30 last:border-0 font-mono">
                            <div>
                              <p className="font-sans font-medium text-foreground">{p.outcomeName}</p>
                              <p className="text-[11px] text-muted-foreground">{p.marketTitle}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-emerald-500 font-semibold">+${p.pnl.toFixed(2)}</p>
                              <p className="text-[11px] text-muted-foreground">+{p.pnlPct.toFixed(1)}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-card/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2 text-rose-500">
                      <TrendingDown className="h-4 w-4" />Drawdown Positions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    {losers.length === 0 ? (
                      <p className="text-xs font-mono text-muted-foreground text-center py-4">No losing bets yet</p>
                    ) : (
                      <div className="space-y-2">
                        {losers.slice(0, 5).map((p) => (
                          <div key={p.outcomeId} className="flex justify-between text-xs py-2 border-b border-border/30 last:border-0 font-mono">
                            <div>
                              <p className="font-sans font-medium text-foreground">{p.outcomeName}</p>
                              <p className="text-[11px] text-muted-foreground">{p.marketTitle}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-rose-500 font-semibold">${p.pnl.toFixed(2)}</p>
                              <p className="text-[11px] text-muted-foreground">{p.pnlPct.toFixed(1)}%</p>
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
            <Card className="border-border/60 bg-card/60">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold tracking-tight">Active Book Positions</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {book.openBets.length === 0 ? (
                  <p className="text-xs font-mono text-muted-foreground py-6 text-center">
                    No open bets currently active. <Link to="/markets" className="text-emerald-500 underline">Browse the board</Link> to enter a trade.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                          <th className="py-2.5 font-medium font-sans">Market</th>
                          <th className="py-2.5 font-medium font-sans">Pick</th>
                          <th className="py-2.5 font-medium text-right">Stake</th>
                          <th className="py-2.5 font-medium text-right">Odds</th>
                          <th className="py-2.5 font-medium text-right">To win</th>
                          <th className="py-2.5 font-medium text-right">Payout</th>
                          <th className="py-2.5 font-medium text-right">Forecast</th>
                          <th className="py-2.5 font-medium text-right">CLV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {book.openBets.map((b) => {
                          const stake = Number(b.stake ?? 0);
                          const payout = Number(b.potential_payout ?? stake);
                          return (
                            <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 font-sans font-medium text-foreground">{b.market_title}</td>
                              <td className="py-3 font-sans text-muted-foreground">{b.selection}</td>
                              <td className="py-3 text-right">{money(stake)}</td>
                              <td className="py-3 text-right">
                                {b.odds_decimal ? toAmerican(Number(b.odds_decimal)) : "—"}
                              </td>
                              <td className="py-3 text-right text-emerald-500">
                                {money(Math.max(0, payout - stake))}
                              </td>
                              <td className="py-3 text-right">{money(payout)}</td>
                              <td className="py-3 text-right">
                                {b.forecast_prob == null ? "—" : `${(Number(b.forecast_prob) * 100).toFixed(0)}%`}
                              </td>
                              <td className="py-3 text-right">
                                {b.clv_pct == null ? "pending" : `${Number(b.clv_pct) >= 0 ? "+" : ""}${Number(b.clv_pct).toFixed(1)}%`}
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
