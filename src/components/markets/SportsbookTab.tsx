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
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-sm">Sportsbook is not enabled for this market.</p>
          <p className="text-xs mt-1">Ask your instructor to import lines from the live odds API.</p>
        </CardContent>
      </Card>
    );
  }

  if (surface.lines.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-sm">No lines have been posted yet.</p>
          <p className="text-xs mt-1">Lines will appear here once the instructor pulls them.</p>
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
      {/* Header / source */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">
            {surface.source === "odds-api" ? "Live odds API" : "Manual lines"}
          </Badge>
          {surface.lastUpdated && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {new Date(surface.lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Cash:</span>
          <span className="font-mono font-semibold">${portfolio.cash.toFixed(2)}</span>
        </div>
      </div>

      {surface.note && (
        <div className="rounded-lg border bg-muted/40 p-3 text-xs">{surface.note}</div>
      )}

      {Object.entries(grouped).map(([kind, lines]) => (
        <Card key={kind}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{KIND_LABELS[kind] ?? kind}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                  className="rounded-lg border p-3 grid sm:grid-cols-[1fr_auto] gap-3 items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{line.label}</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {formatAmerican(american)}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({line.decimalOdds.toFixed(2)})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Implied {impliedPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="flex items-end gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">
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
                          className={cn("h-9 w-24 text-sm font-mono", overStake && "border-destructive")}
                          placeholder="10"
                        />
                      </div>
                      <div className="text-xs space-y-0.5 min-w-[110px]">
                        <div>
                          <span className="text-muted-foreground">Payout: </span>
                          <span className="font-mono font-semibold">${payout.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit: </span>
                          <span className="font-mono text-success">+${profit.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePlace(line)}
                        disabled={!validStake || overStake}
                      >
                        Place wager
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">Closed</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* My open wagers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            My open wagers ({openWagers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {openWagers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No open wagers on this market.</p>
          ) : (
            <div className="space-y-2">
              {openWagers.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between text-sm border-b last:border-0 py-2"
                >
                  <div>
                    <p className="font-medium">{w.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(w.placedAt).toLocaleString()} · @ {w.decimalOdds.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">${w.stake.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Settled wagers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settledWagers.map((w) => {
                const profit = (w.settledPayout ?? 0) - w.stake;
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between text-sm border-b last:border-0 py-2"
                  >
                    <div>
                      <p className="font-medium">{w.label}</p>
                      <p className="text-xs text-muted-foreground">
                        ${w.stake.toFixed(2)} @ {w.decimalOdds.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          w.status === "won" ? "default" : w.status === "lost" ? "destructive" : "secondary"
                        }
                        className="text-xs uppercase"
                      >
                        {w.status}
                      </Badge>
                      <p
                        className={cn(
                          "font-mono text-xs mt-0.5",
                          profit > 0 ? "price-up" : profit < 0 ? "price-down" : "",
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
