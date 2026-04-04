import { TrendingUp, TrendingDown } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { calculateMarketAnalytics } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";
import type { PresentationSettings } from "../PresentationToolbar";

export function PresentTopMovers({ settings }: { settings: PresentationSettings }) {
  const { markets, trades, classroom } = useMarket();
  const classMarkets = markets.filter((m) => m.classroomId === classroom.id);

  const allMovements: { market: string; outcome: string; change: number; price: number }[] = [];
  for (const m of classMarkets) {
    const analytics = calculateMarketAnalytics(m, trades);
    for (const oa of analytics.outcomeAnalytics) {
      if (oa.priceChange !== 0) {
        allMovements.push({ market: m.title, outcome: oa.outcomeName, change: oa.priceChange, price: oa.currentPrice });
      }
    }
  }

  const sorted = allMovements.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 15);
  const gainers = sorted.filter((m) => m.change > 0);
  const losers = sorted.filter((m) => m.change < 0);

  return (
    <div className="flex-1 p-8 overflow-auto">
      <h2 className="text-3xl font-bold text-center mb-8">⚡ {classroom.name} — Top Movers</h2>
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2 mb-5 price-up">
            <TrendingUp className="h-7 w-7" /> Gainers
          </h3>
          <div className="space-y-3">
            {gainers.length === 0 ? (
              <p className="text-muted-foreground">No gainers yet</p>
            ) : gainers.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border p-5 bg-success/5">
                <div>
                  <p className="text-lg font-semibold">{m.outcome}</p>
                  <p className="text-sm text-muted-foreground">{m.market}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono price-up">+{(m.change * 100).toFixed(1)}¢</p>
                  {settings.showProbabilities && (
                    <p className="font-mono text-sm">{(m.price * 100).toFixed(1)}¢</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2 mb-5 price-down">
            <TrendingDown className="h-7 w-7" /> Fallers
          </h3>
          <div className="space-y-3">
            {losers.length === 0 ? (
              <p className="text-muted-foreground">No fallers yet</p>
            ) : losers.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border p-5 bg-destructive/5">
                <div>
                  <p className="text-lg font-semibold">{m.outcome}</p>
                  <p className="text-sm text-muted-foreground">{m.market}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono price-down">{(m.change * 100).toFixed(1)}¢</p>
                  {settings.showProbabilities && (
                    <p className="font-mono text-sm">{(m.price * 100).toFixed(1)}¢</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
