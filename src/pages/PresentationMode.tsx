import { useState, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, TrendingUp, TrendingDown, BarChart3, Zap, Play, Pause, SkipForward, SkipBack, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMarket, type LeaderboardMode } from "@/context/MarketContext";
import { calculateMarketAnalytics, buildPriceHistory } from "@/lib/marketAnalytics";
import { PriceHistoryChart } from "@/components/charts/AnalyticsCharts";
import { cn } from "@/lib/utils";

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-8 w-8 text-warning" />;
  if (rank === 2) return <Medal className="h-7 w-7 text-muted-foreground" />;
  if (rank === 3) return <Medal className="h-7 w-7 text-warning/60" />;
  return <span className="text-2xl font-bold font-mono text-muted-foreground">{rank}</span>;
};

function PresentHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/instructor"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
      </Button>
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="text-sm text-muted-foreground font-mono">
        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

function LiveLeaderboard() {
  const { getLeaderboard, classroom } = useMarket();
  const entries = getLeaderboard("portfolio");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PresentHeader title={`🏆 ${classroom.name} — Leaderboard`} />
      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Top 3 */}
        {entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            {entries.slice(0, 3).map((e, i) => (
              <div key={e.userId} className={cn(
                "rounded-2xl border-2 p-6 text-center",
                i === 0 ? "border-warning bg-warning/10" : "border-border"
              )}>
                <div className="flex justify-center mb-3">{rankIcon(i + 1)}</div>
                <h2 className="text-2xl font-bold">{e.displayName}</h2>
                <p className={cn("text-4xl font-bold font-mono mt-2", e.returnPct >= 0 ? "price-up" : "price-down")}>
                  ${e.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className={cn("text-lg font-mono", e.returnPct >= 0 ? "price-up" : "price-down")}>
                  {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">{e.tradeCount} trades</p>
              </div>
            ))}
          </div>
        )}

        {/* Rest of leaderboard */}
        <div className="space-y-2">
          {entries.slice(3).map((e, i) => (
            <div key={e.userId} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold font-mono text-muted-foreground w-8 text-right">{i + 4}</span>
                <span className="text-lg font-semibold">{e.displayName}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-mono text-lg">${e.portfolioValue.toFixed(0)}</span>
                <span className={cn("font-mono text-lg", e.returnPct >= 0 ? "price-up" : "price-down")}>
                  {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">{e.tradeCount} trades</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketBoard() {
  const { markets, classroom, trades } = useMarket();
  const classMarkets = markets.filter((m) => m.classroomId === classroom.id && m.status !== "settled");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PresentHeader title={`📊 ${classroom.name} — Market Board`} />
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-auto">
        {classMarkets.map((m) => {
          const priceSum = m.outcomes.reduce((s, o) => s + o.price, 0);
          const analytics = calculateMarketAnalytics(m, trades);
          return (
            <div key={m.id} className="rounded-xl border-2 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{m.title}</h2>
                <span className={cn("px-2 py-0.5 rounded text-xs font-semibold",
                  m.status === "open" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                )}>{m.status}</span>
              </div>
              <div className="text-xs text-muted-foreground">{m.league} · {analytics.tradeCount} trades · ${analytics.totalVolume.toFixed(0)} vol</div>
              <div className="space-y-2">
                {m.outcomes.map((o) => {
                  const pct = (o.price / Math.max(priceSum, 0.01)) * 100;
                  return (
                    <div key={o.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{o.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{pct.toFixed(0)}%</span>
                          <span className="font-mono text-xs text-muted-foreground">{(o.price * 100).toFixed(1)}¢</span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarketHeatmap() {
  const { markets, trades, classroom } = useMarket();
  const classMarkets = markets.filter((m) => m.classroomId === classroom.id && m.status !== "settled");

  const heatData = classMarkets.map((m) => {
    const analytics = calculateMarketAnalytics(m, trades);
    const maxChange = Math.max(...analytics.outcomeAnalytics.map((o) => Math.abs(o.priceChange)));
    return { market: m, analytics, maxChange };
  }).sort((a, b) => b.maxChange - a.maxChange);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PresentHeader title={`🔥 ${classroom.name} — Market Heatmap`} />
      <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-auto">
        {heatData.map(({ market: m, analytics, maxChange }) => {
          const intensity = Math.min(maxChange * 10, 1);
          const isUp = analytics.outcomeAnalytics.some((o) => o.priceChange > 0);
          return (
            <div key={m.id} className="rounded-xl p-4 border-2 transition-all" style={{
              borderColor: isUp ? `hsl(142 76% 36% / ${0.2 + intensity * 0.6})` : `hsl(0 84% 60% / ${0.2 + intensity * 0.6})`,
              backgroundColor: isUp ? `hsl(142 76% 36% / ${intensity * 0.1})` : `hsl(0 84% 60% / ${intensity * 0.1})`,
            }}>
              <h3 className="font-bold text-sm truncate">{m.title}</h3>
              <p className="text-xs text-muted-foreground">{m.league}</p>
              <div className="mt-2 space-y-1">
                {m.outcomes.slice(0, 3).map((o) => {
                  const oa = analytics.outcomeAnalytics.find((a) => a.outcomeId === o.id);
                  return (
                    <div key={o.id} className="flex justify-between text-xs">
                      <span className="truncate">{o.name}</span>
                      <span className={cn("font-mono", oa && oa.priceChange > 0 ? "price-up" : oa && oa.priceChange < 0 ? "price-down" : "")}>
                        {(o.price * 100).toFixed(0)}¢
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{analytics.tradeCount} trades</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopMovers() {
  const { markets, trades, classroom } = useMarket();
  const classMarkets = markets.filter((m) => m.classroomId === classroom.id);

  // Collect all outcome movements
  const allMovements: { market: string; outcome: string; change: number; price: number }[] = [];
  for (const m of classMarkets) {
    const analytics = calculateMarketAnalytics(m, trades);
    for (const oa of analytics.outcomeAnalytics) {
      if (oa.priceChange !== 0) {
        allMovements.push({
          market: m.title,
          outcome: oa.outcomeName,
          change: oa.priceChange,
          price: oa.currentPrice,
        });
      }
    }
  }

  const sorted = allMovements.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 15);
  const gainers = sorted.filter((m) => m.change > 0);
  const losers = sorted.filter((m) => m.change < 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PresentHeader title={`⚡ ${classroom.name} — Top Movers`} />
      <div className="flex-1 p-6 grid md:grid-cols-2 gap-6 overflow-auto">
        {/* Gainers */}
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 price-up">
            <TrendingUp className="h-6 w-6" /> Gainers
          </h2>
          <div className="space-y-2">
            {gainers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No gainers yet</p>
            ) : gainers.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4 bg-success/5">
                <div>
                  <p className="font-semibold">{m.outcome}</p>
                  <p className="text-sm text-muted-foreground">{m.market}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono price-up">+{(m.change * 100).toFixed(1)}¢</p>
                  <p className="font-mono text-sm">{(m.price * 100).toFixed(1)}¢</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Losers */}
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 price-down">
            <TrendingDown className="h-6 w-6" /> Fallers
          </h2>
          <div className="space-y-2">
            {losers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fallers yet</p>
            ) : losers.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4 bg-destructive/5">
                <div>
                  <p className="font-semibold">{m.outcome}</p>
                  <p className="text-sm text-muted-foreground">{m.market}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono price-down">{(m.change * 100).toFixed(1)}¢</p>
                  <p className="font-mono text-sm">{(m.price * 100).toFixed(1)}¢</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketReplayPresentation() {
  const { markets, trades, classroom } = useMarket();
  const [searchParams] = useSearchParams();
  const marketId = searchParams.get("market") ?? markets[0]?.id ?? "";
  const market = markets.find((m) => m.id === marketId);

  const allTrades = useMemo(
    () => market ? trades.filter((t) => t.marketId === market.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [],
    [market, trades]
  );

  const fullHistory = useMemo(() => market ? buildPriceHistory(market, trades) : [], [market, trades]);
  const [step, setStep] = useState(fullHistory.length);
  const maxStep = Math.max(fullHistory.length - 1, 0);
  const visibleHistory = useMemo(() => fullHistory.slice(0, step + 1), [fullHistory, step]);

  const currentTrade = step > 0 && step <= allTrades.length ? allTrades[step - 1] : null;

  if (!market) return (
    <div className="min-h-screen bg-background flex flex-col">
      <PresentHeader title="Market Replay" />
      <p className="text-center text-muted-foreground py-16">No market selected.</p>
    </div>
  );

  const priceSum = market.outcomes.reduce((s, o) => s + o.price, 0);
  const analytics = calculateMarketAnalytics(market, trades);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PresentHeader title={`🔄 ${market.title} — Replay`} />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Probability bars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {market.outcomes.map((o) => {
            const pct = ((o.price / Math.max(priceSum, 0.01)) * 100).toFixed(0);
            const oa = analytics.outcomeAnalytics.find((a) => a.outcomeId === o.id);
            const isWinner = market.resolvedOutcomeId === o.id;
            return (
              <div key={o.id} className={cn("rounded-xl border-2 p-4 text-center", isWinner && "border-success bg-success/5")}>
                <h3 className="font-bold text-lg">{o.name}</h3>
                <p className="text-3xl font-bold font-mono">{pct}%</p>
                {oa && (
                  <p className={cn("text-sm font-mono", oa.priceChange > 0 ? "price-up" : oa.priceChange < 0 ? "price-down" : "text-muted-foreground")}>
                    {oa.priceChange > 0 ? "+" : ""}{(oa.priceChange * 100).toFixed(1)}¢
                  </p>
                )}
                {isWinner && <p className="text-sm font-semibold text-success mt-1">✓ Winner</p>}
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className="rounded-xl border p-6">
          <PriceHistoryChart priceHistory={visibleHistory} outcomes={market.outcomes} />
        </div>

        {/* Replay controls */}
        <div className="flex items-center gap-4 px-4">
          <Button variant="outline" size="icon" onClick={() => setStep(0)}><SkipBack className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setStep(Math.max(0, step - 1))}><ArrowLeft className="h-4 w-4" /></Button>
          <Button variant="default" size="icon" onClick={() => setStep(Math.min(maxStep, step + 1))}><ArrowRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setStep(maxStep)}><SkipForward className="h-4 w-4" /></Button>
          <div className="flex-1">
            <Slider value={[step]} onValueChange={([v]) => setStep(v)} min={0} max={maxStep} step={1} />
          </div>
          <span className="font-mono text-sm text-muted-foreground">{step}/{maxStep}</span>
        </div>

        {/* Current trade callout */}
        {currentTrade && (
          <div className="rounded-xl border-2 p-4 flex items-center justify-between text-lg">
            <div className="flex items-center gap-3">
              <span className={cn("text-xl font-bold", currentTrade.type === "BUY" ? "price-up" : "price-down")}>{currentTrade.type}</span>
              <span className="font-mono">{currentTrade.quantity}×</span>
              <span className="font-semibold">{currentTrade.outcomeName}</span>
            </div>
            <div className="font-mono text-xl">
              {(currentTrade.priceBeforeTrade * 100).toFixed(1)}¢ → {(currentTrade.priceAfterTrade * 100).toFixed(1)}¢
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PresentationMode() {
  const { view } = useParams<{ view: string }>();

  switch (view) {
    case "leaderboard": return <LiveLeaderboard />;
    case "board": return <MarketBoard />;
    case "heatmap": return <MarketHeatmap />;
    case "movers": return <TopMovers />;
    case "replay": return <MarketReplayPresentation />;
    default: return <LiveLeaderboard />;
  }
}
