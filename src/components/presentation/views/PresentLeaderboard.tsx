import { Trophy, Medal } from "lucide-react";
import { useMarket } from "@/context/MarketContext";
import { cn } from "@/lib/utils";
import type { PresentationSettings } from "../PresentationToolbar";

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-10 w-10 text-warning" />;
  if (rank === 2) return <Medal className="h-9 w-9 text-muted-foreground" />;
  if (rank === 3) return <Medal className="h-9 w-9 text-warning/60" />;
  return <span className="text-3xl font-bold font-mono text-muted-foreground">{rank}</span>;
};

const aliasName = (name: string, idx: number, useAliases: boolean) =>
  useAliases ? `Trader ${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? idx - 25 : ""}` : name;

export function PresentLeaderboard({ settings }: { settings: PresentationSettings }) {
  const { getLeaderboard, classroom } = useMarket();
  const entries = getLeaderboard("portfolio");

  return (
    <div className="flex-1 p-8 space-y-6 overflow-auto">
      <h2 className="text-3xl font-bold text-center">🏆 {classroom.name} — Leaderboard</h2>

      {/* Podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto mb-6">
          {entries.slice(0, 3).map((e, i) => (
            <div key={e.userId} className={cn(
              "rounded-2xl border-2 p-8 text-center transition-all",
              i === 0 ? "border-warning bg-warning/10 scale-105 shadow-lg" : "border-border"
            )}>
              <div className="flex justify-center mb-4">{rankIcon(i + 1)}</div>
              <h3 className="text-2xl font-bold truncate">{aliasName(e.displayName, i, settings.useAliases)}</h3>
              <p className={cn("text-5xl font-bold font-mono mt-3", e.returnPct >= 0 ? "price-up" : "price-down")}>
                ${e.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className={cn("text-xl font-mono mt-1", e.returnPct >= 0 ? "price-up" : "price-down")}>
                {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
              </p>
              {settings.showTradeStats && (
                <p className="text-sm text-muted-foreground mt-2">{e.tradeCount} trades</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rest */}
      <div className="space-y-2 max-w-4xl mx-auto">
        {entries.slice(3).map((e, i) => (
          <div key={e.userId} className="flex items-center justify-between rounded-xl border p-5 transition-all hover:bg-muted/30">
            <div className="flex items-center gap-5">
              <span className="text-2xl font-bold font-mono text-muted-foreground w-10 text-right">{i + 4}</span>
              <span className="text-xl font-semibold">{aliasName(e.displayName, i + 3, settings.useAliases)}</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="font-mono text-xl">${e.portfolioValue.toFixed(0)}</span>
              <span className={cn("font-mono text-xl min-w-[80px] text-right", e.returnPct >= 0 ? "price-up" : "price-down")}>
                {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
              </span>
              {settings.showTradeStats && (
                <span className="text-sm text-muted-foreground w-20 text-right">{e.tradeCount} trades</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
