import { Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalibrationChart } from "@/components/analysis/CalibrationChart";
import { useStudentBook } from "@/hooks/useStudentBook";
import { toAmerican } from "@/lib/oddsFormat";
import { money } from "@/lib/money";
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
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" /> My Calibration
        </h1>
        <p className="text-sm text-muted-foreground">
          How well do your forecasts match reality? This page scores your analysis, not your luck.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calibration chart</CardTitle>
          <CardDescription>Your forecast ranges against the actual win rate.</CardDescription>
        </CardHeader>
        <CardContent>
          <CalibrationChart bets={bets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Forecast &amp; closing line history</CardTitle>
          <CardDescription>
            CLV compares the price you locked with the fair (no-vig) closing price. Positive CLV means you beat
            the closing market.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No positions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Game</th>
                    <th className="pb-2 font-medium">Pick</th>
                    <th className="pb-2 font-medium text-right">Stake</th>
                    <th className="pb-2 font-medium text-right">Locked</th>
                    <th className="pb-2 font-medium text-right">Your forecast</th>
                    <th className="pb-2 font-medium text-right">No-vig at bet</th>
                    <th className="pb-2 font-medium text-right">Closing no-vig</th>
                    <th className="pb-2 font-medium text-right">CLV</th>
                    <th className="pb-2 font-medium text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {bets.map((b) => {
                    const p = lockedProb(b);
                    const pct = (v: number | null | undefined) => (v == null ? "—" : `${(Number(v) * 100).toFixed(1)}%`);
                    const clv = b.clv_pct == null ? null : Number(b.clv_pct);
                    return (
                      <tr key={b.id} className="border-b last:border-0">
                        <td className="py-2">{b.market_title}</td>
                        <td className="py-2">{b.selection}</td>
                        <td className="py-2 text-right font-mono">{money(Number(b.stake))}</td>
                        <td className="py-2 text-right font-mono">{p ? toAmerican(p) : "—"}</td>
                        <td className="py-2 text-right font-mono">{pct(b.forecast_prob)}</td>
                        <td className="py-2 text-right font-mono">{pct(b.no_vig_prob)}</td>
                        <td className="py-2 text-right font-mono">{pct(b.closing_no_vig_prob)}</td>
                        <td className={`py-2 text-right font-mono ${clv == null ? "" : clv >= 0 ? "text-success" : "text-destructive"}`}>
                          {clv == null ? (b.closing_captured_at ? "n/a" : "pending") : `${clv >= 0 ? "+" : ""}${clv.toFixed(1)}%`}
                        </td>
                        <td className="py-2 text-right capitalize">{b.status === "executed" ? "open" : b.status}</td>
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
