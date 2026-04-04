import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack, Clock,
  TrendingUp, TrendingDown, BarChart3, Users, Zap,
  CheckCircle, Eye, EyeOff, User, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useMarket } from "@/context/MarketContext";
import { buildPriceHistory, calculateMarketAnalytics, buildPortfolioHistory } from "@/lib/marketAnalytics";
import {
  calculateStudentStats,
  getSettledTradeOutcomes,
  analyzeTradeTimings,
} from "@/lib/studentAnalytics";
import { PriceHistoryChart } from "@/components/charts/AnalyticsCharts";
import type { Trade, Market } from "@/lib/tradingEngine";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────

function r2(n: number) { return Math.round(n * 100) / 100; }

/** Find "major" trades — those that moved the price more than the threshold */
function findMajorTrades(trades: Trade[], threshold = 0.03): Trade[] {
  return trades.filter((t) => Math.abs(t.priceAfterTrade - t.priceBeforeTrade) >= threshold);
}

/** Detect volume spikes — trades whose cost is > 2× the avg trade cost */
function findVolumeSpikes(trades: Trade[]): Trade[] {
  if (trades.length < 3) return [];
  const avg = trades.reduce((s, t) => s + t.totalCost, 0) / trades.length;
  return trades.filter((t) => t.totalCost > avg * 2);
}

// ── Market Replay ─────────────────────────────────────────────────

