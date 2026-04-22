import { useMemo, useState } from "react";
import { Brain, Users, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarket } from "@/context/MarketContext";
import {
  analyzeBehavior,
  compareGroups,
  BIAS_LABELS,
  BIAS_DESCRIPTIONS,
  type BiasKind,
} from "@/lib/behavioralAnalytics";

/**
 * Aggregated, anonymized debrief of behavioral patterns observed in
 * actual trading logs. Optional group comparison if the active
 * experiment has groups defined.
 */
export function BehavioralDebrief() {
  const {
    markets,
    trades,
    students,
    classroom,
    biasExperiments,
  } = useMarket();

  const classMarkets = useMemo(
    () => markets.filter((m) => m.classroomId === classroom.id),
    [markets, classroom.id],
  );
  const classTrades = useMemo(
    () => trades.filter((t) => classMarkets.some((m) => m.id === t.marketId)),
    [trades, classMarkets],
  );
  const displayNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of students) map[s.userId] = s.displayName;
    return map;
  }, [students]);

  const summary = useMemo(
    () => analyzeBehavior({ markets: classMarkets, trades: classTrades, displayNames }),
    [classMarkets, classTrades, displayNames],
  );

  const classExperiments = biasExperiments.filter((e) => e.classroomId === classroom.id);
  const experimentsWithGroups = classExperiments.filter(
    (e) => e.groups && Object.keys(e.groups).length >= 2,
  );

  const [groupExpId, setGroupExpId] = useState<string>(
    experimentsWithGroups[0]?.id ?? "",
  );
  const groupExp = experimentsWithGroups.find((e) => e.id === groupExpId);
  const comparison = useMemo(() => {
    if (!groupExp || !groupExp.groups) return null;
    return compareGroups({
      markets: classMarkets,
      trades: classTrades,
      displayNames,
      groups: groupExp.groups,
    });
  }, [groupExp, classMarkets, classTrades, displayNames]);

  if (summary.totalTrades === 0) {
    return (
      <Card>
        <CardContent className="text-xs text-muted-foreground text-center py-8">
          No trades yet. Once students start trading, behavioral patterns will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-info" />
          Behavioral patterns observed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Aggregated, anonymized signals from {summary.totalTrades} trades across
          {" "}{summary.affectedTraders} traders showing at least one pattern.
          All findings are derived from measured trade activity only.
        </p>

        {/* Bias counts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(Object.keys(summary.countsByBias) as BiasKind[])
            .filter((b) => summary.countsByBias[b] > 0)
            .sort((a, b) => summary.countsByBias[b] - summary.countsByBias[a])
            .map((b) => (
              <div key={b} className="rounded-md border p-2">
                <p className="text-[11px] text-muted-foreground">{BIAS_LABELS[b]}</p>
                <p className="text-lg font-bold font-mono">{summary.countsByBias[b]}</p>
              </div>
            ))}
        </div>

        {/* Optional group comparison */}
        {experimentsWithGroups.length > 0 && comparison && (
          <Tabs defaultValue="aggregate">
            <TabsList>
              <TabsTrigger value="aggregate">
                <Brain className="h-3.5 w-3.5 mr-1.5" />Aggregate findings
              </TabsTrigger>
              <TabsTrigger value="groups">
                <Users className="h-3.5 w-3.5 mr-1.5" />Group comparison
              </TabsTrigger>
            </TabsList>
            <TabsContent value="aggregate">
              <FindingsList summary={summary} />
            </TabsContent>
            <TabsContent value="groups">
              <div className="space-y-3">
                <select
                  className="text-xs border rounded-md p-1.5 bg-background"
                  value={groupExpId}
                  onChange={(e) => setGroupExpId(e.target.value)}
                >
                  {experimentsWithGroups.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
                <div className="grid sm:grid-cols-2 gap-3">
                  {comparison.groups.map((g) => (
                    <Card key={g.label}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs flex items-center justify-between">
                          <span>{g.label}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {g.userCount} traders · {g.summary.totalTrades} trades
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {(Object.keys(g.summary.countsByBias) as BiasKind[])
                          .filter((b) => g.summary.countsByBias[b] > 0)
                          .map((b) => (
                            <div key={b} className="flex justify-between text-xs">
                              <span>{BIAS_LABELS[b]}</span>
                              <span className="font-mono font-medium">{g.summary.countsByBias[b]}</span>
                            </div>
                          ))}
                        {g.summary.findings.length === 0 && (
                          <p className="text-[11px] text-muted-foreground">No patterns detected.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {experimentsWithGroups.length === 0 && <FindingsList summary={summary} />}

        <p className="text-[11px] text-muted-foreground border-t pt-2">
          Trader names are shown to instructors for review. These signals describe
          observed actions, not intent — use them as a starting point for discussion
          about decision-making in markets.
        </p>
      </CardContent>
    </Card>
  );
}

function FindingsList({ summary }: { summary: ReturnType<typeof analyzeBehavior> }) {
  if (summary.findings.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        No bias patterns detected in the current trade data.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {(Object.keys(summary.countsByBias) as BiasKind[])
        .filter((b) => summary.countsByBias[b] > 0)
        .map((b) => (
          <div key={b} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{BIAS_LABELS[b]}</Badge>
              <span className="text-[11px] text-muted-foreground">{BIAS_DESCRIPTIONS[b]}</span>
            </div>
            <div className="space-y-1">
              {summary.findings
                .filter((f) => f.bias === b)
                .slice(0, 5)
                .map((f) => (
                  <div key={f.id} className="rounded-md border p-2 text-xs">
                    <p className="font-medium">{f.displayName}</p>
                    <p className="text-muted-foreground">{f.detail}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}
