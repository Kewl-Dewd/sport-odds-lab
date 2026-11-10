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
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
            <span>Reference Odds</span>
            <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground bg-muted/30">
              odds-api.io
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-7 w-7 p-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Average implied probability across bookmakers vs. class price.
          {updatedAt && <span className="ml-1 font-mono text-[11px] text-muted-foreground/80">Synced {updatedAt}</span>}
        </p>
      </CardHeader>
      <CardContent className="pt-3">
        {error && <p className="text-xs text-muted-foreground italic font-mono">{error}</p>}

        {snapshot && snapshot.length > 0 && (
          <div className="space-y-2">
            {comparisons.map((c) => {
              const gap = c.classPrice != null ? c.classPrice - c.bookImplied : null;
              return (
                <div key={c.bookOutcome} className="rounded-lg border border-border/50 bg-background/50 p-3 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{c.classOutcome ?? c.bookOutcome}</span>
                    {gap != null && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono tabular-nums",
                          Math.abs(gap) < 0.03
                            ? "border-border text-muted-foreground"
                            : gap > 0
                              ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
                              : "border-rose-500/40 text-rose-500 bg-rose-500/10",
                        )}
                      >
                        {gap > 0 ? "+" : ""}{(gap * 100).toFixed(1)}pp
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/30 text-xs">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">Class</p>
                      <p className="font-mono font-semibold text-foreground">
                        {c.classPrice != null ? `${(c.classPrice * 100).toFixed(1)}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">Bookmakers</p>
                      <p className="font-mono font-semibold text-foreground">{(c.bookImplied * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 pt-1">
              <ExternalLink className="h-3 w-3" />
              Vig removed via proportional normalization. For simulation only.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
