import { useMarket } from "@/context/MarketContext";
import { calculateMarketAnalytics } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";
import type { PresentationSettings } from "../PresentationToolbar";

const statusColor: Record<string, string> = {
  open: "bg-success/15 text-success",
  scheduled: "bg-accent/15 text-accent",
  suspended: "bg-warning/15 text-warning",
  closed: "bg-destructive/15 text-destructive",
  settled: "bg-muted text-muted-foreground",
  void: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  postponed: "bg-warning/10 text-warning",
};

export function PresentMarketBoard({ settings }: { settings: PresentationSettings }) {
  const { markets, classroom, trades } = useMarket();
  const classMarkets = markets.filter((m) => m.classroomId === classroom.id && m.status !== "settled" && m.status !== "void" && m.status !== "cancelled");

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h2 className="text-3xl font-bold text-center mb-6">📊 {classroom.name} — Market Board</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {classMarkets.map((m) => {
          const priceSum = m.outcomes.reduce((s, o) => s + o.price, 0);
          const analytics = calculateMarketAnalytics(m, trades);
          return (
            <div key={m.id} className="rounded-2xl border-2 p-6 space-y-4 transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold leading-tight">{m.title}</h3>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold shrink-0", statusColor[m.status] ?? "bg-muted")}>
                  {m.status}
                </span>
              </div>
              {settings.showVolume && (
                <div className="text-xs text-muted-foreground">
                  {m.league} · {analytics.tradeCount} trades · ${analytics.totalVolume.toFixed(0)} vol
                </div>
              )}
              <div className="space-y-3">
                {m.outcomes.map((o) => {
                  const pct = (o.price / Math.max(priceSum, 0.01)) * 100;
                  return (
                    <div key={o.id}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-semibold">{o.name}</span>
                        <div className="flex items-center gap-3">
                          {settings.showProbabilities && (
                            <span className="font-mono font-bold text-lg">{pct.toFixed(0)}%</span>
                          )}
                          <span className="font-mono text-xs text-muted-foreground">{(o.price * 100).toFixed(1)}¢</span>
                        </div>
                      </div>
                      <div className="h-4 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {classMarkets.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-16 text-lg">No active markets</p>
        )}
      </div>
    </div>
  );
}
