import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const holdings = [
  { market: "Lakers vs Celtics", outcome: "Lakers Win", shares: 50, avgCost: 0.54, currentPrice: 0.62, value: 31 },
  { market: "Super Bowl LIX", outcome: "Chiefs Win", shares: 100, avgCost: 0.50, currentPrice: 0.55, value: 55 },
  { market: "Man City vs Arsenal", outcome: "Draw", shares: 200, avgCost: 0.20, currentPrice: 0.24, value: 48 },
  { market: "Wimbledon Final", outcome: "Djokovic", shares: 75, avgCost: 0.48, currentPrice: 0.55, value: 41.25 },
];

export default function Portfolio() {
  const totalValue = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.avgCost, 0);
  const pnl = totalValue - totalCost;

  return (
    <div className="container py-8 space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Your current holdings and performance</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Total Value</span>
          <p className="text-xl md:text-2xl font-bold font-mono">${totalValue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Total Cost</span>
          <p className="text-xl md:text-2xl font-bold font-mono">${totalCost.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">P&L</span>
          <p className={`text-xl md:text-2xl font-bold font-mono ${pnl >= 0 ? "price-up" : "price-down"}`}>
            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Market</th>
                  <th className="pb-3 font-medium">Outcome</th>
                  <th className="pb-3 font-medium text-right">Shares</th>
                  <th className="pb-3 font-medium text-right">Avg Cost</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const pl = (h.currentPrice - h.avgCost) * h.shares;
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 font-medium">{h.market}</td>
                      <td className="py-3">{h.outcome}</td>
                      <td className="py-3 text-right font-mono">{h.shares}</td>
                      <td className="py-3 text-right font-mono">${h.avgCost.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono">${h.currentPrice.toFixed(2)}</td>
                      <td className={`py-3 text-right font-mono font-medium ${pl >= 0 ? "price-up" : "price-down"}`}>
                        {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Portfolio History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            Portfolio value chart will be rendered here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
