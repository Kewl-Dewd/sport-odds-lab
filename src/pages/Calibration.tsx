import { Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalibrationChart } from "@/components/analysis/CalibrationChart";
import { useStudentBook } from "@/hooks/useStudentBook";
import { toAmerican } from "@/lib/oddsFormat";
import { money } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BetRow } from "@/features/db";

/** Locked price as a 0..1 probability, whichever way the row stored it. */
function lockedProb(b: BetRow): number | null {
  const o = Number(b.odds_decimal);
  if (!o) return null;
  return o < 1 ? o : 1 / o;
}

export default function Calibration() {
  const book = useStudentBook();
  const bets = [...book.openBets, ...book.settledBets].sort(
    (a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime(),
  );

  return (
    <div className="container max-w-5xl py-8 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="border-b border-border/50 pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
            Forecasting Engine
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Brier Scoring &amp; CLV
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
          <Target className="h-6 w-6 text-emerald-500" />
          <span>Forecast Calibration</span>
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
          Evaluate how well your subjective forecasts align with observed real-world outcomes. Scores predictive discipline independently of variance.
        </p>
      </div>

      {/* Calibration Chart Card */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight">Calibration Reliability Curve</CardTitle>
          <CardDescription className="text-xs">
            Comparison between your forecast confidence buckets and actual win rate frequency.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <CalibrationChart bets={bets} />
        </CardContent>
      </Card>

      {/* CLV History Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight">Forecast &amp; Closing Line Value (CLV)</CardTitle>
          <CardDescription className="text-xs">
            CLV benchmarks your entry price against the final no-vig closing consensus. Positive CLV indicates long-term market beating expectancy.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {bets.length === 0 ? (
            <p className="text-xs font-mono text-muted-foreground text-center py-8">No positions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 font-medium font-sans">Game</th>
                    <th className="py-2.5 font-medium font-sans">Pick</th>
                    <th className="py-2.5 font-medium text-right">Stake</th>
                    <th className="py-2.5 font-medium text-right">Locked</th>
                    <th className="py-2.5 font-medium text-right">Forecast</th>
                    <th className="py-2.5 font-medium text-right">No-Vig Entry</th>
                    <th className="py-2.5 font-medium text-right">Closing No-Vig</th>
                    <th className="py-2.5 font-medium text-right">CLV</th>
                    <th className="py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {bets.map((b) => {
                    const p = lockedProb(b);
                    const pct = (v: number | null | undefined) => (v == null ? "—" : `${(Number(v) * 100).toFixed(1)}%`);
                    const clv = b.clv_pct == null ? null : Number(b.clv_pct);
                    const isOpen = b.status === "executed" || b.status === "open";
                    return (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-sans font-medium text-foreground">{b.market_title}</td>
                        <td className="py-3 font-sans text-muted-foreground">{b.selection}</td>
                        <td className="py-3 text-right">{money(Number(b.stake))}</td>
                        <td className="py-3 text-right">{p ? toAmerican(p) : "—"}</td>
                        <td className="py-3 text-right text-foreground">{pct(b.forecast_prob)}</td>
                        <td className="py-3 text-right text-muted-foreground">{pct(b.no_vig_prob)}</td>
                        <td className="py-3 text-right text-muted-foreground">{pct(b.closing_no_vig_prob)}</td>
                        <td className={cn(
                          "py-3 text-right font-semibold",
                          clv == null ? "text-muted-foreground" : clv >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {clv == null ? (b.closing_captured_at ? "n/a" : "pending") : `${clv >= 0 ? "+" : ""}${clv.toFixed(1)}%`}
                        </td>
                        <td className="py-3 text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-mono",
                              isOpen
                                ? "border-amber-500/40 text-amber-500 bg-amber-500/10"
                                : b.status === "won"
                                  ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
                                  : "border-border text-muted-foreground"
                            )}
                          >
                            {isOpen ? "open" : b.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
