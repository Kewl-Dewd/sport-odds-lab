import { useState } from "react";
import { Trophy, Medal, TrendingUp, BarChart3, Target, Zap, Brain, Shield, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMarket, type LeaderboardMode } from "@/context/MarketContext";
import { cn } from "@/lib/utils";

const modes: { key: LeaderboardMode; label: string; icon: typeof Trophy; description: string }[] = [
  { key: "portfolio", label: "Portfolio Value", icon: Trophy, description: "Highest total portfolio value" },
  { key: "return", label: "Best Return %", icon: TrendingUp, description: "Best percentage return on starting capital" },
  { key: "decision", label: "Decision Quality", icon: Brain, description: "Best decision-making based on timing and edge capture" },
  { key: "risk", label: "Risk Management", icon: Shield, description: "Best diversification and position sizing" },
  { key: "efficiency", label: "Most Efficient", icon: Gauge, description: "Highest return per trade placed" },
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
      case "decision":
        return `${entry.decisionScore}/100`;
      case "risk":
        return `${entry.riskScore}/100`;
      case "efficiency":
        return `$${entry.efficiency.toFixed(2)}/trade`;
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
            <span className="hidden sm:inline">{m.label}</span>
            <span className="sm:hidden">{m.label.split(" ")[0]}</span>
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
                <p className={cn("text-2xl font-bold font-mono",
                  mode === "portfolio" || mode === "return" || mode === "efficiency"
                    ? (e.returnPct >= 0 ? "price-up" : "price-down")
                    : "text-primary"
                )}>
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
                    <th className="pb-3 font-medium text-right hidden md:table-cell">Decision</th>
                    <th className="pb-3 font-medium text-right hidden md:table-cell">Risk</th>
                    <th className="pb-3 font-medium text-right hidden lg:table-cell">Efficiency</th>
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
                        <td className="py-3 text-right hidden md:table-cell">
                          <ScoreBadge score={e.decisionScore} />
                        </td>
                        <td className="py-3 text-right hidden md:table-cell">
                          <ScoreBadge score={e.riskScore} />
                        </td>
                        <td className="py-3 text-right font-mono hidden lg:table-cell">
                          {e.efficiency >= 0 ? "+" : ""}${e.efficiency.toFixed(2)}
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

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-success/15 text-success" : score >= 40 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono font-medium", color)}>
      {score}
    </span>
  );
}
