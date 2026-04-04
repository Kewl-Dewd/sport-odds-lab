import { DollarSign, Briefcase, TrendingUp, TrendingDown, ArrowUpRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Available Cash", value: "$10,000", icon: DollarSign, change: null },
  { label: "Portfolio Value", value: "$12,450", icon: Briefcase, change: "+$2,450" },
  { label: "Open Positions", value: "8", icon: TrendingUp, change: null },
  { label: "Total Trades", value: "34", icon: ArrowUpRight, change: null },
];

const recentTrades = [
  { market: "Lakers vs Celtics", outcome: "Lakers Win", type: "BUY", shares: 50, price: 0.62, time: "2 min ago" },
  { market: "Super Bowl LVIII", outcome: "Chiefs Win", type: "SELL", shares: 30, price: 0.71, time: "15 min ago" },
  { market: "Man City vs Arsenal", outcome: "Draw", type: "BUY", shares: 100, price: 0.24, time: "1 hr ago" },
];

const topMovers = [
  { market: "Lakers vs Celtics", outcome: "Lakers Win", price: 0.62, change: 0.08 },
  { market: "Super Bowl LVIII", outcome: "49ers Win", price: 0.34, change: -0.05 },
  { market: "Wimbledon Final", outcome: "Djokovic", price: 0.55, change: 0.12 },
];

export default function Dashboard() {
  return (
    <div className="container py-8 space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Trader</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono">{s.value}</div>
            {s.change && (
              <span className="text-sm price-up font-medium">{s.change}</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTrades.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t.market}</p>
                    <p className="text-xs text-muted-foreground">{t.outcome}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className={`text-sm font-semibold ${t.type === "BUY" ? "price-up" : "price-down"}`}>
                      {t.type} {t.shares} @ ${t.price.toFixed(2)}
                    </span>
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />{t.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Movers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Movers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMovers.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{m.market}</p>
                    <p className="text-xs text-muted-foreground">{m.outcome}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">${m.price.toFixed(2)}</span>
                    <span className={`flex items-center text-sm font-medium ${m.change > 0 ? "price-up" : "price-down"}`}>
                      {m.change > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                      {m.change > 0 ? "+" : ""}{(m.change * 100).toFixed(0)}¢
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
