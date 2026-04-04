import { CheckCircle2, Clock, AlertTriangle, Ban } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { calculateMarketAnalytics } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";
import type { PresentationSettings } from "../PresentationToolbar";

export function PresentSettlement({ settings }: { settings: PresentationSettings }) {
  const { markets, trades, classroom } = useMarket();
  const classMarkets = markets.filter((m) => m.classroomId === classroom.id);

  const settled = classMarkets.filter((m) => m.status === "settled");
  const pending = classMarkets.filter((m) => m.status === "open" || m.status === "closed" || m.status === "suspended");
  const voided = classMarkets.filter((m) => m.status === "void" || m.status === "cancelled");

  return (
    <div className="flex-1 p-8 overflow-auto">
      <h2 className="text-3xl font-bold text-center mb-8">✅ {classroom.name} — Settlements</h2>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Pending settlement (instructor-only) */}
        {settings.mode === "instructor" && pending.length > 0 && (
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-warning">
              <Clock className="h-5 w-5" /> Pending Settlement ({pending.length})
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {pending.map((m) => {
                const analytics = calculateMarketAnalytics(m, trades);
                return (
                  <div key={m.id} className="rounded-xl border-2 border-warning/30 p-5 bg-warning/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold">{m.title}</h4>
                      <span className="text-xs font-mono text-muted-foreground">{analytics.tradeCount} trades</span>
                    </div>
                    <div className="space-y-1.5">
                      {m.outcomes.map((o) => {
                        const pct = (o.price / Math.max(m.outcomes.reduce((s, x) => s + x.price, 0), 0.01) * 100);
                        return (
                          <div key={o.id} className="flex justify-between text-sm">
                            <span>{o.name}</span>
                            <span className="font-mono font-bold">{pct.toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                    {settings.mode === "instructor" && (
                      <p className="text-xs text-warning mt-3 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Awaiting instructor settlement
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settled */}
        {settled.length > 0 && (
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 price-up">
              <CheckCircle2 className="h-5 w-5" /> Settled ({settled.length})
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {settled.map((m) => {
                const winnerOutcome = m.outcomes.find((o) => o.id === m.resolvedOutcomeId);
                return (
                  <div key={m.id} className={cn(
                    "rounded-xl border-2 p-5 transition-all",
                    settings.highlightSettlements ? "border-success/50 bg-success/5 animate-pulse" : "border-border"
                  )}>
                    <h4 className="font-bold mb-2">{m.title}</h4>
                    <div className="space-y-1.5">
                      {m.outcomes.map((o) => {
                        const isWinner = o.id === m.resolvedOutcomeId;
                        return (
                          <div key={o.id} className={cn("flex justify-between text-sm", isWinner && "font-bold price-up")}>
                            <span className="flex items-center gap-1.5">
                              {isWinner && <CheckCircle2 className="h-4 w-4" />}
                              {o.name}
                            </span>
                            {settings.showProbabilities && (
                              <span className="font-mono">{(o.price * 100).toFixed(0)}¢</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {winnerOutcome && (
                      <p className="text-sm font-semibold mt-3 price-up">
                        Winner: {winnerOutcome.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Voided/Cancelled */}
        {voided.length > 0 && (
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-muted-foreground">
              <Ban className="h-5 w-5" /> Voided / Cancelled ({voided.length})
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              {voided.map((m) => (
                <div key={m.id} className="rounded-xl border p-4 opacity-60">
                  <h4 className="font-semibold text-sm">{m.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 uppercase">{m.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {settled.length === 0 && pending.length === 0 && voided.length === 0 && (
          <p className="text-center text-muted-foreground py-16 text-lg">No settlement data yet</p>
        )}
      </div>
    </div>
  );
}
