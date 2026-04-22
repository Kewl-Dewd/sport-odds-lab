import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Radio, RefreshCw, ExternalLink } from "lucide-react";
import { fetchOdds, extractMoneyline } from "@/lib/oddsApi";
import type { Market } from "@/lib/tradingEngine";
import { cn } from "@/lib/utils";

interface Props {
  market: Market;
}

interface Snapshot {
  outcome: string;
  decimal: number;
  implied: number;
}

/**
 * Reference odds overlay for markets imported from odds-api.io.
 * Shows the average bookmaker implied probability vs. the class price
 * so students can compare and discuss the gap.
 */
export function ReferenceOddsCard({ market }: Props) {
  const externalId = market.metadata.externalEventId;
  const isLive = market.metadata.dataSource === "odds-api" && externalId;

  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!externalId) return;
    setLoading(true);
    setError(null);
    try {
      const odds = await fetchOdds(externalId);
      const ml = extractMoneyline(odds);
      if (!ml) {
        setError("No moneyline odds available from bookmakers yet.");
        setSnapshot(null);
      } else {
        setSnapshot(ml);
        setUpdatedAt(new Date().toLocaleTimeString());
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load reference odds";
      setError(msg);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLive) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalId]);

  if (!isLive) return null;

  // Build matched comparisons: for each bookmaker outcome, find the closest
  // class outcome name (case-insensitive substring match) so we can show side-by-side.
  const comparisons = (snapshot ?? []).map((s) => {
    const match = market.outcomes.find(
      (o) =>
        o.name.toLowerCase().includes(s.outcome.toLowerCase()) ||
        s.outcome.toLowerCase().includes(o.name.toLowerCase()),
    );
    return {
      bookOutcome: s.outcome,
      bookImplied: s.implied,
      classOutcome: match?.name ?? null,
      classPrice: match?.price ?? null,
    };
  });

  return (
    <Card className="border-info/30 bg-info/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4 text-info" />
            Reference odds
            <Badge variant="outline" className="text-[10px] border-info/40 text-info">
              odds-api.io
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Average implied probability across bookmakers. Compare against the class price to spot disagreement.
          {updatedAt && <span className="ml-1">Updated {updatedAt}.</span>}
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-xs text-muted-foreground italic">{error}</p>}

        {snapshot && snapshot.length > 0 && (
          <div className="space-y-2">
            {comparisons.map((c) => {
              const gap = c.classPrice != null ? c.classPrice - c.bookImplied : null;
              return (
                <div key={c.bookOutcome} className="rounded border bg-background p-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{c.classOutcome ?? c.bookOutcome}</span>
                    {gap != null && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] tabular-nums",
                          Math.abs(gap) < 0.03
                            ? "border-muted text-muted-foreground"
                            : gap > 0
                              ? "border-success/40 text-success"
                              : "border-destructive/40 text-destructive",
                        )}
                      >
                        {gap > 0 ? "+" : ""}{(gap * 100).toFixed(1)}pp
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
                    <div>
                      <p className="text-muted-foreground">Class</p>
                      <p className="font-mono font-medium">
                        {c.classPrice != null ? `${(c.classPrice * 100).toFixed(1)}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bookmakers</p>
                      <p className="font-mono font-medium">{(c.bookImplied * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
              <ExternalLink className="h-2.5 w-2.5" />
              Vig removed via proportional normalization. For teaching only.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
