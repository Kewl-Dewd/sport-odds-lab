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
  { key: "bankroll", label: "Bankroll", icon: Trophy, description: "Biggest bankroll — starting bankroll minus stakes plus settled payouts." },
  { key: "return", label: "Best Return %", icon: TrendingUp, description: "Best percentage return on the starting bankroll." },
  { key: "efficiency", label: "Most Efficient", icon: Gauge, description: "Highest settled profit per bet placed." },
  { key: "accuracy", label: "Most Accurate", icon: Target, description: "Highest win rate on bets that have been graded." },
  { key: "activity", label: "Most Active", icon: Zap, description: "Most bets placed." },
];

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-warning" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-warning/60" />;
  return <span className="text-sm font-mono text-muted-foreground w-5 text-center inline-block">{rank}</span>;
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
    <div className="container py-8 space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">{activeEnrollment?.klass.name ?? "Your class"}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {boards.map((b) => (
          <Button
            key={b.key}
            variant={board === b.key ? "default" : "outline"}
            size="sm"
            onClick={() => setBoard(b.key)}
            className="gap-1.5"
          >
            <b.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{b.label}</span>
            <span className="sm:hidden">{b.label.split(" ")[0]}</span>
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{currentBoard.description}</p>

      {entries.length >= 3 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {entries.slice(0, 3).map((e, i) => {
            const rank = i + 1;
            return (
              <div key={e.user_id} className={cn("stat-card text-center", rank === 1 && "border-warning/40 bg-warning/5")}>
                <div className="flex justify-center mb-2">{rankIcon(rank)}</div>
                <h3 className="font-semibold text-lg">{e.display_name}</h3>
                <p className={cn("text-2xl font-bold font-mono", Number(e.net_pnl) >= 0 ? "price-up" : "price-down")}>
                  {formatValue(e)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {e.bet_count} bets · {money(e.bankroll, 0)} bankroll
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Bettors</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading standings…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No students in this class yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium w-12">Rank</th>
                    <th className="pb-3 font-medium">Bettor</th>
                    <th className="pb-3 font-medium text-right">Bankroll</th>
                    <th className="pb-3 font-medium text-right">Return</th>
                    <th className="pb-3 font-medium text-right">Bets</th>
                    <th className="pb-3 font-medium text-right hidden sm:table-cell">Open</th>
                    <th className="pb-3 font-medium text-right hidden sm:table-cell">Win Rate</th>
                    <th className="pb-3 font-medium text-right hidden lg:table-cell">P&L / bet</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const wr = winRate(e);
                    return (
                      <tr key={e.user_id} className="border-b last:border-0">
                        <td className="py-3">{rankIcon(i + 1)}</td>
                        <td className="py-3 font-medium">{e.display_name}</td>
                        <td className="py-3 text-right font-mono font-semibold">{money(e.bankroll, 0)}</td>
                        <td className={cn("py-3 text-right font-mono", Number(e.roi_pct) >= 0 ? "price-up" : "price-down")}>
                          {signedPct(e.roi_pct)}
                        </td>
                        <td className="py-3 text-right font-mono">{e.bet_count}</td>
                        <td className="py-3 text-right font-mono hidden sm:table-cell">{money(e.open_stake, 0)}</td>
                        <td className="py-3 text-right font-mono hidden sm:table-cell">{wr === null ? "—" : `${wr.toFixed(0)}%`}</td>
                        <td className="py-3 text-right font-mono hidden lg:table-cell">{signedMoney(perBet(e))}</td>
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
