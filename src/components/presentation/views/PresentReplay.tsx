import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMarket } from "@/context/MarketContext";
import { calculateMarketAnalytics, buildPriceHistory } from "@/lib/marketAnalytics";
import { PriceHistoryChart } from "@/components/charts/AnalyticsCharts";
import { cn } from "@/lib/utils";
import type { PresentationSettings } from "../PresentationToolbar";

export function PresentReplay({ settings }: { settings: PresentationSettings }) {
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
    <div className="flex-1 flex items-center justify-center">
      <p className="text-muted-foreground text-lg">No market selected for replay.</p>
    </div>
  );

  const priceSum = market.outcomes.reduce((s, o) => s + o.price, 0);
  const analytics = calculateMarketAnalytics(market, trades);

  return (
    <div className="flex-1 p-8 space-y-6 overflow-auto">
      <h2 className="text-3xl font-bold text-center">🔄 {market.title} — Replay</h2>

      {/* Probability cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {market.outcomes.map((o) => {
          const pct = ((o.price / Math.max(priceSum, 0.01)) * 100).toFixed(0);
          const oa = analytics.outcomeAnalytics.find((a) => a.outcomeId === o.id);
          const isWinner = market.resolvedOutcomeId === o.id;
          return (
            <div key={o.id} className={cn("rounded-xl border-2 p-5 text-center", isWinner && "border-success bg-success/5")}>
              <h3 className="font-bold text-lg">{o.name}</h3>
              {settings.showProbabilities && <p className="text-4xl font-bold font-mono">{pct}%</p>}
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

      {/* Controls */}
      <div className="flex items-center gap-4 px-4 max-w-3xl mx-auto">
        <Button variant="outline" size="icon" onClick={() => setStep(0)}><SkipBack className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={() => setStep(Math.max(0, step - 1))}><ArrowLeft className="h-4 w-4" /></Button>
        <Button variant="default" size="icon" onClick={() => setStep(Math.min(maxStep, step + 1))}><ArrowRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={() => setStep(maxStep)}><SkipForward className="h-4 w-4" /></Button>
        <div className="flex-1">
          <Slider value={[step]} onValueChange={([v]) => setStep(v)} min={0} max={maxStep} step={1} />
        </div>
        <span className="font-mono text-sm text-muted-foreground">{step}/{maxStep}</span>
      </div>

      {/* Trade callout */}
      {currentTrade && (
        <div className="rounded-xl border-2 p-5 flex items-center justify-between text-lg max-w-3xl mx-auto">
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
  );
}
