import { useMemo } from "react";
import {
  ClipboardList, Flag, Newspaper, Megaphone,
  TrendingUp, Trophy, Activity, Users, Zap, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/context/MarketContext";
import { buildDebriefSummary, type DebriefEventKind } from "@/lib/debriefAnalytics";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<DebriefEventKind, typeof Zap> = {
  shock: Newspaper,
  scenario: Megaphone,
  "info-release": Info,
  "price-jump": TrendingUp,
  "market-settled": Trophy,
};

const KIND_LABEL: Record<DebriefEventKind, string> = {
  shock: "Shock",
  scenario: "Scenario",
  "info-release": "Info release",
  "price-jump": "Price jump",
  "market-settled": "Market settled",
};

/**
 * Comprehensive session/experiment debrief view. Aggregates timeline of key
 * events, key trades, market outcomes, and discussion talking points
 * derived from real session data.
 */
export function DebriefSummary({
  experimentId,
  marketIds,
}: {
  experimentId?: string;
  marketIds?: string[];
}) {
  const {
    markets, trades, classroom,
    shockEvents, scenarioEvents, infoPackets,
  } = useMarket();

  const summary = useMemo(() => {
    const filteredMarkets = markets.filter((m) =>
      m.classroomId === classroom.id &&
      (!marketIds || marketIds.includes(m.id)),
    );
    const filteredTrades = trades.filter((t) =>
      filteredMarkets.some((m) => m.id === t.marketId),
    );
    const filteredShocks = shockEvents.filter((s) =>
      s.classroomId === classroom.id &&
      (!marketIds || s.marketIds.length === 0 || s.marketIds.some((id) => marketIds.includes(id))),
    );
    const filteredScenarios = scenarioEvents.filter((e) => e.classroomId === classroom.id);
    const filteredPackets = infoPackets.filter((p) =>
      p.classroomId === classroom.id &&
      (!experimentId || p.experimentId === experimentId),
    );
    return buildDebriefSummary({
      markets: filteredMarkets,
      trades: filteredTrades,
      shocks: filteredShocks,
      scenarios: filteredScenarios,
      packets: filteredPackets,
    });
  }, [markets, trades, shockEvents, scenarioEvents, infoPackets, classroom.id, marketIds, experimentId]);

  return (
    <div className="space-y-4">
      {/* Headline metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-info" />
            Debrief summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Metric label="Markets" value={summary.marketCount} />
            <Metric label="Trades" value={summary.totalTrades} />
            <Metric label="Volume" value={`$${summary.totalVolume.toFixed(0)}`} />
            <Metric label="Active bettors" value={summary.activeTraders} />
          </div>
        </CardContent>
      </Card>

      {/* Per-market outcomes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Market-by-market outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.marketOutcomes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No markets in scope.</p>
          ) : (
            <div className="space-y-2">
              {summary.marketOutcomes.map((m) => (
                <div key={m.marketId} className="rounded-md border p-2.5 space-y-1">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium">{m.marketTitle}</p>
                    <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                    <span>{m.totalTrades} trades</span>
                    <span>${m.totalVolume.toFixed(0)} volume</span>
                    <span>{m.uniqueTraders} traders</span>
                    <span>{(m.priceRange * 100).toFixed(0)}¢ max move</span>
                  </div>
                  {m.settledOutcomeName ? (
                    <p className="text-xs">
                      <span className="text-muted-foreground">Winner:</span>{" "}
                      <strong>{m.settledOutcomeName}</strong>
                    </p>
                  ) : m.topOutcomeName ? (
                    <p className="text-xs">
                      <span className="text-muted-foreground">Leading:</span>{" "}
                      <strong>{m.topOutcomeName}</strong>{" "}
                      <span className="font-mono text-muted-foreground">
                        ({((m.topOutcomePrice ?? 0) * 100).toFixed(0)}¢)
                      </span>
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline of key events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Event timeline
            <Badge variant="outline" className="text-[10px] ml-auto">{summary.events.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.events.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No key events recorded.
            </p>
          ) : (
            <div className="space-y-1.5 relative pl-4">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" aria-hidden />
              {summary.events.map((e) => {
                const Icon = KIND_ICON[e.kind];
                return (
                  <div key={e.id} className="relative">
                    <div className={cn(
                      "absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 bg-background",
                      e.kind === "shock" && "border-warning",
                      e.kind === "price-jump" && "border-info",
                      e.kind === "market-settled" && "border-success",
                      e.kind === "info-release" && "border-info",
                      e.kind === "scenario" && "border-warning",
                    )} />
                    <div className="rounded-md border p-2 text-xs ml-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                        <Badge variant="outline" className="text-[9px]">{KIND_LABEL[e.kind]}</Badge>
                        {e.marketTitle && (
                          <span className="text-[10px] text-muted-foreground truncate">{e.marketTitle}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(e.at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-medium mt-0.5">{e.title}</p>
                      {e.detail && <p className="text-muted-foreground">{e.detail}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key trades */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Most important trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.keyTrades.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No notable bets.</p>
          ) : (
            <div className="space-y-1.5">
              {summary.keyTrades.map((k) => (
                <div key={k.trade.id} className="rounded-md border p-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px]">
                      {k.reason === "largest-cost" ? "Largest size" :
                       k.reason === "largest-impact" ? "Largest price impact" :
                       "First after shock"}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">{k.trade.type}</Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(k.trade.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="font-medium mt-0.5 truncate">
                    {k.trade.marketTitle} · {k.trade.outcomeName}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>{k.trade.quantity.toFixed(0)} shares</span>
                    <span>${k.trade.totalCost.toFixed(2)}</span>
                    <span>
                      {k.trade.priceBeforeTrade.toFixed(2)} → {k.trade.priceAfterTrade.toFixed(2)}
                      {k.priceImpact > 0 && ` (${(k.priceImpact * 100).toFixed(1)}¢)`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discussion points */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Discussion points
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.discussionPoints.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No automatic talking points were generated. Use the timeline and key trades above to lead discussion.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs list-disc pl-4">
              {summary.discussionPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold font-mono">{value}</p>
    </div>
  );
}
