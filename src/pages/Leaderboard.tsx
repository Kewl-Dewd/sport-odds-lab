import { Trophy, Medal, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const leaders = [
  { rank: 1, name: "Alice Chen", portfolio: 15200, trades: 52, winRate: 68 },
  { rank: 2, name: "Bob Smith", portfolio: 14100, trades: 41, winRate: 63 },
  { rank: 3, name: "Carol Wang", portfolio: 13800, trades: 38, winRate: 61 },
  { rank: 4, name: "David Kim", portfolio: 12900, trades: 44, winRate: 57 },
  { rank: 5, name: "Emma Lee", portfolio: 12450, trades: 34, winRate: 62 },
  { rank: 6, name: "Frank Park", portfolio: 11900, trades: 29, winRate: 55 },
  { rank: 7, name: "Grace Liu", portfolio: 11200, trades: 36, winRate: 53 },
  { rank: 8, name: "Henry Zhao", portfolio: 10800, trades: 22, winRate: 59 },
];

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-warning" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-warning/60" />;
  return <span className="text-sm font-mono text-muted-foreground w-5 text-center">{rank}</span>;
};

export default function Leaderboard() {
  return (
    <div className="container py-8 space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top traders by portfolio value</p>
      </div>

      {/* Top 3 Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {leaders.slice(0, 3).map((l) => (
          <div key={l.rank} className={`stat-card text-center ${l.rank === 1 ? "border-warning/40 bg-warning/5" : ""}`}>
            <div className="flex justify-center mb-2">{rankIcon(l.rank)}</div>
            <h3 className="font-semibold text-lg">{l.name}</h3>
            <p className="text-2xl font-bold font-mono price-up">${l.portfolio.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">{l.trades} trades · {l.winRate}% win rate</p>
          </div>
        ))}
      </div>

      {/* Full Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Traders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium w-12">Rank</th>
                  <th className="pb-3 font-medium">Trader</th>
                  <th className="pb-3 font-medium text-right">Portfolio</th>
                  <th className="pb-3 font-medium text-right">Trades</th>
                  <th className="pb-3 font-medium text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((l) => (
                  <tr key={l.rank} className="border-b last:border-0">
                    <td className="py-3">{rankIcon(l.rank)}</td>
                    <td className="py-3 font-medium">{l.name}</td>
                    <td className="py-3 text-right font-mono font-semibold">${l.portfolio.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono">{l.trades}</td>
                    <td className="py-3 text-right font-mono">{l.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
