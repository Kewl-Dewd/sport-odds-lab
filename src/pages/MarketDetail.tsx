import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Clock, BarChart3, TrendingUp, TrendingDown,
  Activity, Users as UsersIcon, Gauge, ArrowUpDown, Settings2,
  Droplets, Zap, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/context/MarketContext";
import { useEducation } from "@/context/EducationContext";
import { NUDGE_CONTENT } from "@/components/education/LearningNudges";
import { ConceptTooltip, CONCEPTS } from "@/components/ui/concept-tooltip";
import { TradeTicketModal } from "@/components/trading/TradeTicketModal";
import { EducationalSidebar } from "@/components/education/EducationalPanels";
import { PriceHistoryChart, VolumeChart, PressureIndicator } from "@/components/charts/AnalyticsCharts";
import { ReferenceOddsCard } from "@/components/markets/ReferenceOddsCard";
import { LiveSourceBadge } from "@/components/markets/LiveSourceBadge";
import { MarketDebrief } from "@/components/student/MarketDebrief";
import { buildPriceHistory, calculateMarketAnalytics } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";

type OutcomeSort = "price-desc" | "price-asc" | "name" | "change";

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const { getMarket, getHolding, trades } = useMarket();
  const { educationEnabled, mode, pushNudge } = useEducation();
  const market = getMarket(id ?? "");

  const [tradeModal, setTradeModal] = useState<{
    open: boolean;
    outcomeId: string;
    outcomeName: string;
    type: "BUY" | "SELL";
  }>({ open: false, outcomeId: "", outcomeName: "", type: "BUY" });

  const [outcomeSort, setOutcomeSort] = useState<OutcomeSort>("price-desc");

  const priceHistory = useMemo(
    () => (market ? buildPriceHistory(market, trades) : []),
    [market, trades]
  );

  const analytics = useMemo(
    () => (market ? calculateMarketAnalytics(market, trades) : null),
    [market, trades]
  );

  const sortedOutcomes = useMemo(() => {
    if (!market) return [];
    const items = [...market.outcomes];
    switch (outcomeSort) {
      case "price-desc": return items.sort((a, b) => b.price - a.price);
      case "price-asc": return items.sort((a, b) => a.price - b.price);
      case "name": return items.sort((a, b) => a.name.localeCompare(b.name));
      case "change": {
        return items.sort((a, b) => {
          const aChange = analytics?.outcomeAnalytics.find((oa) => oa.outcomeId === a.id)?.priceChange ?? 0;
          const bChange = analytics?.outcomeAnalytics.find((oa) => oa.outcomeId === b.id)?.priceChange ?? 0;
          return Math.abs(bChange) - Math.abs(aChange);
        });
      }
      default: return items;
    }
  }, [market, outcomeSort, analytics]);

  if (!market) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Market not found.</p>
        <Link to="/markets" className="text-primary underline text-sm mt-2 inline-block">Back to Markets</Link>
      </div>
    );
  }

  const marketTrades = trades.filter((t) => t.marketId === market.id).slice(0, 15);
  const isOpen = market.status === "open";
  const firstOutcome = market.outcomes[0];
  const isMulti = market.outcomes.length > 2;
  const priceSum = market.outcomes.reduce((s, o) => s + o.price, 0);

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
    if (market.status === "settled") {
      // Push settlement nudge
      if (educationEnabled) pushNudge(NUDGE_CONTENT.settlement);
      return (
        <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm text-center">
          ✓ This market has been settled. Winner: <strong>{market.settlementResult}</strong>
        </div>
      );
    }
    return null;
  };

  const engineLabel = market.config.engineType === "lmsr" ? "LMSR" : "Linear Impact";

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
              <Badge variant="outline" className="text-xs">{market.sport}</Badge>
              {isMulti && <Badge variant="secondary" className="text-xs">{market.outcomes.length} outcomes</Badge>}
              <Badge variant="outline" className="text-xs">
                <Settings2 className="h-3 w-3 mr-1" />{engineLabel}
              </Badge>
              <LiveSourceBadge source={market.metadata.dataSource} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{market.title}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4" />{market.startTime}
            </p>
          </div>

          {statusMessage()}

          {/* Market Info Bar — liquidity, engine, fees */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 rounded-md border px-2 py-1">
              <Droplets className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Liquidity:</span>
              <span className="font-mono font-medium">{market.config.liquidityParameter}</span>
            </div>
            {market.config.transactionFeePct > 0 && (
              <div className="flex items-center gap-1 rounded-md border px-2 py-1">
                <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Fee:</span>
                <span className="font-mono font-medium">{(market.config.transactionFeePct * 100).toFixed(1)}%</span>
              </div>
            )}
            {market.config.spread > 0 && (
              <div className="flex items-center gap-1 rounded-md border px-2 py-1">
                <span className="text-muted-foreground">Spread:</span>
                <span className="font-mono font-medium">{(market.config.spread * 100).toFixed(1)}¢</span>
              </div>
            )}
            {analytics && analytics.tradeCount >= 2 && (() => {
              const avgVol = analytics.outcomeAnalytics.reduce((s, o) => s + o.volatility, 0) / analytics.outcomeAnalytics.length;
              const volLabel = avgVol < 0.02 ? "Low" : avgVol < 0.06 ? "Medium" : "High";
              const volColor = avgVol < 0.02 ? "text-success" : avgVol < 0.06 ? "text-warning" : "text-destructive";
              return (
                <div className="flex items-center gap-1 rounded-md border px-2 py-1">
                  <Zap className={cn("h-3 w-3", volColor)} />
                  <span className="text-muted-foreground">Volatility:</span>
                  <span className={cn("font-medium", volColor)}>{volLabel}</span>
                </div>
              );
            })()}
          </div>

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

          {analytics && analytics.tradeCount > 0 && (
            <PressureIndicator buyPressure={analytics.buyPressure} />
          )}

          {/* Normalized Probability Summary (for multi-outcome) */}
          {isMulti && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Implied Probability Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {sortedOutcomes.map((o, i) => {
                    const pct = (o.price / Math.max(priceSum, 0.01)) * 100;
                    const colors = [
                      "bg-primary", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5",
                      "bg-primary/70", "bg-chart-2/70", "bg-chart-3/70", "bg-chart-4/70", "bg-chart-5/70",
                    ];
                    return (
                      <div
                        key={o.id}
                        className={cn("h-full transition-all duration-500", colors[i % colors.length])}
                        style={{ width: `${pct}%` }}
                        title={`${o.name}: ${pct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {sortedOutcomes.map((o, i) => {
                    const pct = (o.price / Math.max(priceSum, 0.01)) * 100;
                    const dots = [
                      "bg-primary", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5",
                      "bg-primary/70", "bg-chart-2/70", "bg-chart-3/70", "bg-chart-4/70", "bg-chart-5/70",
                    ];
                    return (
                      <span key={o.id} className="text-xs flex items-center gap-1">
                        <span className={cn("h-2 w-2 rounded-full", dots[i % dots.length])} />
                        {o.name} <span className="font-mono">{pct.toFixed(0)}%</span>
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sort controls for outcomes */}
          {isMulti && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sort:</span>
              {([
                { key: "price-desc" as const, label: "Price ↓" },
                { key: "price-asc" as const, label: "Price ↑" },
                { key: "name" as const, label: "Name" },
                { key: "change" as const, label: "Change" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setOutcomeSort(key)}
                  className={cn(
                    "text-xs px-2 py-1 rounded border transition-colors",
                    outcomeSort === key ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Outcomes — table view for many, cards for ≤3 */}
          {market.outcomes.length <= 3 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {sortedOutcomes.map((o) => {
                const holding = getHolding(market.id, o.id);
                const oAnalytics = analytics?.outcomeAnalytics.find((a) => a.outcomeId === o.id);
                const normPct = (o.price / Math.max(priceSum, 0.01)) * 100;
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
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${normPct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">{normPct.toFixed(0)}% implied probability</p>

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
                            <p className="text-muted-foreground">Vol</p>
                            <p className="font-mono font-medium">{oAnalytics.tradeCount}</p>
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
                          <Button variant="success" className="flex-1" onClick={() => setTradeModal({ open: true, outcomeId: o.id, outcomeName: o.name, type: "BUY" })}>Buy</Button>
                          <Button variant="destructive" className="flex-1" disabled={!holding || holding.shares === 0} onClick={() => setTradeModal({ open: true, outcomeId: o.id, outcomeName: o.name, type: "SELL" })}>Sell</Button>
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
          ) : (
            /* Table view for 4+ outcomes */
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-3 font-medium">#</th>
                        <th className="p-3 font-medium">Outcome</th>
                        <th className="p-3 font-medium text-right">Price</th>
                        <th className="p-3 font-medium">Probability</th>
                        <th className="p-3 font-medium text-right">Change</th>
                        <th className="p-3 font-medium text-right">Held</th>
                        {isOpen && <th className="p-3 font-medium text-center">Trade</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOutcomes.map((o, i) => {
                        const holding = getHolding(market.id, o.id);
                        const oAnalytics = analytics?.outcomeAnalytics.find((a) => a.outcomeId === o.id);
                        const normPct = (o.price / Math.max(priceSum, 0.01)) * 100;
                        const isWinner = market.status === "settled" && market.resolvedOutcomeId === o.id;
                        return (
                          <tr key={o.id} className={cn("border-b last:border-0 transition-colors", isWinner && "bg-success/5")}>
                            <td className="p-3 text-muted-foreground">{i + 1}</td>
                            <td className="p-3 font-medium">
                              <div className="flex items-center gap-2">
                                {o.name}
                                {isWinner && <Badge variant="default" className="text-[10px] bg-success">Winner</Badge>}
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono font-bold">{(o.price * 100).toFixed(1)}¢</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${normPct}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">{normPct.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {oAnalytics && oAnalytics.priceChange !== 0 ? (
                                <span className={cn("font-mono text-xs", oAnalytics.priceChange > 0 ? "price-up" : "price-down")}>
                                  {oAnalytics.priceChange > 0 ? "+" : ""}{(oAnalytics.priceChange * 100).toFixed(1)}¢
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono text-xs">
                              {holding ? holding.shares : "—"}
                            </td>
                            {isOpen && (
                              <td className="p-3">
                                <div className="flex gap-1.5 justify-center">
                                  <Button variant="success" size="sm" className="h-7 text-xs px-3"
                                    onClick={() => setTradeModal({ open: true, outcomeId: o.id, outcomeName: o.name, type: "BUY" })}>
                                    Buy
                                  </Button>
                                  <Button variant="destructive" size="sm" className="h-7 text-xs px-3"
                                    disabled={!holding || holding.shares === 0}
                                    onClick={() => setTradeModal({ open: true, outcomeId: o.id, outcomeName: o.name, type: "SELL" })}>
                                    Sell
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

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

          <Card>
            <CardHeader><CardTitle className="text-sm">Trade Volume</CardTitle></CardHeader>
            <CardContent>
              <VolumeChart priceHistory={priceHistory} />
            </CardContent>
          </Card>

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
                        <p className="text-xs text-muted-foreground">{new Date(t.timestamp).toLocaleTimeString()}</p>
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
                <div><span className="text-muted-foreground">Engine:</span> {engineLabel}</div>
                <div><span className="text-muted-foreground">Liquidity:</span> {market.config.liquidityParameter}</div>
                <div><span className="text-muted-foreground">Outcomes:</span> {market.outcomes.length}</div>
                <div><span className="text-muted-foreground">Max Trade:</span> {market.config.maxTradeSize}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ReferenceOddsCard market={market} />

          {analytics && analytics.tradeCount > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Market Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {analytics.outcomeAnalytics
                  .sort((a, b) => b.currentPrice - a.currentPrice)
                  .slice(0, 6)
                  .map((oa) => (
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
                {analytics.outcomeAnalytics.length > 6 && (
                  <p className="text-xs text-muted-foreground">+{analytics.outcomeAnalytics.length - 6} more</p>
                )}
              </CardContent>
            </Card>
          )}

          {educationEnabled && (
            <EducationalSidebar
              price={firstOutcome?.price ?? 0.5}
              outcomeName={firstOutcome?.name ?? ""}
              liquidityParameter={market.config.liquidityParameter}
            />
          )}
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
