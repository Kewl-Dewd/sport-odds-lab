import { DollarSign, Briefcase, TrendingUp, TrendingDown, ArrowUpRight, Clock, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarket } from "@/context/MarketContext";

export default function Dashboard() {
  const { portfolio, portfolioStats, recentTrades, topMovers, trades, classroom, getLeaderboard } = useMarket();
  const leaderboard = getLeaderboard("portfolio");
  const myRank = leaderboard.findIndex((e) => e.userId === portfolio.userId) + 1;

  const stats = [
    { label: "Available Cash", value: `$${portfolioStats.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, change: null },
    { label: "Portfolio Value", value: `$${portfolioStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Briefcase, change: portfolioStats.unrealizedPnL !== 0 ? `${portfolioStats.unrealizedPnL >= 0 ? "+" : ""}$${portfolioStats.unrealizedPnL.toFixed(2)}` : null },
    { label: "Open Positions", value: String(portfolio.holdings.length), icon: TrendingUp, change: null },
    { label: "Class Rank", value: myRank > 0 ? `#${myRank}` : "—", icon: GraduationCap, change: null },
  ];

  return (
    <div className="container py-8 space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">{classroom.name} · {portfolio.displayName}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono">{s.value}</div>
            {s.change && <span className={`text-sm font-medium ${s.change.startsWith("+") ? "price-up" : "price-down"}`}>{s.change}</span>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Trades</CardTitle></CardHeader>
          <CardContent>
            {recentTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No trades yet. <Link to="/markets" className="text-primary underline">Browse markets</Link> to start trading.
              </p>
            ) : (
              <div className="space-y-3">
                {recentTrades.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{t.marketTitle}</p>
                      <p className="text-xs text-muted-foreground">{t.outcomeName}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className={`text-sm font-semibold ${t.type === "BUY" ? "price-up" : "price-down"}`}>
                        {t.type} {t.quantity} @ {(t.pricePerShare * 100).toFixed(1)}¢
                      </span>
                      <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />${t.totalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Top Movers</CardTitle></CardHeader>
          <CardContent>
            {topMovers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Prices will move as trades are placed.</p>
            ) : (
              <div className="space-y-3">
                {topMovers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{m.marketTitle}</p>
                      <p className="text-xs text-muted-foreground">{m.outcomeName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold">{(m.price * 100).toFixed(1)}¢</span>
                      <span className={`flex items-center text-sm font-medium ${m.change > 0 ? "price-up" : "price-down"}`}>
                        {m.change > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                        {m.change > 0 ? "+" : ""}{(m.change * 100).toFixed(1)}¢
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
