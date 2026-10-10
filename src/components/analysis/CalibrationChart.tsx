// Calibration chart: forecast probability buckets vs. actual win rate.
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brierScore, calibrationBuckets } from "@/lib/forecastMath";
import type { BetRow } from "@/features/db";

/** Settled bets with a forecast, as {forecast, won} rows. */
export function forecastRows(bets: BetRow[]) {
  return bets
    .filter((b) => b.forecast_prob != null && (b.status === "won" || b.status === "lost"))
    .map((b) => ({ forecast: Number(b.forecast_prob), won: b.status === "won" }));
}

export function CalibrationChart({ bets }: { bets: BetRow[] }) {
  const rows = forecastRows(bets);
  const buckets = calibrationBuckets(rows);
  const brier = brierScore(rows);
  const data = buckets.map((b) => ({ ...b, perfect: b.midpoint }));

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No graded forecasts yet. Once games with a forecast are settled, they will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <span><span className="text-muted-foreground">Graded forecasts:</span> <b>{rows.length}</b></span>
        <span><span className="text-muted-foreground">Brier score:</span> <b className="font-mono">{brier?.toFixed(3)}</b></span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={45} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              formatter={(v: number | null, name: string) =>
                v == null ? ["—", name] : [`${Number(v).toFixed(0)}%`, name]}
              labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.count ?? 0} picks`}
            />
            <Bar dataKey="winRate" name="Actual win rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Line dataKey="perfect" name="Perfect calibration" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Bars show how often picks in each forecast range actually won. A well-calibrated forecaster's bars sit on
        the dashed line: picks you call 60–70% should win about 65% of the time.
      </p>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-center text-[11px]">
        {buckets.map((b) => (
          <div key={b.label} className="rounded bg-muted/50 p-1">
            <div className="text-muted-foreground">{b.label}</div>
            <div className="font-mono">{b.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
