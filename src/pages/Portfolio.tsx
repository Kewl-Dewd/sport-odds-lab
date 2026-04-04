import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, PieChart as PieIcon, DollarSign, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarket } from "@/context/MarketContext";
import { PortfolioPerformanceChart, HoldingsDistribution } from "@/components/charts/AnalyticsCharts";
import { buildPortfolioHistory, analyzePositions } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";

export default function Portfolio() {
  const { portfolio, portfolioStats, markets, trades, classroom } = useMarket();
  const { cash, holdingsValue, totalValue, unrealizedPnL } = portfolioStats;

  const userTrades = useMemo(() => trades.filter((t) => t.userId === portfolio.userId), [trades, portfolio.userId]);

  const realizedPnL = useMemo(() =>
    userTrades
      .filter((t) => t.type === "SELL")
      .reduce((sum, t) => sum + t.totalCost - t.quantity * t.priceBeforeTrade, 0),
    [userTrades]
  );

  const portfolioHistory = useMemo(
    () => buildPortfolioHistory(userTrades, classroom.startingBalance),
    [userTrades, classroom.startingBalance]
  );

  const positions = useMemo(
    () => analyzePositions(portfolio.holdings, markets),
    [portfolio.holdings, markets]
  );

  const cashUtilization = totalValue > 0 ? ((totalValue - cash) / totalValue) * 100 : 0;
  const returnPct = classroom.startingBalance > 0
    ? ((totalValue - classroom.startingBalance) / classroom.startingBalance) * 100
    : 0;

  const winners = positions.filter((p) => p.pnl > 0);
  const losers = positions.filter((p) => p.pnl < 0);

  return (
    <div className="container py-8 space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Your holdings and performance analytics</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Total Value</span>
          <p className="text-lg md:text-xl font-bold font-mono">${totalValue.toFixed(2)}</p>
          <span className={cn("text-xs font-mono", returnPct >= 0 ? "price-up" : "price-down")}>
            {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
          </span>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Cash</span>
          <p className="text-lg md:text-xl font-bold font-mono">${cash.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Holdings</span>
          <p className="text-lg md:text-xl font-bold font-mono">${holdingsValue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Unrealized P&L</span>
          <p className={cn("text-lg md:text-xl font-bold font-mono", unrealizedPnL >= 0 ? "price-up" : "price-down")}>
            {unrealizedPnL >= 0 ? "+" : ""}${unrealizedPnL.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Realized P&L</span>
          <p className={cn("text-lg md:text-xl font-bold font-mono", realizedPnL >= 0 ? "price-up" : "price-down")}>
            {realizedPnL >= 0 ? "+" : ""}${realizedPnL.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Cash Utilization</span>
          <p className="text-lg md:text-xl font-bold font-mono">{cashUtilization.toFixed(0)}%</p>
          <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${cashUtilization}%` }} />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Portfolio Performance</CardTitle></CardHeader>
          <CardContent>
            <PortfolioPerformanceChart snapshots={portfolioHistory} startingCash={classroom.startingBalance} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieIcon className="h-4 w-4" />Holdings Distribution</CardTitle></CardHeader>
          <CardContent>
            <HoldingsDistribution positions={positions} cash={cash} />
          </CardContent>
        </Card>
      </div>

      {/* Top Winners and Losers */}
      {positions.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />Winning Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {winners.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No winning positions yet</p>
              ) : (
                <div className="space-y-2">
                  {winners.slice(0, 5).map((p) => (
                    <div key={p.outcomeId} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                      <div>
                        <p className="font-medium">{p.outcomeName}</p>
                        <p className="text-xs text-muted-foreground">{p.marketTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono price-up font-semibold">+${p.pnl.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground font-mono">+{p.pnlPct.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />Losing Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {losers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No losing positions yet</p>
              ) : (
                <div className="space-y-2">
                  {losers.slice(0, 5).map((p) => (
                    <div key={p.outcomeId} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                      <div>
                        <p className="font-medium">{p.outcomeName}</p>
                        <p className="text-xs text-muted-foreground">{p.marketTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono price-down font-semibold">${p.pnl.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.pnlPct.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Holdings Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Open Positions</CardTitle></CardHeader>
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
                  {positions.map((p) => (
                    <tr key={p.outcomeId} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        <Link to={`/markets/${portfolio.holdings.find((h) => h.outcomeId === p.outcomeId)?.marketId}`} className="hover:text-primary transition-colors">
                          {p.marketTitle}
                        </Link>
                      </td>
                      <td className="py-3">{p.outcomeName}</td>
                      <td className="py-3 text-right font-mono">{p.shares}</td>
                      <td className="py-3 text-right font-mono">{((p.costBasis / p.shares) * 100).toFixed(1)}¢</td>
                      <td className="py-3 text-right font-mono">{((p.currentValue / p.shares) * 100).toFixed(1)}¢</td>
                      <td className="py-3 text-right font-mono">${p.currentValue.toFixed(2)}</td>
                      <td className={cn("py-3 text-right font-mono font-medium", p.pnl >= 0 ? "price-up" : "price-down")}>
                        {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)} ({p.pnlPct > 0 ? "+" : ""}{p.pnlPct.toFixed(1)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade History */}
      {userTrades.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Trade History ({userTrades.length} total)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Market</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Qty</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-right">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {userTrades.slice(0, 30).map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3">
                        <div className="font-medium">{t.marketTitle}</div>
                        <div className="text-xs text-muted-foreground">{t.outcomeName}</div>
                      </td>
                      <td className="py-3">
                        <span className={cn("font-semibold", t.type === "BUY" ? "price-up" : "price-down")}>{t.type}</span>
                      </td>
                      <td className="py-3 text-right font-mono">{t.quantity}</td>
                      <td className="py-3 text-right font-mono">{(t.pricePerShare * 100).toFixed(1)}¢</td>
                      <td className="py-3 text-right font-mono">${t.totalCost.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono text-xs">
                        {(t.priceBeforeTrade * 100).toFixed(1)}→{(t.priceAfterTrade * 100).toFixed(1)}¢
                      </td>
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
