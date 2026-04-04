import { useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PricePoint, PortfolioSnapshot, PositionAnalysis } from "@/lib/marketAnalytics";
import type { Outcome } from "@/lib/tradingEngine";

const CHART_COLORS = [
  "hsl(153, 60%, 38%)",  // primary green
  "hsl(217, 70%, 50%)",  // accent blue
  "hsl(38, 92%, 50%)",   // warning orange
  "hsl(0, 72%, 51%)",    // destructive red
  "hsl(270, 60%, 50%)",  // purple
];

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Price History Chart ────────────────────────────────────────────

export function PriceHistoryChart({
  priceHistory,
  outcomes,
}: {
  priceHistory: PricePoint[];
  outcomes: Outcome[];
}) {
  const data = useMemo(() =>
    priceHistory.map((p) => {
      const point: Record<string, any> = { time: formatTime(p.timestamp) };
      for (const o of outcomes) {
        point[o.name] = Math.round((p.prices[o.id] ?? 0) * 1000) / 10;
      }
      return point;
    }),
    [priceHistory, outcomes]
  );

  if (data.length === 0) {
    return (
      <div className="h-56 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
        Price chart updates after trades are placed
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}¢`}
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value.toFixed(1)}¢`, ""]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {outcomes.map((o, i) => (
          <Line
            key={o.id}
            type="monotone"
            dataKey={o.name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Volume Chart ───────────────────────────────────────────────────

export function VolumeChart({ priceHistory }: { priceHistory: PricePoint[] }) {
  const data = useMemo(() =>
    priceHistory
      .filter((p) => p.volume > 0)
      .map((p) => ({
        time: formatTime(p.timestamp),
        volume: Math.round(p.volume * 100) / 100,
      })),
    [priceHistory]
  );

  if (data.length === 0) {
    return (
      <div className="h-32 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
        Volume chart updates after trades
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={128}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: number) => [`$${value.toFixed(2)}`, "Volume"]}
        />
        <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Portfolio Performance Chart ────────────────────────────────────

export function PortfolioPerformanceChart({ snapshots, startingCash }: { snapshots: PortfolioSnapshot[]; startingCash: number }) {
  const data = useMemo(() => {
    if (snapshots.length === 0) return [];
    return snapshots.map((s) => ({
      time: formatTime(s.timestamp),
      total: s.totalValue,
      cash: s.cash,
      holdings: s.holdingsValue,
    }));
  }, [snapshots]);

  if (data.length === 0) {
    return (
      <div className="h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
        Portfolio chart updates as you trade
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis
          domain={["auto", "auto"]}
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
          tick={{ fontSize: 11 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="total" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.1} strokeWidth={2} name="Total Value" />
        <Area type="monotone" dataKey="cash" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="4 4" name="Cash" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Holdings Distribution Pie ──────────────────────────────────────

export function HoldingsDistribution({ positions, cash }: { positions: PositionAnalysis[]; cash: number }) {
  const data = useMemo(() => {
    const items = positions.map((p) => ({
      name: `${p.outcomeName}`,
      value: Math.max(p.currentValue, 0),
    }));
    items.push({ name: "Cash", value: cash });
    return items.filter((d) => d.value > 0);
  }, [positions, cash]);

  if (data.length <= 1) {
    return (
      <div className="h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
        Distribution shows after you open positions
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Buy/Sell Pressure Bar ──────────────────────────────────────────

export function PressureIndicator({ buyPressure }: { buyPressure: number }) {
  const buyPct = Math.round(buyPressure * 100);
  const sellPct = 100 - buyPct;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="price-up font-medium">Buy {buyPct}%</span>
        <span className="price-down font-medium">Sell {sellPct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
        <div className="h-full bg-success transition-all duration-500" style={{ width: `${buyPct}%` }} />
        <div className="h-full bg-destructive transition-all duration-500" style={{ width: `${sellPct}%` }} />
      </div>
    </div>
  );
}
