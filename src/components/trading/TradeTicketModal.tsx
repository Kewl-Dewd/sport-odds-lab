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
  const [type, setType] = useState<"BUY" | "SELL">(initialType);
  const [quantity, setQuantity] = useState("");
  const [step, setStep] = useState<Step>("entry");
  const [lastTrade, setLastTrade] = useState<any>(null);

  const market = getMarket(marketId);
  const holding = getHolding(marketId, outcomeId);
  const currentOutcome = market?.outcomes.find((o) => o.id === outcomeId);

  useEffect(() => {
    if (open) { setType(initialType); setQuantity(""); setStep("entry"); setLastTrade(null); }
  }, [open, initialType]);

  const qty = Math.floor(Number(quantity) || 0);

  const tradeEstimate = useMemo(() => {
    if (qty <= 0) return null;
    return estimate(marketId, outcomeId, qty, type);
  }, [qty, marketId, outcomeId, type, estimate]);

  const validation = useMemo(() => {
    if (qty <= 0) return { valid: false, error: "Enter a quantity" };
    return validate(marketId, outcomeId, qty, type);
  }, [qty, marketId, outcomeId, type, validate]);

  // Slippage calculation
  const slippage = useMemo(() => {
    if (!tradeEstimate || !currentOutcome) return 0;
    return calculateSlippage(currentOutcome.price, tradeEstimate.avgPrice, type);
  }, [tradeEstimate, currentOutcome, type]);

  const slippagePct = currentOutcome && currentOutcome.price > 0
    ? (slippage / currentOutcome.price) * 100 : 0;
  const highSlippage = slippagePct > 5;

  const handleConfirm = () => {
    const result = trade(marketId, outcomeId, qty, type);
    if (result) {
      setLastTrade(result);
      setStep("success");
      toast.success(`${type} ${qty} shares of ${outcomeName}`, {
        description: `Executed at ${(result.pricePerShare * 100).toFixed(1)}¢ avg · Total: $${result.totalCost.toFixed(2)}`,
      });
    } else {
      toast.error("Trade failed", { description: "Something went wrong. Please try again." });
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
            <h3 className="font-semibold text-lg">Trade Ticket</h3>
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
                <p className="text-sm text-muted-foreground">Outcome</p>
                <p className="font-semibold">{outcomeName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-xl font-bold font-mono">{(currentOutcome.price * 100).toFixed(1)}¢</p>
              </div>
            </div>

            {/* Buy/Sell toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                className={cn("flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5", type === "BUY" ? "bg-success text-success-foreground" : "hover:bg-muted")}
                onClick={() => setType("BUY")}
              ><TrendingUp className="h-4 w-4" />Buy</button>
              <button
                className={cn("flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5", type === "SELL" ? "bg-destructive text-destructive-foreground" : "hover:bg-muted")}
                onClick={() => setType("SELL")}
              ><TrendingDown className="h-4 w-4" />Sell</button>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Shares</label>
                {type === "BUY" ? (
                  <span className="text-xs text-muted-foreground">Cash: <span className="font-mono">${portfolio.cash.toFixed(2)}</span></span>
                ) : (
                  <span className="text-xs text-muted-foreground">Owned: <span className="font-mono">{holding?.shares ?? 0}</span></span>
                )}
              </div>
              <Input type="number" min={1} step={1} placeholder="Enter quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="font-mono text-lg" />
              <div className="flex gap-2">
                {[10, 25, 50, 100].map((q) => (
                  <button key={q} onClick={() => setQuantity(String(q))} className="flex-1 py-1 text-xs font-medium rounded border hover:bg-muted transition-colors">{q}</button>
                ))}
              </div>
            </div>

            {/* Trade Impact Preview */}
            {tradeEstimate && qty > 0 && (
              <div className="rounded-lg bg-muted p-4 space-y-2.5 text-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trade Impact Preview</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price</span>
                  <span className="font-mono font-semibold">{(currentOutcome.price * 100).toFixed(1)}¢</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Execution Price</span>
                  <span className="font-mono font-semibold">{(tradeEstimate.avgPrice * 100).toFixed(1)}¢</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Market Price</span>
                  <span className="font-mono font-semibold">
                    {(tradeEstimate.priceAfter * 100).toFixed(1)}¢
                    <span className={cn("ml-1 text-xs", tradeEstimate.priceAfter > tradeEstimate.priceBefore ? "price-up" : "price-down")}>
                      ({tradeEstimate.priceAfter > tradeEstimate.priceBefore ? "+" : ""}
                      {((tradeEstimate.priceAfter - tradeEstimate.priceBefore) * 100).toFixed(1)}¢)
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Implied Probability</span>
                  <span className="font-mono text-xs">
                    {(tradeEstimate.impliedProbBefore * 100).toFixed(1)}% → {(tradeEstimate.impliedProbAfter * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-muted-foreground">Slippage</span>
                  <span className={cn("font-mono text-xs", highSlippage ? "text-warning font-semibold" : "")}>
                    {(slippage * 100).toFixed(1)}¢ ({slippagePct.toFixed(1)}%)
                  </span>
                </div>
                {tradeEstimate.fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction Fee</span>
                    <span className="font-mono text-xs">${tradeEstimate.fee.toFixed(2)}</span>
                  </div>
                )}
                {tradeEstimate.spread > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spread Cost</span>
                    <span className="font-mono text-xs">${tradeEstimate.spread.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>{type === "BUY" ? "Total Cost" : "Total Credit"}</span>
                  <span className="font-mono font-bold">${Math.abs(tradeEstimate.totalCost).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Slippage warning */}
            {highSlippage && qty > 0 && (
              <div className="flex items-center gap-2 text-warning text-sm rounded-lg bg-warning/10 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>High slippage ({slippagePct.toFixed(1)}%). Large orders move prices significantly. Consider splitting into smaller trades.</span>
              </div>
            )}

            {/* Validation error */}
            {qty > 0 && !validation.valid && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />{validation.error}
              </div>
            )}

            <Button variant={type === "BUY" ? "success" : "destructive"} className="w-full" disabled={!validation.valid || qty <= 0} onClick={() => setStep("confirm")}>
              Review {type === "BUY" ? "Purchase" : "Sale"}<ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "confirm" && tradeEstimate && (
          <div className="p-5 space-y-5">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Confirm your trade</p>
              <p className="text-2xl font-bold">{type} {qty} shares</p>
              <p className="text-muted-foreground">{outcomeName}</p>
            </div>
            <div className="rounded-lg border p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-mono font-semibold">{qty} shares</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current → New Price</span>
                <span className="font-mono font-semibold">
                  {(tradeEstimate.priceBefore * 100).toFixed(1)}¢ → {(tradeEstimate.priceAfter * 100).toFixed(1)}¢
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Execution</span>
                <span className="font-mono font-semibold">{(tradeEstimate.avgPrice * 100).toFixed(1)}¢</span>
              </div>
              {highSlippage && (
                <div className="flex justify-between text-warning">
                  <span>Slippage</span>
                  <span className="font-mono font-semibold">{slippagePct.toFixed(1)}%</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3">
                <span className="font-medium">{type === "BUY" ? "Total Cost" : "Total Credit"}</span>
                <span className="font-mono font-bold text-lg">${Math.abs(tradeEstimate.totalCost).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("entry")}>Back</Button>
              <Button variant={type === "BUY" ? "success" : "destructive"} className="flex-1" onClick={handleConfirm}>Confirm {type}</Button>
            </div>
          </div>
        )}

        {step === "success" && lastTrade && (
          <div className="p-5 space-y-5 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
              <Check className="h-7 w-7 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold">Trade Executed!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {lastTrade.type} {lastTrade.quantity} shares of {lastTrade.outcomeName} at {(lastTrade.pricePerShare * 100).toFixed(1)}¢ avg.
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-mono font-semibold">${lastTrade.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Movement</span>
                <span className="font-mono font-semibold">
                  {(lastTrade.priceBeforeTrade * 100).toFixed(1)}¢ → {(lastTrade.priceAfterTrade * 100).toFixed(1)}¢
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
