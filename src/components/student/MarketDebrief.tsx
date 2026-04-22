import { useMemo } from "react";
import {
  Flag,
  TrendingUp,
  TrendingDown,
  Users2,
  Zap,
  ShieldAlert,
  Info,
  Megaphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useMarket,
  SCENARIO_LABELS,
} from "@/context/MarketContext";
import {
  summarizeClassIntegrity,
  FLAG_LABELS,
  type IntegrityFlagKind,
} from "@/lib/integrityAnalytics";

const FLAG_ICONS: Record<IntegrityFlagKind, typeof Zap> = {
  "volume-spike": TrendingUp,
  "rapid-price-move": Zap,
  "trader-concentration": Users2,
  "coordinated-direction": Users2,
  "sharp-reversal": TrendingDown,
  "volatility-spike": Zap,
  "whale-trade": ShieldAlert,
};

/**
 * Factual post-experiment debrief for students. Surfaces what actually
 * happened in the market — flagged moments, concentration, and any
 * scenario events the instructor logged. No moralizing language.
 */
export function MarketDebrief({ marketId }: { marketId?: string }) {
  const {
    markets,
    trades,
    classroom,
    ethicsSettings,
    scenarioEvents,
  } = useMarket();

  const targetMarkets = useMemo(() => {
    const all = markets.filter((m) => m.classroomId === classroom.id);
    return marketId ? all.filter((m) => m.id === marketId) : all;
  }, [markets, classroom.id, marketId]);

  const integrity = useMemo(
    () => summarizeClassIntegrity(targetMarkets, trades),
    [targetMarkets, trades],
  );

  const relevantScenarios = scenarioEvents.filter(
    (e) =>
      e.classroomId === classroom.id &&
      (!marketId || e.marketId === marketId || e.marketId === null),
  );

  if (!ethicsSettings.studentDebriefEnabled) {
    return null;
  }

  if (integrity.totalFlags === 0 && relevantScenarios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-info" />
            Experiment debrief
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No unusual market activity was detected and no scenario events were
            logged for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Flag className="h-4 w-4 text-warning" />
          Experiment debrief
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Below is a factual summary of what was measured in the market during
          this experiment. Use it to discuss how prices moved, who moved them,
          and how few trades can shift a low-liquidity market.
        </p>

        {/* Counts by category */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(integrity.flagsByKind) as IntegrityFlagKind[])
            .filter((k) => integrity.flagsByKind[k] > 0)
            .map((k) => (
              <div key={k} className="rounded-md border p-2">
                <p className="text-[11px] text-muted-foreground">{FLAG_LABELS[k]}</p>
                <p className="text-lg font-bold font-mono">{integrity.flagsByKind[k]}</p>
              </div>
            ))}
        </div>

        {/* Scenario events */}
        {relevantScenarios.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              Scenario events logged by your instructor
            </p>
            <div className="space-y-1.5">
              {relevantScenarios.map((e) => (
                <div key={e.id} className="rounded-md border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {SCENARIO_LABELS[e.kind]}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(e.injectedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{e.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-market summaries */}
        {integrity.reports
          .filter((r) => r.flags.length > 0 || r.topTraderShare >= 0.4)
          .map((r) => (
            <div key={r.marketId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs font-semibold">{r.marketTitle}</p>
                <div className="flex gap-1.5 text-[11px] text-muted-foreground">
                  <span>{r.totalTrades} trades</span>
                  <span>·</span>
                  <span>{r.uniqueTraders} traders</span>
                  <span>·</span>
                  <span>top trader: {(r.topTraderShare * 100).toFixed(0)}% of volume</span>
                </div>
              </div>
              {r.flags.length > 0 && (
                <div className="space-y-1.5">
                  {r.flags.slice(0, 6).map((f) => {
                    const Icon = FLAG_ICONS[f.kind];
                    return (
                      <div
                        key={f.id}
                        className="flex items-start gap-2 rounded-md border p-2 text-xs"
                      >
                        <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">
                              {FLAG_LABELS[f.kind]}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(f.at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-0.5">{f.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

        <p className="text-[11px] text-muted-foreground border-t pt-2">
          These signals are derived from measured trade data only. Unusual
          activity does not by itself imply intent — it is a starting point
          for discussion about market efficiency, concentration risk, and
          how information and behavior shape prices.
        </p>
      </CardContent>
    </Card>
  );
}
