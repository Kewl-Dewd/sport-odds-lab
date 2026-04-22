import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Radio } from "lucide-react";
import { toast } from "sonner";
import { fetchOdds, type OddsApiOddsResponse } from "@/lib/oddsApi";
import { useMarket } from "@/context/MarketContext";
import type { Market } from "@/lib/tradingEngine";

interface Suggestion {
  market: Market;
  externalEventId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  suggestedOutcomeId: string | null;
  suggestedOutcomeName: string | null;
  rationale: string;
}

/**
 * Pulls the latest score for each live-linked, unsettled market and
 * suggests a settlement outcome. The instructor still has to confirm.
 */
export function SettlementSuggestions() {
  const { markets, settleMarket } = useMarket();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const candidates = useMemo(
    () =>
      markets.filter(
        (m) =>
          m.metadata.dataSource === "odds-api" &&
          m.metadata.externalEventId &&
          m.status !== "settled" &&
          m.status !== "void" &&
          m.status !== "cancelled",
      ),
    [markets],
  );

  const refresh = async () => {
    if (candidates.length === 0) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        candidates.map(async (m) => {
          try {
            const odds = await fetchOdds(m.metadata.externalEventId!);
            return buildSuggestion(m, odds);
          } catch (e) {
            console.warn("Settlement check failed for", m.id, e);
            return null;
          }
        }),
      );
      const finished = results.filter((s): s is Suggestion => s !== null && s.status === "finished");
      setSuggestions(finished);
      setLastChecked(new Date().toLocaleTimeString());
      if (finished.length === 0) {
        toast.info("No finished games found among live markets.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-load once on mount (cheap if no candidates).
  useEffect(() => {
    if (candidates.length > 0) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = (s: Suggestion) => {
    if (!s.suggestedOutcomeId || !s.suggestedOutcomeName) return;
    settleMarket(s.market.id, s.suggestedOutcomeId);
    toast.success(`Settled “${s.market.title}” → ${s.suggestedOutcomeName}`);
    setSuggestions((prev) => prev.filter((x) => x.market.id !== s.market.id));
  };

  if (candidates.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-info" />Settlement suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No live-linked markets yet. Use “Import live fixtures” to add some.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-info" />Settlement suggestions
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Checks {candidates.length} live market{candidates.length === 1 ? "" : "s"} for finished games and proposes a winner. You confirm.
          {lastChecked && <span className="ml-1">Last checked {lastChecked}.</span>}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground italic">No completed games detected.</p>
        )}
        {suggestions.map((s) => (
          <div key={s.market.id} className="rounded border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{s.market.title}</p>
                <p className="text-xs text-muted-foreground">{s.rationale}</p>
              </div>
              {s.suggestedOutcomeId ? (
                <Badge variant="outline" className="border-success/40 text-success text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Match
                </Badge>
              ) : (
                <Badge variant="outline" className="border-warning/40 text-warning text-[10px]">
                  <AlertCircle className="h-3 w-3 mr-1" />Manual
                </Badge>
              )}
            </div>
            {s.homeScore != null && s.awayScore != null && (
              <p className="text-xs font-mono">
                Final: {s.homeScore} – {s.awayScore}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(s)}
                disabled={!s.suggestedOutcomeId}
              >
                Confirm: {s.suggestedOutcomeName ?? "—"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSuggestions((prev) => prev.filter((x) => x.market.id !== s.market.id))}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function buildSuggestion(market: Market, odds: OddsApiOddsResponse): Suggestion {
  const home = odds.scores?.home ?? null;
  const away = odds.scores?.away ?? null;
  const status = (odds.status ?? "").toLowerCase();

  let suggestedOutcomeId: string | null = null;
  let suggestedOutcomeName: string | null = null;
  let rationale = `Status: ${odds.status}`;

  if (status === "finished" && home != null && away != null) {
    let target: string | null = null;
    if (home > away) target = odds.home;
    else if (away > home) target = odds.away;
    else target = "Draw";

    if (target) {
      const match = market.outcomes.find(
        (o) =>
          o.name.toLowerCase() === target!.toLowerCase() ||
          o.name.toLowerCase().includes(target!.toLowerCase()) ||
          target!.toLowerCase().includes(o.name.toLowerCase()),
      );
      if (match) {
        suggestedOutcomeId = match.id;
        suggestedOutcomeName = match.name;
        rationale = `${odds.home} ${home} – ${away} ${odds.away}. Suggested winner: ${target}.`;
      } else {
        rationale = `Final score ${home}–${away}. Couldn’t auto-match “${target}” to a market outcome.`;
      }
    }
  }

  return {
    market,
    externalEventId: market.metadata.externalEventId!,
    homeScore: home,
    awayScore: away,
    status,
    suggestedOutcomeId,
    suggestedOutcomeName,
    rationale,
  };
}
