import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/context/MarketContext";
import { TradeTicketModal } from "@/components/trading/TradeTicketModal";
import { EducationalSidebar } from "@/components/education/EducationalPanels";

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
            <div className="flex items-center gap-2 mb-2">
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

          {/* Outcomes */}
          <div className="grid sm:grid-cols-2 gap-4">
            {market.outcomes.map((o) => {
              const holding = getHolding(market.id, o.id);
              return (
                <Card key={o.id}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{o.name}</h3>
                      <span className="text-2xl font-bold font-mono">{(o.price * 100).toFixed(1)}¢</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${o.price * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {(o.price * 100).toFixed(0)}% implied probability
                    </p>
                    {holding && (
                      <p className="text-sm text-muted-foreground">
                        You own <span className="font-mono font-medium text-foreground">{holding.shares}</span> shares
                        (avg {(holding.avgCostPerShare * 100).toFixed(1)}¢)
                      </p>
                    )}
                    {isOpen && (
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          className="flex-1"
                          onClick={() => setTradeModal({ open: true, outcomeId: o.id, outcomeName: o.name, type: "BUY" })}
                        >
                          Buy
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          disabled={!holding || holding.shares === 0}
                          onClick={() => setTradeModal({ open: true, outcomeId: o.id, outcomeName: o.name, type: "SELL" })}
                        >
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

          {/* Price Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />Price History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                Price chart will be rendered here
              </div>
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
                      <div>
                        <span className={`font-semibold ${t.type === "BUY" ? "price-up" : "price-down"}`}>{t.type}</span>{" "}
                        <span className="font-mono">{t.quantity}</span> × {t.outcomeName}
                      </div>
                      <div className="text-right">
                        <span className="font-mono">${t.totalCost.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground ml-2">@ {(t.pricePerShare * 100).toFixed(1)}¢</span>
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
              <div className="flex gap-4 pt-2 text-xs">
                <span>Sport: {market.sport}</span>
                <span>League: {market.league}</span>
                <span>Liquidity: {market.liquidityParameter}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Educational Sidebar */}
        <div className="space-y-6">
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
