import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Clock, BarChart3, TrendingUp, TrendingDown,
  Activity, Users as UsersIcon, Droplets, Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/context/MarketContext";
import { TradeTicketModal } from "@/components/trading/TradeTicketModal";
import { EducationalSidebar } from "@/components/education/EducationalPanels";
import { PriceHistoryChart, VolumeChart, PressureIndicator } from "@/components/charts/AnalyticsCharts";
import { buildPriceHistory, calculateMarketAnalytics } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const { getMarket, getHolding, trades } = useMarket();
  const market = getMarket(id ?? "");

  const [tradeModal, setTradeModal] = useState<{
    open: boolean;
    outcomeId: string;
    outcomeName: string;
    type: "BUY" | "SELL";
  }>({ open: false, outcomeId: "", outcomeName: "", type: "BUY" });

  const priceHistory = useMemo(
    () => (market ? buildPriceHistory(market, trades) : []),
    [market, trades]
  );

  const analytics = useMemo(
    () => (market ? calculateMarketAnalytics(market, trades) : null),
    [market, trades]
  );

  if (!market) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Market not found.</p>
        <Link to="/markets" className="text-primary underline text-sm mt-2 inline-block">Back to Markets</Link>
      </div>
    );
  }

  const marketTrades = trades.filter((t) => t.marketId === market.id).slice(0, 10);
  const isOpen = market.status === "open";
  const firstOutcome = market.outcomes[0];

  const statusBadge = () => {
    switch (market.status) {
      case "open": return <span className="badge-live"><span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-subtle" />Open</span>;
      case "suspended": return <span className="badge-upcoming">Suspended</span>;
      case "settled": return <span className="badge-closed">Settled</span>;
      default: return <span className="badge-closed">{market.status}</span>;
    }
  };

  const statusMessage = () => {
    if (market.status === "suspended") return (
      <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm text-center">
        ⏸ Trading is temporarily suspended by the instructor.
      </div>
    );
    if (market.status === "settled") return (
      <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm text-center">
        ✓ This market has been settled. Winner: <strong>{market.settlementResult}</strong>
      </div>
    );
    return null;
  };

  return (
    <div className="container py-8 animate-slide-up">
      <Link to="/markets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 block">
        <ArrowLeft className="h-4 w-4" />Back to Markets
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {statusBadge()}
              <Badge variant="outline">{market.league}</Badge>
              <Badge variant="outline" className="text-xs">Liquidity: {market.liquidityParameter}</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{market.title}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4" />{market.startTime}
            </p>
          </div>

          {statusMessage()}

          {/* Market Analytics Bar */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="stat-card !p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Volume</span>
                </div>
                <p className="font-bold font-mono text-sm">${analytics.totalVolume.toFixed(0)}</p>
              </div>
              <div className="stat-card !p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Trades</span>
                </div>
                <p className="font-bold font-mono text-sm">{analytics.tradeCount}</p>
              </div>
              <div className="stat-card !p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Traders</span>
                </div>
                <p className="font-bold font-mono text-sm">{analytics.uniqueTraders}</p>
              </div>
              <div className="stat-card !p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Activity</span>
                </div>
                <p className="font-bold font-mono text-sm">{analytics.activityScore}/min</p>
              </div>
            </div>
          )}

          {/* Buy/Sell Pressure */}
          {analytics && analytics.tradeCount > 0 && (
            <PressureIndicator buyPressure={analytics.buyPressure} />
          )}

          {/* Outcomes with per-outcome analytics */}
          <div className="grid sm:grid-cols-2 gap-4">
            {market.outcomes.map((o) => {
              const holding = getHolding(market.id, o.id);
              const oAnalytics = analytics?.outcomeAnalytics.find((a) => a.outcomeId === o.id);
              return (
                <Card key={o.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{o.name}</h3>
                      <div className="text-right">
                        <span className="text-2xl font-bold font-mono">{(o.price * 100).toFixed(1)}¢</span>
                        {oAnalytics && oAnalytics.priceChange !== 0 && (
                          <div className={cn("text-xs font-mono flex items-center justify-end gap-0.5",
                            oAnalytics.priceChange > 0 ? "price-up" : "price-down"
                          )}>
                            {oAnalytics.priceChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {oAnalytics.priceChange > 0 ? "+" : ""}{(oAnalytics.priceChange * 100).toFixed(1)}¢
                            ({oAnalytics.priceChangePct > 0 ? "+" : ""}{oAnalytics.priceChangePct.toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Probability bar */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${o.price * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {(o.price * 100).toFixed(0)}% implied probability
                    </p>

                    {/* Outcome stats */}
                    {oAnalytics && oAnalytics.tradeCount > 0 && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-muted-foreground">Open</p>
                          <p className="font-mono font-medium">{(oAnalytics.openingPrice * 100).toFixed(0)}¢</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">H / L</p>
                          <p className="font-mono font-medium">{(oAnalytics.high * 100).toFixed(0)}¢ / {(oAnalytics.low * 100).toFixed(0)}¢</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Volatility</p>
                          <p className="font-mono font-medium">{(oAnalytics.volatility * 100).toFixed(1)}¢</p>
                        </div>
                      </div>
                    )}

                    {holding && (
                      <p className="text-sm text-muted-foreground">
                        You own <span className="font-mono font-medium text-foreground">{holding.shares}</span> shares
                        (avg {(holding.avgCostPerShare * 100).toFixed(1)}¢)
                      </p>
                    )}

                    {isOpen && (
                      <div className="flex gap-2">
                        <Button variant="success" className="flex-1" onClick={() => setTradeModal({ open: true, outcomeId: o.id, outcomeName: o.name, type: "BUY" })}>
                          Buy
                        </Button>
                        <Button variant="destructive" className="flex-1" disabled={!holding || holding.shares === 0} onClick={() => setTradeModal({ open: true, outcomeId: o.id, outcomeName: o.name, type: "SELL" })}>
                          Sell
                        </Button>
                      </div>
                    )}
                    {market.status === "settled" && market.resolvedOutcomeId === o.id && (
                      <div className="text-center py-1 rounded bg-success/10 text-success text-sm font-medium">✓ Winner</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Price History Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />Price History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PriceHistoryChart priceHistory={priceHistory} outcomes={market.outcomes} />
            </CardContent>
          </Card>

          {/* Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Trade Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <VolumeChart priceHistory={priceHistory} />
            </CardContent>
          </Card>

          {/* Recent Trades */}
          {marketTrades.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Trades</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {marketTrades.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                      <div className="space-y-0.5">
                        <div>
                          <span className={`font-semibold ${t.type === "BUY" ? "price-up" : "price-down"}`}>{t.type}</span>{" "}
                          <span className="font-mono">{t.quantity}</span> × {t.outcomeName}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="font-mono">${t.totalCost.toFixed(2)}</span>
                        <p className="text-xs text-muted-foreground">
                          {(t.priceBeforeTrade * 100).toFixed(1)}¢ → {(t.priceAfterTrade * 100).toFixed(1)}¢
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Details */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Market Details</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>{market.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div><span className="text-muted-foreground">Sport:</span> {market.sport}</div>
                <div><span className="text-muted-foreground">League:</span> {market.league}</div>
                <div><span className="text-muted-foreground">Liquidity:</span> {market.liquidityParameter}</div>
                <div><span className="text-muted-foreground">Outcomes:</span> {market.outcomes.length}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick market stats card */}
          {analytics && analytics.tradeCount > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Market Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {analytics.outcomeAnalytics.map((oa) => (
                  <div key={oa.outcomeId} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground truncate">{oa.outcomeName}</span>
                      <span className={cn("font-mono font-semibold", oa.priceChange > 0 ? "price-up" : oa.priceChange < 0 ? "price-down" : "")}>
                        {(oa.currentPrice * 100).toFixed(1)}¢
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Vol: ${oa.volume.toFixed(0)}</span>
                      <span>{oa.tradeCount} trades</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <EducationalSidebar
            price={firstOutcome?.price ?? 0.5}
            outcomeName={firstOutcome?.name ?? ""}
            liquidityParameter={market.liquidityParameter}
          />
        </div>
      </div>

      <TradeTicketModal
        open={tradeModal.open}
        onClose={() => setTradeModal((s) => ({ ...s, open: false }))}
        marketId={market.id}
        outcomeId={tradeModal.outcomeId}
        outcomeName={tradeModal.outcomeName}
        initialType={tradeModal.type}
      />
    </div>
  );
}
