import { useMemo } from "react";
import { Brain, Newspaper, Anchor, Megaphone, Info, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/context/MarketContext";
import { BIAS_LABELS } from "@/lib/behavioralAnalytics";
import { cn } from "@/lib/utils";

/**
 * Renders any active behavioral-experiment framing for a market:
 * prompts, headlines, anchored prices, news blurbs, and summary text.
 * Visible to students; the bias being tested is NOT revealed unless
 * the instructor enabled studentNoticeEnabled (which only shows a
 * generic "experiment in progress" notice).
 */
export function BehavioralFraming({ marketId }: { marketId: string }) {
  const { getBiasExperimentsForMarket } = useMarket();

  const experiments = useMemo(
    () => getBiasExperimentsForMarket(marketId),
    [getBiasExperimentsForMarket, marketId],
  );

  if (experiments.length === 0) return null;

  return (
    <div className="space-y-2">
      {experiments.map((exp) => {
        const fr = exp.framing[marketId];
        if (!fr && !exp.studentNoticeEnabled) return null;
        return (
          <Card key={exp.id} className="border-info/30 bg-info/5">
            <CardContent className="p-4 space-y-3">
              {exp.studentNoticeEnabled && (
                <div className="flex items-center gap-1.5 text-xs text-info">
                  <Brain className="h-3.5 w-3.5" />
                  <span className="font-semibold">Experiment in progress</span>
                  <Badge variant="outline" className="text-[10px]">
                    {BIAS_LABELS[exp.bias]}
                  </Badge>
                </div>
              )}

              {fr?.prompt && (
                <div className="flex items-start gap-2 text-sm">
                  <Megaphone className="h-3.5 w-3.5 mt-0.5 shrink-0 text-info" />
                  <p>{fr.prompt}</p>
                </div>
              )}

              {fr?.headline && (
                <div className="flex items-start gap-2">
                  <Newspaper className="h-3.5 w-3.5 mt-0.5 shrink-0 text-info" />
                  <p className="text-base font-bold leading-tight">{fr.headline}</p>
                </div>
              )}

              {fr?.anchorPrice != null && (
                <div className="flex items-center gap-2 rounded-md bg-background border p-2">
                  <Anchor className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {fr.anchorLabel ?? "Reference price"}
                    </p>
                    <p className="text-2xl font-bold font-mono">
                      {(fr.anchorPrice * 100).toFixed(0)}¢
                    </p>
                  </div>
                </div>
              )}

              {fr?.newsBlurb && (
                <div className="rounded-md border-l-4 border-info bg-background p-2 text-sm italic">
                  "{fr.newsBlurb}"
                </div>
              )}

              {fr?.summaryStyle && fr.summaryStyle !== "none" && fr.summaryText && (
                <div className={cn(
                  "rounded-md border p-3 text-sm",
                  fr.summaryStyle === "expert" ? "bg-background" : "bg-muted/50 italic",
                )}>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
                    <Info className="h-3 w-3" />
                    <span>
                      {fr.summaryStyle === "expert" ? "Analyst summary" : "Crowd buzz"}
                    </span>
                  </div>
                  <p>{fr.summaryText}</p>
                </div>
              )}

              {fr?.showStreak && <StreakIndicator marketId={marketId} />}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StreakIndicator({ marketId }: { marketId: string }) {
  const { trades, getMarket } = useMarket();
  const market = getMarket(marketId);
  if (!market) return null;

  // Compute current streak per outcome from the trade ledger.
  const recent = trades
    .filter((t) => t.marketId === marketId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);

  if (recent.length < 3) return null;

  // Find the dominant direction in the last few trades for the most-active outcome.
  const byOutcome = new Map<string, { buys: number; sells: number; name: string }>();
  for (const t of recent) {
    if (!byOutcome.has(t.outcomeId)) {
      byOutcome.set(t.outcomeId, { buys: 0, sells: 0, name: t.outcomeName });
    }
    const e = byOutcome.get(t.outcomeId)!;
    if (t.type === "BUY") e.buys += 1;
    else e.sells += 1;
  }
  const top = [...byOutcome.entries()].sort(
    (a, b) => (b[1].buys + b[1].sells) - (a[1].buys + a[1].sells),
  )[0];
  if (!top) return null;
  const dom = top[1].buys > top[1].sells ? "BUY" : "SELL";
  const count = Math.max(top[1].buys, top[1].sells);

  return (
    <div className="flex items-center gap-2 rounded-md border p-2 text-xs">
      <History className="h-3.5 w-3.5 text-info" />
      <span>
        Recent streak: <strong>{count} {dom}s</strong> on "{top[1].name}" in the last {recent.length} trades.
      </span>
    </div>
  );
}