function MarketReplay({ market, allTrades }: { market: Market; allTrades: Trade[] }) {
  const marketTrades = useMemo(
    () => allTrades.filter((t) => t.marketId === market.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [allTrades, market.id]
  );

  const [step, setStep] = useState(marketTrades.length); // default: show all
  const [playing, setPlaying] = useState(false);

  // Build full price history
  const fullPriceHistory = useMemo(() => buildPriceHistory(market, allTrades), [market, allTrades]);
  const analytics = useMemo(() => calculateMarketAnalytics(market, allTrades), [market, allTrades]);

  // Slice price history up to current step
  const visibleHistory = useMemo(() => fullPriceHistory.slice(0, step + 1), [fullPriceHistory, step]);

  // Major trades & volume spikes
  const majorTrades = useMemo(() => findMajorTrades(marketTrades), [marketTrades]);
  const volumeSpikes = useMemo(() => findVolumeSpikes(marketTrades), [marketTrades]);

  // Playback
  const maxStep = fullPriceHistory.length - 1;

  // Auto-play
  useState(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= maxStep) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  });

  const currentTrade = step > 0 && step <= marketTrades.length ? marketTrades[step - 1] : null;
  const priceSum = market.outcomes.reduce((s, o) => s + o.price, 0);

  return (
    <div className="space-y-6">
      {/* Market header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{market.title}</h2>
          <p className="text-sm text-muted-foreground">{market.league} · {market.sport} · {analytics.tradeCount} trades · ${analytics.totalVolume.toFixed(0)} volume</p>
        </div>
        <Badge variant={market.status === "settled" ? "default" : "outline"} className={market.status === "settled" ? "bg-success" : ""}>
          {market.status === "settled" ? `Settled: ${market.settlementResult}` : market.status}
        </Badge>
      </div>

      {/* Opening probabilities */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Opening → Current Probabilities</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {market.outcomes.map((o) => {
              const oa = analytics.outcomeAnalytics.find((a) => a.outcomeId === o.id);
              const openPct = oa ? (oa.openingPrice * 100).toFixed(0) : "—";
              const currPct = ((o.price / Math.max(priceSum, 0.01)) * 100).toFixed(0);
              const isWinner = market.resolvedOutcomeId === o.id;
              return (
                <div key={o.id} className={cn("flex items-center gap-3 rounded-lg p-2", isWinner && "bg-success/5")}>
                  <span className="text-sm font-medium flex-1">{o.name}{isWinner && <Badge className="ml-2 text-[10px] bg-success">Winner</Badge>}</span>
                  <span className="font-mono text-xs text-muted-foreground">{openPct}%</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className={cn("font-mono text-sm font-bold", oa && oa.priceChange > 0 ? "price-up" : oa && oa.priceChange < 0 ? "price-down" : "")}>
                    {currPct}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Price chart with replay slider */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Price Path</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <PriceHistoryChart priceHistory={visibleHistory} outcomes={market.outcomes} />

          {/* Replay controls */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStep(0)}>
              <SkipBack className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setStep(Math.max(0, step - 1))} disabled={step <= 0}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant={playing ? "destructive" : "default"} size="icon" className="h-8 w-8"
              onClick={() => {
                if (step >= maxStep) setStep(0);
                setPlaying(!playing);
              }}>
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setStep(Math.min(maxStep, step + 1))} disabled={step >= maxStep}>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setStep(maxStep)}>
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1">
              <Slider value={[step]} onValueChange={([v]) => setStep(v)} min={0} max={maxStep} step={1} className="w-full" />
            </div>
            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{step}/{maxStep}</span>
          </div>

          {/* Current trade annotation */}
          {currentTrade && (
            <div className="rounded-lg border p-3 text-sm flex items-center gap-3">
              <span className={cn("font-semibold", currentTrade.type === "BUY" ? "price-up" : "price-down")}>{currentTrade.type}</span>
              <span className="font-mono">{currentTrade.quantity}×</span>
              <span>{currentTrade.outcomeName}</span>
              <span className="text-muted-foreground">by {currentTrade.userId.slice(0, 8)}</span>
              <span className="ml-auto font-mono text-xs">
                {(currentTrade.priceBeforeTrade * 100).toFixed(1)}→{(currentTrade.priceAfterTrade * 100).toFixed(1)}¢
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Major Trades & Volume Spikes */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-warning" />Major Price-Moving Trades ({majorTrades.length})</CardTitle></CardHeader>
          <CardContent>
            {majorTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No major price moves detected.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {majorTrades.map((t) => {
                  const move = t.priceAfterTrade - t.priceBeforeTrade;
                  return (
                    <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <div>
                        <span className={cn("font-semibold", t.type === "BUY" ? "price-up" : "price-down")}>{t.type}</span>{" "}
                        <span className="font-mono">{t.quantity}</span> {t.outcomeName}
                        <p className="text-[10px] text-muted-foreground">{new Date(t.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <span className={cn("font-mono font-bold text-xs", move > 0 ? "price-up" : "price-down")}>
                        {move > 0 ? "+" : ""}{(move * 100).toFixed(1)}¢
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" />Volume Spikes ({volumeSpikes.length})</CardTitle></CardHeader>
          <CardContent>
            {volumeSpikes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No volume spikes detected.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {volumeSpikes.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <div>
                      <span className={cn("font-semibold", t.type === "BUY" ? "price-up" : "price-down")}>{t.type}</span>{" "}
                      {t.outcomeName}
                      <p className="text-[10px] text-muted-foreground">{new Date(t.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <span className="font-mono font-bold text-xs">${t.totalCost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full trade log */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Complete Trade Log ({marketTrades.length})</CardTitle></CardHeader>
        <CardContent>
          {marketTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No trades in this market.</p>
          ) : (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Outcome</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Price</th>
                    <th className="pb-2 font-medium text-right">Impact</th>
                    <th className="pb-2 font-medium text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {marketTrades.map((t, i) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="py-1.5 text-muted-foreground whitespace-nowrap">{new Date(t.timestamp).toLocaleTimeString()}</td>
                      <td className="py-1.5"><span className={cn("font-semibold", t.type === "BUY" ? "price-up" : "price-down")}>{t.type}</span></td>
                      <td className="py-1.5 font-medium">{t.outcomeName}</td>
                      <td className="py-1.5 text-right font-mono">{t.quantity}</td>
                      <td className="py-1.5 text-right font-mono">{(t.pricePerShare * 100).toFixed(1)}¢</td>
                      <td className="py-1.5 text-right font-mono">
                        {(t.priceBeforeTrade * 100).toFixed(1)}→{(t.priceAfterTrade * 100).toFixed(1)}¢
                      </td>
                      <td className="py-1.5 text-right font-mono">${t.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Student Trade Review ──────────────────────────────────────────

function StudentReview({
  studentId,
  displayName,
  allTrades,
  markets,
  startingBalance,
  anonymize,
}: {
  studentId: string;
  displayName: string;
  allTrades: Trade[];
  markets: Market[];
  startingBalance: number;
  anonymize: boolean;
}) {
  const userTrades = useMemo(
    () => allTrades.filter((t) => t.userId === studentId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [allTrades, studentId]
  );

  const portfolio = useMemo(() => ({
    userId: studentId,
    displayName,
    cash: startingBalance - userTrades.filter((t) => t.type === "BUY").reduce((s, t) => s + t.totalCost, 0) +
      userTrades.filter((t) => t.type === "SELL").reduce((s, t) => s + t.totalCost, 0),
    holdings: [] as any[],
  }), [studentId, displayName, startingBalance, userTrades]);

  const stats = useMemo(
    () => calculateStudentStats(portfolio, allTrades, markets, startingBalance),
    [portfolio, allTrades, markets, startingBalance]
  );

  const timings = useMemo(() => analyzeTradeTimings(studentId, allTrades), [studentId, allTrades]);
  const settledOutcomes = useMemo(() => getSettledTradeOutcomes(studentId, allTrades, markets), [studentId, allTrades, markets]);

  const name = anonymize ? `Trader ${studentId.slice(-4).toUpperCase()}` : displayName;

  // Best & worst trades
  const tradePnLs = userTrades.map((t) => {
    const pnl = t.type === "BUY"
      ? (t.priceAfterTrade - t.pricePerShare) * t.quantity
      : (t.pricePerShare - t.priceBeforeTrade) * t.quantity;
    return { trade: t, pnl };
  }).sort((a, b) => b.pnl - a.pnl);
  const bestTrades = tradePnLs.slice(0, 3);
  const worstTrades = tradePnLs.slice(-3).reverse();

  // Avg buy vs sell price
  const buys = userTrades.filter((t) => t.type === "BUY");
  const sells = userTrades.filter((t) => t.type === "SELL");
  const avgBuyPrice = buys.length > 0 ? buys.reduce((s, t) => s + t.pricePerShare, 0) / buys.length : 0;
  const avgSellPrice = sells.length > 0 ? sells.reduce((s, t) => s + t.pricePerShare, 0) / sells.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{name}</h2>
          <p className="text-sm text-muted-foreground">{stats.tradeCount} trades · ${stats.totalVolume.toFixed(0)} volume · {stats.marketsTraded} markets</p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="stat-card !p-3 text-center">
          <span className="text-[10px] text-muted-foreground uppercase">Return</span>
          <p className={cn("text-lg font-bold font-mono", stats.totalReturnPct >= 0 ? "price-up" : "price-down")}>
            {stats.totalReturnPct >= 0 ? "+" : ""}{stats.totalReturnPct.toFixed(1)}%
          </p>
        </div>
        <div className="stat-card !p-3 text-center">
          <span className="text-[10px] text-muted-foreground uppercase">Win Rate</span>
          <p className="text-lg font-bold font-mono">{(stats.winRate * 100).toFixed(0)}%</p>
        </div>
        <div className="stat-card !p-3 text-center">
          <span className="text-[10px] text-muted-foreground uppercase">Decision</span>
          <p className="text-lg font-bold font-mono">{stats.decisionQuality.compositeScore}/100</p>
        </div>
        <div className="stat-card !p-3 text-center">
          <span className="text-[10px] text-muted-foreground uppercase">Risk</span>
          <p className="text-lg font-bold font-mono">{stats.riskMetrics.compositeScore}/100</p>
        </div>
        <div className="stat-card !p-3 text-center">
          <span className="text-[10px] text-muted-foreground uppercase">Avg Buy/Sell</span>
          <p className="text-xs font-mono">
            <span className="price-up">{(avgBuyPrice * 100).toFixed(0)}¢</span> / <span className="price-down">{(avgSellPrice * 100).toFixed(0)}¢</span>
          </p>
        </div>
      </div>

      {/* Best & Worst trades + Timing review */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Best Trades</CardTitle></CardHeader>
          <CardContent>
            {bestTrades.filter((t) => t.pnl > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No profitable trades yet.</p>
            ) : (
              <div className="space-y-2">
                {bestTrades.filter((t) => t.pnl > 0).map(({ trade: t, pnl }) => (
                  <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <div>
                      <span className={cn("font-semibold", t.type === "BUY" ? "price-up" : "price-down")}>{t.type}</span>{" "}
                      {t.quantity}× {t.outcomeName}
                      <p className="text-[10px] text-muted-foreground">{t.marketTitle}</p>
                    </div>
                    <span className="font-mono font-bold price-up">+${pnl.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Worst Trades</CardTitle></CardHeader>
          <CardContent>
            {worstTrades.filter((t) => t.pnl < 0).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No losing trades yet.</p>
            ) : (
              <div className="space-y-2">
                {worstTrades.filter((t) => t.pnl < 0).map(({ trade: t, pnl }) => (
                  <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <div>
                      <span className={cn("font-semibold", t.type === "BUY" ? "price-up" : "price-down")}>{t.type}</span>{" "}
                      {t.quantity}× {t.outcomeName}
                      <p className="text-[10px] text-muted-foreground">{t.marketTitle}</p>
                    </div>
                    <span className="font-mono font-bold price-down">${pnl.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trade timing & entry/exit quality */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Trade Timing & Entry Quality</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Early Buyer</p>
              <p className="text-lg font-bold font-mono">{(stats.decisionQuality.earlyBuyerScore * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">of buys timed well</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Chase Rate</p>
              <p className={cn("text-lg font-bold font-mono", stats.decisionQuality.chaseBuyRate > 0.3 ? "price-down" : "")}>{(stats.decisionQuality.chaseBuyRate * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">chased momentum</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Early Sell</p>
              <p className={cn("text-lg font-bold font-mono", stats.decisionQuality.earlySellRate > 0.4 ? "price-down" : "")}>{(stats.decisionQuality.earlySellRate * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">sold too early</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Edge Captured</p>
              <p className={cn("text-lg font-bold font-mono", stats.decisionQuality.avgEdgeCaptured >= 0 ? "price-up" : "price-down")}>
                {(stats.decisionQuality.avgEdgeCaptured * 100).toFixed(1)}¢
              </p>
              <p className="text-[10px] text-muted-foreground">avg vs settlement</p>
            </div>
          </div>

          {timings.length > 0 && (
            <div className="overflow-x-auto max-h-52 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Market</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium text-right">Move</th>
                    <th className="pb-2 font-medium text-center">OK?</th>
                    <th className="pb-2 font-medium text-right">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {timings.slice(0, 20).map((t) => (
                    <tr key={t.tradeId} className="border-b last:border-0">
                      <td className="py-1 text-muted-foreground whitespace-nowrap">{new Date(t.timestamp).toLocaleTimeString()}</td>
                      <td className="py-1">{t.outcomeName}</td>
                      <td className="py-1"><span className={cn("font-semibold", t.type === "BUY" ? "price-up" : "price-down")}>{t.type}</span></td>
                      <td className="py-1 text-right font-mono">{(t.priceBefore * 100).toFixed(0)}→{(t.priceAfter * 100).toFixed(0)}¢</td>
                      <td className="py-1 text-center">{t.priceMoveFavorable ? <CheckCircle className="h-3 w-3 text-success inline" /> : "✗"}</td>
                      <td className="py-1 text-right">
                        {t.wasChase && <Badge variant="outline" className="text-[9px] text-warning mr-0.5">Chase</Badge>}
                        {t.wasOverconfident && <Badge variant="outline" className="text-[9px] text-destructive">OC</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strengths / Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        {stats.strengths.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-success">Strengths</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {stats.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />{s}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {stats.weaknesses.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-warning">Areas for Improvement</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {stats.weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Zap className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />{w}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Student Comparison ────────────────────────────────────────────

function StudentComparison({
  studentA,
  studentB,
  allTrades,
  markets,
  startingBalance,
}: {
  studentA: { id: string; name: string };
  studentB: { id: string; name: string };
  allTrades: Trade[];
  markets: Market[];
  startingBalance: number;
}) {
  const makePortfolio = (id: string, name: string) => {
    const t = allTrades.filter((tr) => tr.userId === id);
    return {
      userId: id, displayName: name,
      cash: startingBalance - t.filter((tr) => tr.type === "BUY").reduce((s, tr) => s + tr.totalCost, 0) +
        t.filter((tr) => tr.type === "SELL").reduce((s, tr) => s + tr.totalCost, 0),
      holdings: [] as any[],
    };
  };

  const statsA = useMemo(() => calculateStudentStats(makePortfolio(studentA.id, studentA.name), allTrades, markets, startingBalance), [studentA, allTrades, markets, startingBalance]);
  const statsB = useMemo(() => calculateStudentStats(makePortfolio(studentB.id, studentB.name), allTrades, markets, startingBalance), [studentB, allTrades, markets, startingBalance]);

  const metrics = [
    { label: "Trades", a: statsA.tradeCount, b: statsB.tradeCount },
    { label: "Return %", a: `${statsA.totalReturnPct.toFixed(1)}%`, b: `${statsB.totalReturnPct.toFixed(1)}%`, aVal: statsA.totalReturnPct, bVal: statsB.totalReturnPct },
    { label: "Win Rate", a: `${(statsA.winRate * 100).toFixed(0)}%`, b: `${(statsB.winRate * 100).toFixed(0)}%`, aVal: statsA.winRate, bVal: statsB.winRate },
    { label: "Decision Score", a: statsA.decisionQuality.compositeScore, b: statsB.decisionQuality.compositeScore },
    { label: "Risk Score", a: statsA.riskMetrics.compositeScore, b: statsB.riskMetrics.compositeScore },
    { label: "Efficiency", a: `$${statsA.behavioral.returnPerTrade.toFixed(2)}`, b: `$${statsB.behavioral.returnPerTrade.toFixed(2)}`, aVal: statsA.behavioral.returnPerTrade, bVal: statsB.behavioral.returnPerTrade },
    { label: "Markets Traded", a: statsA.marketsTraded, b: statsB.marketsTraded },
    { label: "Max Drawdown", a: `${statsA.riskMetrics.maxDrawdownPct.toFixed(1)}%`, b: `${statsB.riskMetrics.maxDrawdownPct.toFixed(1)}%`, aVal: -statsA.riskMetrics.maxDrawdownPct, bVal: -statsB.riskMetrics.maxDrawdownPct },
  ];

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Strategy Comparison (Anonymized)</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="pb-3 text-left font-medium">Metric</th>
              <th className="pb-3 text-right font-medium">Trader {studentA.id.slice(-4).toUpperCase()}</th>
              <th className="pb-3 text-right font-medium">Trader {studentB.id.slice(-4).toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const aNum = typeof m.a === "number" ? m.a : (m as any).aVal ?? 0;
              const bNum = typeof m.b === "number" ? m.b : (m as any).bVal ?? 0;
              return (
                <tr key={m.label} className="border-b last:border-0">
                  <td className="py-2.5 text-muted-foreground">{m.label}</td>
                  <td className={cn("py-2.5 text-right font-mono font-medium", aNum > bNum ? "text-foreground" : "text-muted-foreground")}>
                    {m.a}{aNum > bNum && " ✦"}
                  </td>
                  <td className={cn("py-2.5 text-right font-mono font-medium", bNum > aNum ? "text-foreground" : "text-muted-foreground")}>
                    {m.b}{bNum > aNum && " ✦"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function TradeReview() {
  const { markets, trades, students, classroom } = useMarket();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<string>(searchParams.get("tab") ?? "market");
  const [selectedMarket, setSelectedMarket] = useState(markets[0]?.id ?? "");
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.userId ?? "");
  const [anonymize, setAnonymize] = useState(false);
  const [compareA, setCompareA] = useState(students[0]?.userId ?? "");
  const [compareB, setCompareB] = useState(students[1]?.userId ?? students[0]?.userId ?? "");

  const market = markets.find((m) => m.id === selectedMarket);

  return (
    <div className="container py-8 space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/instructor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />Back to Instructor
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Trade Review & Replay</h1>
          <p className="text-muted-foreground">{classroom.name} — Classroom review tools for instructional use</p>
        </div>
        <Button
          variant={anonymize ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setAnonymize(!anonymize)}
        >
          {anonymize ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {anonymize ? "Anonymized" : "Anonymize"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="market"><BarChart3 className="h-3.5 w-3.5 mr-1" />Market Replay</TabsTrigger>
          <TabsTrigger value="student"><User className="h-3.5 w-3.5 mr-1" />Student Review</TabsTrigger>
          <TabsTrigger value="compare"><Users className="h-3.5 w-3.5 mr-1" />Compare</TabsTrigger>
        </TabsList>

        {/* ── Market Replay Tab ─────────────────────────────── */}
        <TabsContent value="market">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">Market:</label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {markets.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                        {m.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/instructor/present/replay?market=${selectedMarket}`}>
                  <MonitorPlay className="h-3.5 w-3.5 mr-1" />Present
                </Link>
              </Button>
            </div>
            {market && <MarketReplay market={market} allTrades={trades} />}
          </div>
        </TabsContent>

        {/* ── Student Review Tab ────────────────────────────── */}
        <TabsContent value="student">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">Student:</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.userId} value={s.userId}>
                      {anonymize ? `Trader ${s.userId.slice(-4).toUpperCase()}` : s.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {students.find((s) => s.userId === selectedStudent) && (
              <StudentReview
                studentId={selectedStudent}
                displayName={students.find((s) => s.userId === selectedStudent)!.displayName}
                allTrades={trades}
                markets={markets}
                startingBalance={classroom.startingBalance}
                anonymize={anonymize}
              />
            )}
          </div>
        </TabsContent>

        {/* ── Compare Tab ──────────────────────────────────── */}
        <TabsContent value="compare">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">Trader A:</label>
              <Select value={compareA} onValueChange={setCompareA}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.userId} value={s.userId}>
                      Trader {s.userId.slice(-4).toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground font-medium">vs</span>
              <label className="text-sm font-medium text-muted-foreground">Trader B:</label>
              <Select value={compareB} onValueChange={setCompareB}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.filter((s) => s.userId !== compareA).map((s) => (
                    <SelectItem key={s.userId} value={s.userId}>
                      Trader {s.userId.slice(-4).toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {compareA && compareB && compareA !== compareB && (
              <StudentComparison
                studentA={{ id: compareA, name: students.find((s) => s.userId === compareA)?.displayName ?? "" }}
                studentB={{ id: compareB, name: students.find((s) => s.userId === compareB)?.displayName ?? "" }}
                allTrades={trades}
                markets={markets}
                startingBalance={classroom.startingBalance}
              />
            )}
            {compareA === compareB && (
              <p className="text-sm text-muted-foreground text-center py-8">Select two different traders to compare.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Missing import for presentation link
import { MonitorPlay } from "lucide-react";
