import { useState, useMemo, useEffect } from "react";
import { X, TrendingUp, TrendingDown, ArrowRight, Check, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarket } from "@/context/MarketContext";
import { useEducation } from "@/context/EducationContext";
import { NUDGE_CONTENT } from "@/components/education/LearningNudges";
import { ConceptTooltip, CONCEPTS } from "@/components/ui/concept-tooltip";
import { calculateSlippage } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";
import { toAmerican, impliedPct } from "@/lib/oddsFormat";
import { AccessRequired } from "@/components/access/AccessGate";
import { useAccess } from "@/hooks/useAccess";
import { toast } from "sonner";


interface TradeTicketModalProps {
  open: boolean;
  onClose: () => void;
  marketId: string;
  outcomeId: string;
  outcomeName: string;
  initialType?: "BUY" | "SELL";
}

type Step = "entry" | "confirm" | "success";

export function TradeTicketModal({
  open, onClose, marketId, outcomeId, outcomeName, initialType = "BUY",
}: TradeTicketModalProps) {
  const { estimate, validate, trade, getMarket, getHolding, portfolio } = useMarket();
  const { pushNudge, educationEnabled } = useEducation();
  const { isPaywalled } = useAccess();
  const [type, setType] = useState<"BUY" | "SELL">(initialType);
  // For BUY this is a dollar stake; for SELL it's how much of the position to cash out (dollars of payout).
  const [amount, setAmount] = useState("");

  const [step, setStep] = useState<Step>("entry");
  const [lastTrade, setLastTrade] = useState<any>(null);

  const market = getMarket(marketId);
  const holding = getHolding(marketId, outcomeId);
  const currentOutcome = market?.outcomes.find((o) => o.id === outcomeId);

  useEffect(() => {
    if (open) { setType(initialType); setAmount(""); setStep("entry"); setLastTrade(null); }
  }, [open, initialType]);

  const dollars = Math.max(0, Number(amount) || 0);

  // Convert a dollar stake into the engine's contract quantity.
  const qty = useMemo(() => {
    if (dollars <= 0 || !currentOutcome) return 0;
    if (type === "SELL") return Math.min(holding?.shares ?? 0, Math.floor(dollars));
    const maxQty = Math.max(1, Math.ceil(dollars / Math.max(currentOutcome.price, 0.01)) + 50);
    let lo = 0, hi = maxQty;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      const est = estimate(marketId, outcomeId, mid, "BUY");
      if (est && Math.abs(est.totalCost) <= dollars) lo = mid; else hi = mid - 1;
    }
    return lo;
  }, [dollars, type, currentOutcome, holding, marketId, outcomeId, estimate]);

  const tradeEstimate = useMemo(() => {
    if (qty <= 0) return null;
    return estimate(marketId, outcomeId, qty, type);
  }, [qty, marketId, outcomeId, type, estimate]);

  const validation = useMemo(() => {
    if (dollars <= 0) return { valid: false, error: type === "BUY" ? "Enter a stake" : "Enter an amount" };
    if (qty <= 0) return { valid: false, error: type === "BUY" ? "Stake is too small for this line" : "You have no position to cash out" };
    return validate(marketId, outcomeId, qty, type);
  }, [dollars, qty, marketId, outcomeId, type, validate]);

  // Slippage calculation
  const slippage = useMemo(() => {
    if (!tradeEstimate || !currentOutcome) return 0;
    return calculateSlippage(currentOutcome.price, tradeEstimate.avgPrice, type);
  }, [tradeEstimate, currentOutcome, type]);

  const fixedOdds = market?.config?.engineType === "fixed-odds";
  const slippagePct = !fixedOdds && currentOutcome && currentOutcome.price > 0
    ? (slippage / currentOutcome.price) * 100 : 0;
  const highSlippage = !fixedOdds && slippagePct > 5;
  // Vig = how much the posted prices sum above 100%.
  const vigPct = market
    ? (() => {
        const sum = market.outcomes.reduce((t, o) => t + o.price, 0);
        return sum > 0 ? ((sum - 1) / sum) * 100 : 0;
      })()
    : 0;

  const handleConfirm = () => {
    const result = trade(marketId, outcomeId, qty, type);
    if (result) {
      setLastTrade(result);
      setStep("success");
      toast.success(`${type === "BUY" ? "Bet placed" : "Cashed out"} · $${Math.abs(result.totalCost).toFixed(2)} on ${outcomeName}`, {
        description: `Odds ${toAmerican(result.pricePerShare)}${type === "BUY" ? ` · Pays $${(qty).toFixed(2)} if it wins` : ""}`,
      });

      // Educational nudges after trade
      if (educationEnabled) {
        // High slippage nudge
        if (slippagePct > 5) pushNudge(NUDGE_CONTENT.slippage);
        // Concentrated position nudge
        if (result.totalCost > portfolio.cash * 0.4) pushNudge(NUDGE_CONTENT.concentration);
        // Overconfident nudge
        if (type === "BUY" && result.priceBeforeTrade > 0.8) pushNudge(NUDGE_CONTENT.overconfident);
      }
    } else {
      toast.error("Bet failed", { description: "Something went wrong. Please try again." });
    }
  };

  if (!open || !market || !currentOutcome) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border rounded-2xl shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-semibold text-lg">Bet Slip</h3>
            <p className="text-sm text-muted-foreground">{market.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "entry" && (
          <div className="p-5 space-y-5">
            {/* Outcome */}
            <div className="rounded-lg border p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your pick</p>
                <p className="font-semibold">{outcomeName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Odds</p>
                <p className="text-xl font-bold font-mono">{toAmerican(currentOutcome.price)}</p>
                <p className="text-[11px] text-muted-foreground">{impliedPct(currentOutcome.price)} implied</p>
              </div>
            </div>

            {/* Buy/Sell toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                className={cn("flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5", type === "BUY" ? "bg-success text-success-foreground" : "hover:bg-muted")}
                onClick={() => setType("BUY")}
              ><TrendingUp className="h-4 w-4" />Place bet</button>
              <button
                className={cn("flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5", type === "SELL" ? "bg-destructive text-destructive-foreground" : "hover:bg-muted")}
                onClick={() => setType("SELL")}
              ><TrendingDown className="h-4 w-4" />Cash out</button>
            </div>

            {/* Stake */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{type === "BUY" ? "Stake ($)" : "Amount to cash out ($)"}</label>
                {type === "BUY" ? (
                  <span className="text-xs text-muted-foreground">Bankroll: <span className="font-mono">${portfolio.cash.toFixed(2)}</span></span>
                ) : (
                  <span className="text-xs text-muted-foreground">Position: <span className="font-mono">${(holding?.shares ?? 0).toFixed(2)}</span> to win</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" inputMode="decimal" min={1} step={1} placeholder="0.00" value={amount}
                  onChange={(e) => setAmount(e.target.value)} className="font-mono text-lg pl-7" />
              </div>
              <div className="flex gap-2">
                {[5, 10, 25, 50].map((q) => (
                  <button key={q} onClick={() => setAmount(String(q))} className="flex-1 py-1 text-xs font-medium rounded border hover:bg-muted transition-colors">${q}</button>
                ))}
                <button onClick={() => setAmount(String(Math.floor(type === "BUY" ? portfolio.cash : (holding?.shares ?? 0))))}
                  className="flex-1 py-1 text-xs font-medium rounded border hover:bg-muted transition-colors">Max</button>
              </div>
            </div>

            {/* Trade Impact Preview */}
            {tradeEstimate && qty > 0 && (
              <div className="rounded-lg bg-muted p-4 space-y-2.5 text-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bet Slip Preview</p>
                {type === "BUY" && (
                  <div className="flex justify-between text-base font-semibold">
                    <span>To win</span>
                    <span className="font-mono text-success">${Math.max(0, qty - Math.abs(tradeEstimate.totalCost)).toFixed(2)}</span>
                  </div>
                )}
                {type === "BUY" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total payout if it wins</span>
                    <span className="font-mono font-semibold">${qty.toFixed(2)}</span>
                  </div>
                )}
                {educationEnabled && (
                  <p className="text-xs text-muted-foreground -mt-1 mb-1">
                    {fixedOdds
                      ? "You get the posted odds — your bet does not move the line. The house edge (the \"vig\") is already built into the price: add up both sides' implied chances and they total more than 100%."
                      : "Your stake buys a payout at the current price. Larger bets move the line, so the odds you get can be slightly worse than the ones posted. This is normal."}
                  </p>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posted odds</span>
                  <span className="font-mono font-semibold">{toAmerican(currentOutcome.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your odds</span>
                  <span className="font-mono font-semibold">{toAmerican(tradeEstimate.avgPrice)}</span>
                </div>
                {!fixedOdds && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line after your bet</span>
                  <span className="font-mono font-semibold">
                    {toAmerican(tradeEstimate.priceAfter)}
                    <span className={cn("ml-1 text-xs", tradeEstimate.priceAfter > tradeEstimate.priceBefore ? "price-up" : "price-down")}>
                      ({tradeEstimate.priceAfter > tradeEstimate.priceBefore ? "+" : ""}
                      {((tradeEstimate.priceAfter - tradeEstimate.priceBefore) * 100).toFixed(1)} pts)
                    </span>
                  </span>
                </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Implied chance to win</span>
                  <span className="font-mono text-xs">
                    {fixedOdds
                      ? `${(currentOutcome.price * 100).toFixed(1)}%`
                      : `${(tradeEstimate.impliedProbBefore * 100).toFixed(1)}% → ${(tradeEstimate.impliedProbAfter * 100).toFixed(1)}%`}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-muted-foreground">{fixedOdds ? "House vig on this game" : "Line movement cost"}</span>
                  <span className={cn("font-mono text-xs", !fixedOdds && highSlippage ? "text-warning font-semibold" : "")}>
                    {fixedOdds ? vigPct.toFixed(1) : slippagePct.toFixed(1)}%
                  </span>
                </div>
                {tradeEstimate.fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bet fee</span>
                    <span className="font-mono text-xs">${tradeEstimate.fee.toFixed(2)}</span>
                  </div>
                )}
                {tradeEstimate.spread > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vig / spread</span>
                    <span className="font-mono text-xs">${tradeEstimate.spread.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>{type === "BUY" ? "Stake" : "Cash-out returns"}</span>
                  <span className="font-mono font-bold">${Math.abs(tradeEstimate.totalCost).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Slippage warning */}
            {highSlippage && qty > 0 && (
              <div className="flex items-center gap-2 text-warning text-sm rounded-lg bg-warning/10 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>The line moves a lot on this bet ({slippagePct.toFixed(1)}%). Big stakes shift the price — consider a smaller bet.</span>
              </div>
            )}

            {/* Validation error */}
            {qty > 0 && !validation.valid && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />{validation.error}
              </div>
            )}

            {isPaywalled ? (
              <AccessRequired action="place bets" />
            ) : (
              <Button variant={type === "BUY" ? "success" : "destructive"} className="w-full" disabled={!validation.valid || qty <= 0} onClick={() => setStep("confirm")}>
                Review {type === "BUY" ? "bet" : "cash out"}<ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}

          </div>
        )}

        {step === "confirm" && tradeEstimate && (
          <div className="p-5 space-y-5">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Confirm your bet</p>
              <p className="text-2xl font-bold">{type === "BUY" ? "Bet" : "Cash out"} ${Math.abs(tradeEstimate.totalCost).toFixed(2)}</p>
              <p className="text-muted-foreground">{outcomeName}</p>
            </div>
            <div className="rounded-lg border p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your odds</span>
                <span className="font-mono font-semibold">{toAmerican(tradeEstimate.avgPrice)}</span>
              </div>
              {type === "BUY" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To win</span>
                    <span className="font-mono font-semibold text-success">${Math.max(0, qty - Math.abs(tradeEstimate.totalCost)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total payout</span>
                    <span className="font-mono font-semibold">${qty.toFixed(2)}</span>
                  </div>
                </>
              )}
              {!fixedOdds && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line move</span>
                  <span className="font-mono font-semibold">
                    {toAmerican(tradeEstimate.priceBefore)} → {toAmerican(tradeEstimate.priceAfter)}
                  </span>
                </div>
              )}
              {highSlippage && (
                <div className="flex justify-between text-warning">
                  <span>Line movement cost</span>
                  <span className="font-mono font-semibold">{slippagePct.toFixed(1)}%</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3">
                <span className="font-medium">{type === "BUY" ? "Stake" : "Cash-out returns"}</span>
                <span className="font-mono font-bold text-lg">${Math.abs(tradeEstimate.totalCost).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("entry")}>Back</Button>
              <Button variant={type === "BUY" ? "success" : "destructive"} className="flex-1" onClick={handleConfirm}>{type === "BUY" ? "Place bet" : "Cash out"}</Button>
            </div>
          </div>
        )}

        {step === "success" && lastTrade && (
          <div className="p-5 space-y-5 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
              <Check className="h-7 w-7 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold">{lastTrade.type === "BUY" ? "Bet placed!" : "Cashed out!"}</p>
              <p className="text-sm text-muted-foreground mt-1">
${Math.abs(lastTrade.totalCost).toFixed(2)} on {lastTrade.outcomeName} at {toAmerican(lastTrade.pricePerShare)}.
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lastTrade.type === "BUY" ? "Stake" : "Returns"}</span>
                <span className="font-mono font-semibold">${Math.abs(lastTrade.totalCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{fixedOdds ? "Odds you got" : "Line movement"}</span>
                <span className="font-mono font-semibold">
                  {fixedOdds
                    ? toAmerican(lastTrade.pricePerShare)
                    : `${toAmerican(lastTrade.priceBeforeTrade)} → ${toAmerican(lastTrade.priceAfterTrade)}`}
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}
