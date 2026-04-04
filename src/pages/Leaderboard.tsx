import { useState } from "react";
import { Trophy, Medal, TrendingUp, BarChart3, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMarket, type LeaderboardMode } from "@/context/MarketContext";
import { cn } from "@/lib/utils";

const modes: { key: LeaderboardMode; label: string; icon: typeof Trophy; description: string }[] = [
  { key: "portfolio", label: "Portfolio Value", icon: Trophy, description: "Highest total portfolio value" },
  { key: "return", label: "Best Return %", icon: TrendingUp, description: "Best percentage return on starting capital" },
  { key: "accuracy", label: "Most Accurate", icon: Target, description: "Highest win rate on trades" },
  { key: "activity", label: "Most Active", icon: Zap, description: "Most trades placed" },
];

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-warning" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-warning/60" />;
  return <span className="text-sm font-mono text-muted-foreground w-5 text-center inline-block">{rank}</span>;
};

export default function Leaderboard() {
  const { getLeaderboard, classroom } = useMarket();
  const [mode, setMode] = useState<LeaderboardMode>("portfolio");

  const entries = getLeaderboard(mode);
  const currentMode = modes.find((m) => m.key === mode)!;

  const formatValue = (entry: typeof entries[0]) => {
    switch (mode) {
      case "portfolio":
        return `$${entry.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case "return":
        return `${entry.returnPct >= 0 ? "+" : ""}${entry.returnPct.toFixed(1)}%`;
      case "accuracy":
        return entry.tradeCount > 0 ? `${((entry.winCount / entry.tradeCount) * 100).toFixed(0)}%` : "—";
      case "activity":
        return `${entry.tradeCount} trades`;
    }
  };

  return (
    <div className="container py-8 space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">{classroom.name}</p>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <Button
            key={m.key}
            variant={mode === m.key ? "default" : "outline"}
            size="sm"
            onClick={() => setMode(m.key)}
            className="gap-1.5"
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{currentMode.description}</p>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {entries.slice(0, 3).map((e, i) => {
            const rank = i + 1;
            return (
              <div key={e.userId} className={cn("stat-card text-center", rank === 1 && "border-warning/40 bg-warning/5")}>
                <div className="flex justify-center mb-2">{rankIcon(rank)}</div>
                <h3 className="font-semibold text-lg">{e.displayName}</h3>
                <p className={cn("text-2xl font-bold font-mono", e.returnPct >= 0 ? "price-up" : "price-down")}>
                  {formatValue(e)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {e.tradeCount} trades · ${e.portfolioValue.toFixed(0)} total
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Traders</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No students in this class yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium w-12">Rank</th>
                    <th className="pb-3 font-medium">Trader</th>
                    <th className="pb-3 font-medium text-right">Portfolio</th>
                    <th className="pb-3 font-medium text-right">Return</th>
                    <th className="pb-3 font-medium text-right">Trades</th>
                    <th className="pb-3 font-medium text-right hidden sm:table-cell">Win Rate</th>
                    <th className="pb-3 font-medium text-right hidden md:table-cell">Best Trade</th>
                    <th className="pb-3 font-medium text-right hidden md:table-cell">Worst Trade</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const winRate = e.tradeCount > 0 ? ((e.winCount / e.tradeCount) * 100).toFixed(0) : "—";
                    return (
                      <tr key={e.userId} className="border-b last:border-0">
                        <td className="py-3">{rankIcon(i + 1)}</td>
                        <td className="py-3 font-medium">{e.displayName}</td>
                        <td className="py-3 text-right font-mono font-semibold">${e.portfolioValue.toFixed(0)}</td>
                        <td className={cn("py-3 text-right font-mono", e.returnPct >= 0 ? "price-up" : "price-down")}>
                          {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
                        </td>
                        <td className="py-3 text-right font-mono">{e.tradeCount}</td>
                        <td className="py-3 text-right font-mono hidden sm:table-cell">{winRate}{winRate !== "—" && "%"}</td>
                        <td className="py-3 text-right font-mono hidden md:table-cell price-up">
                          {e.bestTradePnL > 0 ? `+$${e.bestTradePnL.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-3 text-right font-mono hidden md:table-cell price-down">
                          {e.worstTradePnL < 0 ? `$${e.worstTradePnL.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
