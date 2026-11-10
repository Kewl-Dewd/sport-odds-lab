import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Trash2, ArrowRightLeft, Percent, Layers } from "lucide-react";
import {
  americanToDecimal,
  decimalToAmerican,
  decimalToFractional,
  fractionalToDecimal,
  noVigTwoWay,
  parlayEdge,
} from "@/lib/oddsTools";

const pct = (x: number, d = 1) => (isFinite(x) ? `${(x * 100).toFixed(d)}%` : "—");
const am = (x: number) => (isFinite(x) ? (x > 0 ? `+${Math.round(x)}` : `${Math.round(x)}`) : "—");

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 hover:border-emerald-500/30 transition-colors">
      <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-base md:text-lg font-bold font-mono tabular-nums mt-1 ${highlight ? "text-emerald-500" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function OddsConverter() {
  const [dec, setDec] = useState(2.5);
  const [fields, setFields] = useState({ american: "+150", decimal: "2.50", fractional: "3/2", implied: "40" });
  const update = (d: number, src: keyof typeof fields, raw: string) => {
    setDec(d);
    setFields({
      american: src === "american" ? raw : am(decimalToAmerican(d)),
      decimal: src === "decimal" ? raw : isFinite(d) ? d.toFixed(2) : "",
      fractional: src === "fractional" ? raw : decimalToFractional(d),
      implied: src === "implied" ? raw : isFinite(d) ? (100 / d).toFixed(1) : "",
    });
  };
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card">
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-emerald-500" />
          <span>Real-Time Odds Converter</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Interactive multi-format price parser. Update any notation to synchronize formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">American</Label>
          <Input className="font-mono" value={fields.american} onChange={(e) => update(americanToDecimal(Number(e.target.value.replace("+", ""))), "american", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Decimal</Label>
          <Input className="font-mono" inputMode="decimal" value={fields.decimal} onChange={(e) => update(Number(e.target.value), "decimal", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Fractional</Label>
          <Input className="font-mono" value={fields.fractional} onChange={(e) => {
            const [n, d] = e.target.value.split("/").map(Number);
            update(fractionalToDecimal(n, d), "fractional", e.target.value);
          }} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Implied Probability</Label>
          <Input className="font-mono" inputMode="decimal" value={fields.implied} onChange={(e) => {
            const p = Number(e.target.value) / 100;
            update(p > 0 && p < 1 ? 1 / p : NaN, "implied", e.target.value);
          }} />
        </div>
        {!isFinite(dec) && <p className="col-span-full text-xs font-mono text-rose-500">Invalid odds specification provided.</p>}
      </CardContent>
    </Card>
  );
}

function NoVigCalc() {
  const [a, setA] = useState("-110");
  const [b, setB] = useState("-110");
  const r = noVigTwoWay(americanToDecimal(Number(a)), americanToDecimal(Number(b)));
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card">
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <Percent className="h-4 w-4 text-emerald-500" />
          <span>No-Vig Fair Value Calculator (Two-Way)</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Input bookmaker lines on both outcomes to strip the built-in overround margin and isolate true probabilities.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Side A (American)</Label>
            <Input className="font-mono" value={a} onChange={(e) => setA(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Side B (American)</Label>
            <Input className="font-mono" value={b} onChange={(e) => setB(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="A Implied" value={pct(r.impliedA)} />
          <Stat label="B Implied" value={pct(r.impliedB)} />
          <Stat label="A Fair" value={`${pct(r.fairA)} (${am(decimalToAmerican(1 / r.fairA))})`} highlight />
          <Stat label="B Fair" value={`${pct(r.fairB)} (${am(decimalToAmerican(1 / r.fairB))})`} highlight />
          <Stat label="Overround Vig" value={pct(r.overround, 2)} />
        </div>
        <p className="text-xs font-mono text-muted-foreground">
          Combined implied probability sums to &gt; 100%. The differential represents the dealer&apos;s synthetic commission.
        </p>
      </CardContent>
    </Card>
  );
}

function ParlayCalc() {
  const [legs, setLegs] = useState([{ odds: "-110", margin: "4.76" }, { odds: "-110", margin: "4.76" }]);
  const parsed = legs.map((l) => ({ decimal: americanToDecimal(Number(l.odds)), overround: Number(l.margin) / 100 }));
  const r = parlayEdge(parsed);
  const set = (i: number, k: "odds" | "margin", v: string) => setLegs(legs.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card">
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-500" />
          <span>Parlay House Edge Compounder</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Analyze how compounding multi-leg parlays geometrically escalates the bookmaker&apos;s mathematical advantage.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2.5">
          {legs.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2.5 p-2 rounded-lg border border-border/40 bg-background/50">
              <div className="space-y-1">
                <Label className="text-[11px] font-mono text-muted-foreground">Leg {i + 1} Odds</Label>
                <Input className="font-mono h-8 text-xs" value={l.odds} onChange={(e) => set(i, "odds", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-mono text-muted-foreground">Margin %</Label>
                <Input className="font-mono h-8 text-xs" inputMode="decimal" value={l.margin} onChange={(e) => set(i, "margin", e.target.value)} />
              </div>
              <div className="pb-1 text-xs font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                Edge {pct(r.legEdges[i], 2)}
              </div>
              <Button variant="ghost" size="icon" aria-label="Remove leg" disabled={legs.length <= 2} onClick={() => setLegs(legs.filter((_, j) => j !== i))} className="h-8 w-8">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-500" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setLegs([...legs, { odds: "-110", margin: "4.76" }])} disabled={legs.length >= 10} className="h-8 font-mono text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Add Leg
        </Button>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 pt-2">
          <Stat label="Parlay Price" value={`${am(decimalToAmerican(r.parlayDecimal))} (${isFinite(r.parlayDecimal) ? r.parlayDecimal.toFixed(2) : "—"})`} />
          <Stat label="True Multi-Joint Prob" value={pct(r.fairProb, 2)} />
          <Stat label="Avg Leg Edge" value={pct(r.legEdges.reduce((s, x) => s + x, 0) / r.legEdges.length, 2)} />
          <Stat label="Compound House Edge" value={pct(r.parlayEdge, 2)} highlight />
        </div>
        <p className="text-xs font-mono text-muted-foreground">
          Notice how the bookmaker&apos;s margin compounds exponentially with each additional correlated or independent leg.
        </p>
      </CardContent>
    </Card>
  );
}

export default function Tools() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8 animate-slide-up">
      <div className="border-b border-border/50 pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
            Analytics Suite
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Market Math
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
          <Calculator className="h-6 w-6 text-emerald-500" />
          <span>Quantitative Tools</span>
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Precision sports market calculators for probability conversion, synthetic vigorish extraction, and parlay compounding models.
        </p>
      </div>

      <OddsConverter />
      <NoVigCalc />
      <ParlayCalc />
    </div>
  );
}
