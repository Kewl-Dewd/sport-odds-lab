import { useMarket } from "@/context/MarketContext";
import { calculateMarketAnalytics } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";
import type { PresentationSettings } from "../PresentationToolbar";

export function PresentHeatmap({ settings }: { settings: PresentationSettings }) {
  const { markets, trades, classroom } = useMarket();
  const classMarkets = markets.filter((m) => m.classroomId === classroom.id && m.status !== "settled");

  const heatData = classMarkets.map((m) => {
    const analytics = calculateMarketAnalytics(m, trades);
    const maxChange = Math.max(...analytics.outcomeAnalytics.map((o) => Math.abs(o.priceChange)), 0);
    return { market: m, analytics, maxChange };
  }).sort((a, b) => b.maxChange - a.maxChange);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h2 className="text-3xl font-bold text-center mb-6">🔥 {classroom.name} — Market Heatmap</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {heatData.map(({ market: m, analytics, maxChange }) => {
          const intensity = Math.min(maxChange * 10, 1);
          const isUp = analytics.outcomeAnalytics.some((o) => o.priceChange > 0);
          return (
            <div
              key={m.id}
              className="rounded-2xl p-5 border-2 transition-all"
              style={{
                borderColor: isUp
                  ? `hsl(var(--success) / ${0.2 + intensity * 0.6})`
                  : `hsl(var(--destructive) / ${0.2 + intensity * 0.6})`,
                backgroundColor: isUp
                  ? `hsl(var(--success) / ${intensity * 0.08})`
                  : `hsl(var(--destructive) / ${intensity * 0.08})`,
              }}
            >
              <h3 className="font-bold truncate">{m.title}</h3>
              <p className="text-xs text-muted-foreground">{m.league}</p>
              <div className="mt-3 space-y-1.5">
                {m.outcomes.slice(0, 4).map((o) => {
                  const oa = analytics.outcomeAnalytics.find((a) => a.outcomeId === o.id);
                  return (
                    <div key={o.id} className="flex justify-between text-sm">
                      <span className="truncate">{o.name}</span>
                      <span className={cn("font-mono font-semibold", oa && oa.priceChange > 0 ? "price-up" : oa && oa.priceChange < 0 ? "price-down" : "")}>
                        {settings.showProbabilities ? `${(o.price * 100).toFixed(0)}%` : `${(o.price * 100).toFixed(0)}¢`}
                      </span>
                    </div>
                  );
                })}
              </div>
              {settings.showTradeStats && (
                <p className="text-xs text-muted-foreground mt-3">{analytics.tradeCount} trades</p>
              )}
            </div>
          );
        })}
        {heatData.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-16 text-lg">No active markets</p>
        )}
      </div>
    </div>
  );
}
