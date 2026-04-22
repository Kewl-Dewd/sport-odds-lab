import { Trophy, Medal } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { PresentationSettings } from "../PresentationToolbar";

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-12 w-12 text-warning" />;
  if (rank === 2) return <Medal className="h-11 w-11 text-muted-foreground" />;
  if (rank === 3) return <Medal className="h-11 w-11 text-warning/70" />;
  return <span className="text-4xl font-bold font-mono text-muted-foreground">{rank}</span>;
};

const aliasName = (name: string, idx: number, useAliases: boolean) =>
  useAliases ? `Trader ${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? idx - 25 : ""}` : name;

export function PresentLeaderboard({ settings }: { settings: PresentationSettings }) {
  const { getLeaderboard, classroom } = useMarket();
  const entries = getLeaderboard("portfolio");

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          icon={Trophy}
          title="No traders yet"
          description="Add students or wait for trades to appear before projecting the leaderboard."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 lg:p-10 space-y-8 overflow-auto">
      <h2 className="text-4xl lg:text-5xl font-bold text-center tracking-tight">
        🏆 {classroom.name} — Leaderboard
      </h2>

      {/* Podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-6 lg:gap-10 max-w-6xl mx-auto">
          {entries.slice(0, 3).map((e, i) => (
            <div key={e.userId} className={cn(
              "rounded-2xl border-2 p-8 lg:p-10 text-center transition-all",
              i === 0 ? "border-warning bg-warning/10 scale-105 shadow-2xl" : "border-border bg-card"
            )}>
              <div className="flex justify-center mb-5">{rankIcon(i + 1)}</div>
              <h3 className="text-2xl lg:text-3xl font-bold truncate">{aliasName(e.displayName, i, settings.useAliases)}</h3>
              <p className={cn("text-5xl lg:text-6xl font-bold font-mono mt-4 tabular-nums", e.returnPct >= 0 ? "price-up" : "price-down")}>
                ${e.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className={cn("text-2xl font-mono mt-2 tabular-nums", e.returnPct >= 0 ? "price-up" : "price-down")}>
                {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
              </p>
              {settings.showTradeStats && (
                <p className="text-base text-muted-foreground mt-3">{e.tradeCount} trades</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rest */}
      <div className="space-y-2.5 max-w-5xl mx-auto">
        {entries.slice(3).map((e, i) => (
          <div key={e.userId} className="flex items-center justify-between rounded-xl border bg-card p-5 lg:p-6 transition-all hover:bg-muted/30">
            <div className="flex items-center gap-6">
              <span className="text-3xl font-bold font-mono text-muted-foreground w-12 text-right tabular-nums">{i + 4}</span>
              <span className="text-2xl font-semibold">{aliasName(e.displayName, i + 3, settings.useAliases)}</span>
            </div>
            <div className="flex items-center gap-10">
              <span className="font-mono text-2xl tabular-nums">${e.portfolioValue.toFixed(0)}</span>
              <span className={cn("font-mono text-2xl min-w-[100px] text-right tabular-nums", e.returnPct >= 0 ? "price-up" : "price-down")}>
                {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
              </span>
              {settings.showTradeStats && (
                <span className="text-base text-muted-foreground w-24 text-right">{e.tradeCount} trades</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
