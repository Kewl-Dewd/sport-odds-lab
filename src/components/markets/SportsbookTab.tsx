import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useMarket } from "@/context/MarketContext";
import {
  decimalToAmerican,
  decimalToImpliedProb,
  formatAmerican,
  type SportsbookLine,
} from "@/lib/sportsbookEngine";
import type { Market } from "@/lib/tradingEngine";
import { TrendingUp, Wallet, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  market: Market;
}

export function SportsbookTab({ market }: Props) {
  const { portfolio, placeSportsbookWager, getMyWagers } = useMarket();
  const surface = market.sportsbook;
  const [stakes, setStakes] = useState<Record<string, string>>({});

  const myWagers = useMemo(
    () => getMyWagers().filter((w) => w.marketId === market.id),
    [getMyWagers, market.id],
  );
  const openWagers = myWagers.filter((w) => w.status === "open");
  const settledWagers = myWagers.filter((w) => w.status !== "open");

  if (!surface || !surface.enabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground font-mono text-xs">
          <p className="text-sm font-semibold font-sans">Sportsbook is not enabled for this market.</p>
          <p className="mt-1 text-muted-foreground">Ask your instructor to import lines from the live odds API.</p>
        </CardContent>
      </Card>
    );
  }

  if (surface.lines.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground font-mono text-xs">
          <p className="text-sm font-semibold font-sans">No lines have been posted yet.</p>
          <p className="mt-1 text-muted-foreground">Lines will appear here once the instructor syncs them.</p>
        </CardContent>
      </Card>
    );
  }

  const grouped: Record<string, SportsbookLine[]> = {};
  for (const line of surface.lines) {
    grouped[line.kind] ??= [];
    grouped[line.kind].push(line);
  }
  const KIND_LABELS: Record<string, string> = {
    moneyline: "Moneyline",
    spread: "Point Spread",
    total: "Totals (Over / Under)",
  };

  const isOpen = market.status === "open";

  const handlePlace = (line: SportsbookLine) => {
    const stakeStr = stakes[line.id] ?? "";
    const stake = parseFloat(stakeStr);
    if (!Number.isFinite(stake) || stake <= 0) return;
    const result = placeSportsbookWager({ marketId: market.id, line, stake });
    if (result.ok) {
      setStakes((prev) => ({ ...prev, [line.id]: "" }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Source Banner */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
            {surface.source === "odds-api" ? "Live Odds Feed" : "Manual Lines"}
          </Badge>
          {surface.lastUpdated && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {new Date(surface.lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Cash Balance:</span>
          <span className="font-bold text-foreground">${portfolio.cash.toFixed(2)}</span>
        </div>
      </div>

      {surface.note && (
        <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs font-mono text-muted-foreground">
          {surface.note}
        </div>
      )}

      {Object.entries(grouped).map(([kind, lines]) => (
        <Card key={kind}>
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-muted-foreground">
              {KIND_LABELS[kind] ?? kind}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-3">
            {lines.map((line) => {
              const stakeStr = stakes[line.id] ?? "";
              const stake = parseFloat(stakeStr);
              const validStake = Number.isFinite(stake) && stake > 0;
              const payout = validStake ? stake * line.decimalOdds : 0;
              const profit = payout - (validStake ? stake : 0);
              const american = decimalToAmerican(line.decimalOdds);
              const impliedPct = decimalToImpliedProb(line.decimalOdds) * 100;
              const overStake = validStake && stake > portfolio.cash;
              return (
                <div
                  key={line.id}
                  className="rounded-lg border border-border/80 bg-background/50 p-3.5 grid sm:grid-cols-[1fr_auto] gap-3 items-center hover:border-border transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{line.label}</span>
                      <Badge variant="outline" className="font-mono text-xs font-bold border-border/80 text-foreground">
                        {formatAmerican(american)}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({line.decimalOdds.toFixed(2)})
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        · {impliedPct.toFixed(1)}% fair chance
                      </span>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="flex items-end gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">
                          Stake ($)
                        </Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="1"
                          value={stakeStr}
                          onChange={(e) =>
                            setStakes((prev) => ({ ...prev, [line.id]: e.target.value }))
                          }
                          className={cn("h-8 w-24 text-xs font-mono font-bold", overStake && "border-rose-500")}
                          placeholder="10"
                        />
                      </div>
                      <div className="text-xs font-mono space-y-0.5 min-w-[100px]">
                        <div>
                          <span className="text-muted-foreground">Return: </span>
                          <span className="font-bold text-foreground">${payout.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit: </span>
                          <span className="font-bold text-emerald-500 dark:text-emerald-400">+${profit.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 text-xs font-mono"
                        onClick={() => handlePlace(line)}
                        disabled={!validStake || overStake}
                      >
                        Place Wager
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs font-mono">Closed</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* My Open Wagers */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Open Wagers ({openWagers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          {openWagers.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 font-mono">No active wagers on this event.</p>
          ) : (
            <div className="divide-y divide-border/60 font-mono text-xs">
              {openWagers.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="font-semibold text-foreground font-sans text-sm">{w.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(w.placedAt).toLocaleString()} · @ {w.decimalOdds.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">${w.stake.toFixed(2)}</p>
                    <p className="text-[11px] text-emerald-500 dark:text-emerald-400">
                      To win ${(w.stake * w.decimalOdds - w.stake).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {settledWagers.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold">Settled Wagers</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="divide-y divide-border/60 font-mono text-xs">
              {settledWagers.map((w) => {
                const profit = (w.settledPayout ?? 0) - w.stake;
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="font-semibold text-foreground font-sans text-sm">{w.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        ${w.stake.toFixed(2)} @ {w.decimalOdds.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          w.status === "won" ? "default" : w.status === "lost" ? "destructive" : "secondary"
                        }
                        className="text-[10px] font-mono uppercase"
                      >
                        {w.status}
                      </Badge>
                      <p
                        className={cn(
                          "text-xs font-bold mt-0.5",
                          profit > 0 ? "text-emerald-500" : profit < 0 ? "text-rose-500" : "text-muted-foreground",
                        )}
                      >
                        {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
