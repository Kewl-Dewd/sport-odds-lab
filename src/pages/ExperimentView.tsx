import { Link, useParams } from "react-router-dom";
import {
  FlaskConical, ArrowLeft, BarChart3, Users, Clock, Target,
  Eye, EyeOff, ShieldAlert, CheckCircle2, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/context/MarketContext";
import { calculateMarketAnalytics } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";

export default function ExperimentView() {
  const { id } = useParams<{ id: string }>();
  const { experiments, markets, trades, students, classroom } = useMarket();
  const experiment = experiments.find((e) => e.id === id);

  if (!experiment) {
    return (
      <div className="container py-12 text-center">
        <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Experiment not found</h2>
        <Button variant="outline" asChild><Link to="/experiments">← Back to Experiments</Link></Button>
      </div>
    );
  }

  const linkedMarkets = markets.filter((m) => experiment.linkedMarketIds.includes(m.id));
  const expTrades = trades.filter((t) => experiment.linkedMarketIds.includes(t.marketId));
  const totalVolume = expTrades.reduce((s, t) => s + (t.totalCost ?? 0), 0);
  const activeRules = experiment.rules.filter((r) => r.enabled);

  // Average return across students
  const startingBalance = classroom.startingBalance;
  const avgReturn = students.length > 0
    ? students.reduce((s, st) => {
        const holdingsValue = st.holdings
          .filter((h) => experiment.linkedMarketIds.includes(h.marketId))
          .reduce((hv, h) => {
            const market = markets.find((m) => m.id === h.marketId);
            const outcome = market?.outcomes.find((o) => o.id === h.outcomeId);
            return hv + h.shares * (outcome?.price ?? 0);
          }, 0);
        return s + ((st.cash + holdingsValue - startingBalance) / startingBalance) * 100;
      }, 0) / students.length
    : 0;

  const statusStyle: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-success/15 text-success",
    paused: "bg-warning/15 text-warning",
    ended: "bg-accent/15 text-accent",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/experiments"><ArrowLeft className="mr-1 h-4 w-4" />Experiments</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{experiment.title}</h1>
            <Badge className={cn("text-xs", statusStyle[experiment.status])}>{experiment.status}</Badge>
          </div>
          <p className="text-muted-foreground">{experiment.objective}</p>
        </div>
      </div>

      {/* Student instructions banner */}
      {experiment.status === "active" && experiment.studentInstructions && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Experiment Instructions</h3>
                <p className="text-sm whitespace-pre-wrap">{experiment.studentInstructions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Markets</p>
          <p className="text-2xl font-bold">{linkedMarkets.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Trades</p>
          <p className="text-2xl font-bold">{expTrades.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Volume</p>
          <p className="text-2xl font-bold">${totalVolume.toFixed(0)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Students</p>
          <p className="text-2xl font-bold">{students.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Avg Return</p>
          <p className={cn("text-2xl font-bold font-mono", avgReturn >= 0 ? "price-up" : "price-down")}>
            {avgReturn >= 0 ? "+" : ""}{avgReturn.toFixed(1)}%
          </p>
        </CardContent></Card>
      </div>

      {/* Active rules */}
      {activeRules.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" />Active Rules</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeRules.map((r) => (
                <Badge key={r.id} variant="outline" className="gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-primary" />{r.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked markets */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><BarChart3 className="h-4 w-4" />Experiment Markets</CardTitle></CardHeader>
        <CardContent>
          {linkedMarkets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No markets linked to this experiment.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {linkedMarkets.map((m) => {
                const analytics = calculateMarketAnalytics(m, trades);
                const priceSum = m.outcomes.reduce((s: number, o: any) => s + o.price, 0);
                return (
                  <Link key={m.id} to={`/markets/${m.id}`} className="block">
                    <div className="rounded-xl border p-4 hover:shadow-md transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{m.title}</h4>
                        <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                      </div>
                      <div className="space-y-1.5">
                        {m.outcomes.map((o: any) => {
                          const pct = (o.price / Math.max(priceSum, 0.01)) * 100;
                          return (
                            <div key={o.id} className="flex items-center justify-between text-xs">
                              <span>{o.name}</span>
                              <span className="font-mono font-semibold">{pct.toFixed(0)}%</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">{analytics.tradeCount} trades · ${analytics.totalVolume.toFixed(0)} vol</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring info */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Target className="h-4 w-4" />Scoring</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <p>Mode: <span className="font-semibold capitalize">{experiment.scoringMode.replace("-", " ")}</span></p>
          <p className="mt-1">Leaderboard: <span className="font-semibold">{experiment.leaderboardVisible ? "Visible" : "Hidden"}</span></p>
          <p className="mt-1">Names: <span className="font-semibold capitalize">{experiment.nameVisibility}</span></p>
        </CardContent>
      </Card>
    </div>
  );
}
