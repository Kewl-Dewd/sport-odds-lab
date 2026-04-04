import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3,
  Brain, Shield, Clock, CheckCircle, XCircle, AlertTriangle,
  Activity, Target, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarket } from "@/context/MarketContext";
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
  const { portfolio, portfolioStats, realizedPnL, markets, trades, classroom, students } = useMarket();
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

  return (
    <div className="container py-8 space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Your holdings, performance, and decision analytics</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Total Value</span>
          <p className="text-lg md:text-xl font-bold font-mono">${totalValue.toFixed(2)}</p>
          <span className={cn("text-xs font-mono", returnPct >= 0 ? "price-up" : "price-down")}>
            {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
          </span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Cash</span>
          <p className="text-lg md:text-xl font-bold font-mono">${cash.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Holdings</span>
          <p className="text-lg md:text-xl font-bold font-mono">${holdingsValue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Unrealized P&L</span>
          <p className={cn("text-lg md:text-xl font-bold font-mono", unrealizedPnL >= 0 ? "price-up" : "price-down")}>
            {unrealizedPnL >= 0 ? "+" : ""}${unrealizedPnL.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Realized P&L</span>
          <p className={cn("text-lg md:text-xl font-bold font-mono", realizedPnL >= 0 ? "price-up" : "price-down")}>
            {realizedPnL >= 0 ? "+" : ""}${realizedPnL.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Cash Utilization</span>
          <p className="text-lg md:text-xl font-bold font-mono">{cashUtilization.toFixed(0)}%</p>
          <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${cashUtilization}%` }} />
          </div>
        </div>
      </div>

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
              <span className="text-[10px] text-muted-foreground block">/trade</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Equity Curve</CardTitle></CardHeader>
          <CardContent>
            <PortfolioPerformanceChart snapshots={portfolioHistory} startingCash={classroom.startingBalance} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieIcon className="h-4 w-4" />Holdings Allocation</CardTitle></CardHeader>
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
          <TabsTrigger value="timing"><Clock className="h-3.5 w-3.5 mr-1" />Trade Timing</TabsTrigger>
          <TabsTrigger value="positions"><TrendingUp className="h-3.5 w-3.5 mr-1" />Positions</TabsTrigger>
        </TabsList>

        {/* Personal Stats Tab */}
        <TabsContent value="stats">
          {stats ? (
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <StatRow label="Total trades" value={stats.tradeCount} icon={<Zap className="h-3 w-3" />} />
                  <StatRow label="Buy orders" value={stats.buyCount} />
                  <StatRow label="Sell orders" value={stats.sellCount} />
                  <StatRow label="Avg trade size" value={`$${stats.avgTradeSize.toFixed(2)}`} />
                  <StatRow label="Total volume" value={`$${stats.totalVolume.toFixed(0)}`} />
                  <StatRow label="Markets traded" value={stats.marketsTraded} />
                  <StatRow label="Avg time between" value={stats.behavioral.avgTimeBetweenTrades > 0 ? `${stats.behavioral.avgTimeBetweenTrades.toFixed(1)}m` : "—"} />
                  {stats.behavioral.overtradingIndicator && (
                    <div className="flex items-center gap-1.5 pt-2 text-xs text-warning">
                      <AlertTriangle className="h-3 w-3" />Overtrading detected
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
                  <StatRow label="Return/trade" value={`$${stats.behavioral.returnPerTrade.toFixed(2)}`}
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
                      More trades needed for analysis
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Place some trades to see your stats.</p>
          )}
        </TabsContent>

        {/* Decision Quality Tab */}
        <TabsContent value="decisions">
          {stats ? (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4" />Decision Metrics</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <StatRow label="Early buyer score" value={`${(stats.decisionQuality.earlyBuyerScore * 100).toFixed(0)}%`}
                    icon={<TrendingUp className="h-3 w-3" />} />
                  <StatRow label="Chase buy rate" value={`${(stats.decisionQuality.chaseBuyRate * 100).toFixed(0)}%`}
                    className={stats.decisionQuality.chaseBuyRate > 0.3 ? "price-down" : ""} />
                  <StatRow label="Overconfident buy rate" value={`${(stats.decisionQuality.overconfidentBuyRate * 100).toFixed(0)}%`}
                    className={stats.decisionQuality.overconfidentBuyRate > 0.2 ? "price-down" : ""} />
                  <StatRow label="Early sell rate" value={`${(stats.decisionQuality.earlySellRate * 100).toFixed(0)}%`}
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
            <p className="text-sm text-muted-foreground text-center py-8">Place some trades to see decision analytics.</p>
          )}
        </TabsContent>

        {/* Settled Outcomes Tab */}
        <TabsContent value="settled">
          <Card>
            <CardHeader><CardTitle className="text-sm">Settled Trade Outcomes</CardTitle></CardHeader>
            <CardContent>
              {settledOutcomes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No settled positions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Market</th>
                        <th className="pb-3 font-medium">Outcome</th>
                        <th className="pb-3 font-medium text-right">Type</th>
                        <th className="pb-3 font-medium text-right">Price</th>
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
                          <td className="py-3 text-right font-mono">{(o.pricePerShare * 100).toFixed(1)}¢</td>
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
            <CardHeader><CardTitle className="text-sm">Trade Timing Review</CardTitle></CardHeader>
            <CardContent>
              {tradeTimings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No trades to review.</p>
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
                            {(t.priceBefore * 100).toFixed(1)}→{(t.priceAfter * 100).toFixed(1)}¢
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
                      <p className="text-sm text-muted-foreground text-center py-4">No winning positions yet</p>
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
                      <p className="text-sm text-muted-foreground text-center py-4">No losing positions yet</p>
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
              <CardHeader><CardTitle className="text-lg">Open Positions</CardTitle></CardHeader>
              <CardContent>
                {portfolio.holdings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No positions yet. <Link to="/markets" className="text-primary underline">Browse markets</Link> to start trading.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 font-medium">Market</th>
                          <th className="pb-3 font-medium">Outcome</th>
                          <th className="pb-3 font-medium text-right">Shares</th>
                          <th className="pb-3 font-medium text-right">Avg Cost</th>
                          <th className="pb-3 font-medium text-right">Price</th>
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
                            <td className="py-3 text-right font-mono">{p.shares}</td>
                            <td className="py-3 text-right font-mono">{((p.costBasis / p.shares) * 100).toFixed(1)}¢</td>
                            <td className="py-3 text-right font-mono">{((p.currentValue / p.shares) * 100).toFixed(1)}¢</td>
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
          <CardHeader><CardTitle className="text-lg">Trade History ({userTrades.length} total)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Market</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Qty</th>
                    <th className="pb-3 font-medium text-right">Price</th>
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
                      <td className="py-3 text-right font-mono">{t.quantity}</td>
                      <td className="py-3 text-right font-mono">{(t.pricePerShare * 100).toFixed(1)}¢</td>
                      <td className="py-3 text-right font-mono">${t.totalCost.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono text-xs">
                        {(t.priceBeforeTrade * 100).toFixed(1)}→{(t.priceAfterTrade * 100).toFixed(1)}¢
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
