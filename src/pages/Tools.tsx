import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
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
    <Card>
      <CardHeader>
        <CardTitle>Odds converter</CardTitle>
        <CardDescription>Type in any box; the others update.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <Label>American</Label>
          <Input value={fields.american} onChange={(e) => update(americanToDecimal(Number(e.target.value.replace("+", ""))), "american", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Decimal</Label>
          <Input inputMode="decimal" value={fields.decimal} onChange={(e) => update(Number(e.target.value), "decimal", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Fractional</Label>
          <Input value={fields.fractional} onChange={(e) => {
            const [n, d] = e.target.value.split("/").map(Number);
            update(fractionalToDecimal(n, d), "fractional", e.target.value);
          }} />
        </div>
        <div className="space-y-1">
          <Label>Implied %</Label>
          <Input inputMode="decimal" value={fields.implied} onChange={(e) => {
            const p = Number(e.target.value) / 100;
            update(p > 0 && p < 1 ? 1 / p : NaN, "implied", e.target.value);
          }} />
        </div>
        {!isFinite(dec) && <p className="col-span-full text-sm text-destructive">Those odds aren't valid.</p>}
      </CardContent>
    </Card>
  );
}

function NoVigCalc() {
  const [a, setA] = useState("-110");
  const [b, setB] = useState("-110");
  const r = noVigTwoWay(americanToDecimal(Number(a)), americanToDecimal(Number(b)));
  return (
    <Card>
      <CardHeader>
        <CardTitle>No-vig calculator (two-way market)</CardTitle>
        <CardDescription>Enter both sides in American odds to strip out the book's margin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>Side A</Label><Input value={a} onChange={(e) => setA(e.target.value)} /></div>
          <div className="space-y-1"><Label>Side B</Label><Input value={b} onChange={(e) => setB(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="A implied" value={pct(r.impliedA)} />
          <Stat label="B implied" value={pct(r.impliedB)} />
          <Stat label="A fair" value={`${pct(r.fairA)} (${am(decimalToAmerican(1 / r.fairA))})`} />
          <Stat label="B fair" value={`${pct(r.fairB)} (${am(decimalToAmerican(1 / r.fairB))})`} />
          <Stat label="Book margin" value={pct(r.overround, 2)} />
        </div>
        <p className="text-sm text-muted-foreground">The implied chances add up to more than 100%; the extra is the book's built-in margin (vig).</p>
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
    <Card>
      <CardHeader>
        <CardTitle>Parlay calculator</CardTitle>
        <CardDescription>Each leg's odds and its market's book margin (use the no-vig calculator to find it; -110/-110 is 4.76%).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {legs.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2">
            <div className="space-y-1"><Label>Leg {i + 1} odds</Label><Input value={l.odds} onChange={(e) => set(i, "odds", e.target.value)} /></div>
            <div className="space-y-1"><Label>Margin %</Label><Input inputMode="decimal" value={l.margin} onChange={(e) => set(i, "margin", e.target.value)} /></div>
            <div className="pb-2 text-sm tabular-nums text-muted-foreground">edge {pct(r.legEdges[i], 2)}</div>
            <Button variant="ghost" size="icon" aria-label="Remove leg" disabled={legs.length <= 2} onClick={() => setLegs(legs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setLegs([...legs, { odds: "-110", margin: "4.76" }])} disabled={legs.length >= 10}>
          <Plus className="mr-1 h-4 w-4" /> Add leg
        </Button>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Parlay odds" value={`${am(decimalToAmerican(r.parlayDecimal))} (${isFinite(r.parlayDecimal) ? r.parlayDecimal.toFixed(2) : "—"})`} />
          <Stat label="True chance all hit" value={pct(r.fairProb, 2)} />
          <Stat label="Average single-leg edge" value={pct(r.legEdges.reduce((s, x) => s + x, 0) / r.legEdges.length, 2)} />
          <Stat label="Parlay house edge" value={pct(r.parlayEdge, 2)} />
        </div>
        <p className="text-sm text-muted-foreground">The book's edge multiplies with every leg, so a parlay costs you more per dollar than betting each leg on its own.</p>
      </CardContent>
    </Card>
  );
}

export default function Tools() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-muted-foreground">Calculators for converting odds, removing the vig, and seeing how parlays grow the house edge.</p>
      </div>
      <OddsConverter />
      <NoVigCalc />
      <ParlayCalc />
    </div>
  );
}
