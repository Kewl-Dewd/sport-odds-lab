import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarket } from "@/context/MarketContext";

export default function Portfolio() {
  const { portfolio, portfolioStats, markets, trades } = useMarket();
  const { cash, holdingsValue, totalValue, unrealizedPnL } = portfolioStats;

  // Calculate realized P&L from sells
  const realizedPnL = trades
    .filter((t) => t.type === "SELL")
    .reduce((sum, t) => {
      // revenue = totalCost (it's stored as absolute value for sells)
      // We approximate cost basis using priceBeforeTrade as proxy for avg entry
      // A more precise version would track cost lots
      return sum + t.totalCost - t.quantity * t.priceBeforeTrade;
    }, 0);

  return (
    <div className="container py-8 space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Your current holdings and performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Cash</span>
          <p className="text-xl md:text-2xl font-bold font-mono">${cash.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Holdings Value</span>
          <p className="text-xl md:text-2xl font-bold font-mono">${holdingsValue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Total Value</span>
          <p className="text-xl md:text-2xl font-bold font-mono">${totalValue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Unrealized P&L</span>
          <p className={`text-xl md:text-2xl font-bold font-mono ${unrealizedPnL >= 0 ? "price-up" : "price-down"}`}>
            {unrealizedPnL >= 0 ? "+" : ""}${unrealizedPnL.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Realized P&L</span>
          <p className={`text-xl md:text-2xl font-bold font-mono ${realizedPnL >= 0 ? "price-up" : "price-down"}`}>
            {realizedPnL >= 0 ? "+" : ""}${realizedPnL.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio.holdings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No positions yet. <Link to="/markets" className="text-primary underline">Browse markets</Link> to start trading.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Market</th>
                    <th className="pb-3 font-medium">Outcome</th>
                    <th className="pb-3 font-medium text-right">Shares</th>
                    <th className="pb-3 font-medium text-right">Avg Cost</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Value</th>
                    <th className="pb-3 font-medium text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((h) => {
                    const market = markets.find((m) => m.id === h.marketId);
                    const outcome = market?.outcomes.find((o) => o.id === h.outcomeId);
                    const currentPrice = outcome?.price ?? 0;
                    const value = h.shares * currentPrice;
                    const costBasis = h.shares * h.avgCostPerShare;
                    const pl = value - costBasis;
                    return (
                      <tr key={`${h.marketId}-${h.outcomeId}`} className="border-b last:border-0">
                        <td className="py-3 font-medium">
                          <Link to={`/markets/${h.marketId}`} className="hover:text-primary transition-colors">
                            {h.marketTitle}
                          </Link>
                        </td>
                        <td className="py-3">{h.outcomeName}</td>
                        <td className="py-3 text-right font-mono">{h.shares}</td>
                        <td className="py-3 text-right font-mono">{(h.avgCostPerShare * 100).toFixed(1)}¢</td>
                        <td className="py-3 text-right font-mono">{(currentPrice * 100).toFixed(1)}¢</td>
                        <td className="py-3 text-right font-mono">${value.toFixed(2)}</td>
                        <td className={`py-3 text-right font-mono font-medium ${pl >= 0 ? "price-up" : "price-down"}`}>
                          {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
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

      {/* Portfolio Chart Placeholder */}
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

      {/* Trade History */}
      {trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trade History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Market</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Qty</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 20).map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium">{t.marketTitle}</div>
                        <div className="text-xs text-muted-foreground">{t.outcomeName}</div>
                      </td>
                      <td className="py-3">
                        <span className={`font-semibold ${t.type === "BUY" ? "price-up" : "price-down"}`}>{t.type}</span>
                      </td>
                      <td className="py-3 text-right font-mono">{t.quantity}</td>
                      <td className="py-3 text-right font-mono">{(t.pricePerShare * 100).toFixed(1)}¢</td>
                      <td className="py-3 text-right font-mono">${t.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
