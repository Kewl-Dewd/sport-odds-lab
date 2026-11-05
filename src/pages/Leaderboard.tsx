import { useMemo, useState } from "react";
import { Trophy, Medal, TrendingUp, Target, Zap, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveClass } from "@/context/ClassContext";
import { useClassStandings, type StandingRow } from "@/hooks/useStudentBook";
import { money, signedMoney, signedPct } from "@/lib/money";
import { cn } from "@/lib/utils";

type Board = "bankroll" | "return" | "efficiency" | "accuracy" | "activity";

const boards: { key: Board; label: string; icon: typeof Trophy; description: string }[] = [
  { key: "bankroll", label: "Bankroll", icon: Trophy, description: "Total available bankroll (starting bankroll minus stakes plus settled payouts)." },
  { key: "return", label: "Best Return %", icon: TrendingUp, description: "Percentage return on capital across all settled positions." },
  { key: "efficiency", label: "Most Efficient", icon: Gauge, description: "Highest net profit earned per wager accepted." },
  { key: "accuracy", label: "Most Accurate", icon: Target, description: "Highest win percentage on graded wagers." },
  { key: "activity", label: "Most Active", icon: Zap, description: "Total number of wagers placed into the book." },
];

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-4 w-4 text-amber-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600/70" />;
  return <span className="text-xs font-mono text-muted-foreground w-4 text-center inline-block">{rank}</span>;
};

const perBet = (e: StandingRow) => (Number(e.bet_count) > 0 ? Number(e.net_pnl) / Number(e.bet_count) : 0);
const winRate = (e: StandingRow) =>
  Number(e.settled_count) > 0 ? (Number(e.wins) / Number(e.settled_count)) * 100 : null;

export default function Leaderboard() {
  const { activeEnrollment } = useActiveClass();
  const { data: standings = [], isLoading } = useClassStandings();
  const [board, setBoard] = useState<Board>("bankroll");

  const entries = useMemo(() => {
    const rows = [...standings];
    switch (board) {
      case "return": rows.sort((a, b) => Number(b.roi_pct) - Number(a.roi_pct)); break;
      case "efficiency": rows.sort((a, b) => perBet(b) - perBet(a)); break;
      case "accuracy": rows.sort((a, b) => (winRate(b) ?? -1) - (winRate(a) ?? -1)); break;
      case "activity": rows.sort((a, b) => Number(b.bet_count) - Number(a.bet_count)); break;
      default: rows.sort((a, b) => Number(b.bankroll) - Number(a.bankroll));
    }
    return rows;
  }, [standings, board]);

  const currentBoard = boards.find((b) => b.key === board)!;

  const formatValue = (e: StandingRow) => {
    switch (board) {
      case "return": return signedPct(e.roi_pct);
      case "efficiency": return `${signedMoney(perBet(e))}/bet`;
      case "accuracy": return winRate(e) === null ? "—" : `${winRate(e)!.toFixed(0)}%`;
      case "activity": return `${e.bet_count} bets`;
      default: return money(e.bankroll, 0);
    }
  };

  return (
    <div className="container max-w-6xl py-6 md:py-10 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="border-b border-border/80 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Class Standings
        </h1>
        <p className="text-xs sm:text-sm font-mono text-muted-foreground mt-1">
          {activeEnrollment?.klass.name ?? "Classroom Arena"} · Graded simulation performance
        </p>
      </div>

      {/* Metric Selector Buttons */}
      <div className="flex flex-wrap gap-2">
        {boards.map((b) => (
          <Button
            key={b.key}
            variant={board === b.key ? "default" : "outline"}
            size="sm"
            onClick={() => setBoard(b.key)}
            className="h-8 text-xs font-mono gap-1.5 uppercase tracking-wider"
          >
            <b.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{b.label}</span>
            <span className="sm:hidden">{b.label.split(" ")[0]}</span>
          </Button>
        ))}
      </div>

      <p className="text-xs font-mono text-muted-foreground">{currentBoard.description}</p>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="grid sm:grid-cols-3 gap-3 md:gap-4">
          {entries.slice(0, 3).map((e, i) => {
            const rank = i + 1;
            return (
              <div
                key={e.user_id}
                className={cn(
                  "stat-card text-center relative overflow-hidden",
                  rank === 1 && "border-amber-500/40 bg-amber-500/5",
                )}
              >
                <div className="flex justify-center mb-2">{rankIcon(rank)}</div>
                <h3 className="font-bold text-base sm:text-lg text-foreground truncate">{e.display_name}</h3>
                <p className={cn("text-xl sm:text-2xl font-bold font-mono tracking-tight mt-1", Number(e.net_pnl) >= 0 ? "price-up" : "price-down")}>
                  {formatValue(e)}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground mt-1.5">
                  {e.bet_count} bets · {money(e.bankroll, 0)} bankroll
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Standings Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold">Class Roster Standings</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <p className="text-xs font-mono text-muted-foreground text-center py-8">Syncing standings…</p>
          ) : entries.length === 0 ? (
            <p className="text-xs font-mono text-muted-foreground text-center py-8">No students enrolled in this classroom yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/80 text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 font-semibold w-12">Rank</th>
                    <th className="py-2.5 font-semibold font-sans">Student</th>
                    <th className="py-2.5 font-semibold text-right">Bankroll</th>
                    <th className="py-2.5 font-semibold text-right">ROI %</th>
                    <th className="py-2.5 font-semibold text-right">Bets</th>
                    <th className="py-2.5 font-semibold text-right hidden sm:table-cell">At Risk</th>
                    <th className="py-2.5 font-semibold text-right hidden sm:table-cell">Win Rate</th>
                    <th className="py-2.5 font-semibold text-right hidden lg:table-cell">Profit / Bet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {entries.map((e, i) => {
                    const wr = winRate(e);
                    return (
                      <tr key={e.user_id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3">{rankIcon(i + 1)}</td>
                        <td className="py-3 font-semibold font-sans text-foreground text-xs">{e.display_name}</td>
                        <td className="py-3 text-right font-bold text-foreground">{money(e.bankroll, 0)}</td>
                        <td className={cn("py-3 text-right font-bold", Number(e.roi_pct) >= 0 ? "price-up" : "price-down")}>
                          {signedPct(e.roi_pct)}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{e.bet_count}</td>
                        <td className="py-3 text-right text-muted-foreground hidden sm:table-cell">{money(e.open_stake, 0)}</td>
                        <td className="py-3 text-right text-muted-foreground hidden sm:table-cell">{wr === null ? "—" : `${wr.toFixed(0)}%`}</td>
                        <td className="py-3 text-right text-muted-foreground hidden lg:table-cell">{signedMoney(perBet(e))}</td>
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
