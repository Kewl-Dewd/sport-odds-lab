import { useState, useMemo, useEffect } from "react";
import { X, TrendingUp, TrendingDown, ArrowRight, Check, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarket } from "@/context/MarketContext";
import { useEducation } from "@/context/EducationContext";
import { NUDGE_CONTENT } from "@/components/education/LearningNudges";
import { calculateSlippage } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";
import { toAmerican, impliedPct } from "@/lib/oddsFormat";
import { AccessRequired } from "@/components/access/AccessGate";
import { useAccess } from "@/hooks/useAccess";
import { useStudentBook } from "@/hooks/useStudentBook";
import { money } from "@/lib/money";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useLearningGate } from "@/hooks/useLearningGate";
import { setForecastMeta } from "@/lib/forecastStore";
import { expectedValue, noVigProb } from "@/lib/forecastMath";

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
  const book = useStudentBook();
  const gate = useLearningGate();
  const [type, setType] = useState<"BUY" | "SELL">(initialType);
  const [amount, setAmount] = useState("");
  const [forecast, setForecast] = useState("");

  const [step, setStep] = useState<Step>("entry");
  const [lastTrade, setLastTrade] = useState<any>(null);

  const market = getMarket(marketId);
  const holding = getHolding(marketId, outcomeId);
  const currentOutcome = market?.outcomes.find((o) => o.id === outcomeId);

  useEffect(() => {
    if (open) { setType(initialType); setAmount(""); setForecast(""); setStep("entry"); setLastTrade(null); }
  }, [open, initialType]);

  const dollars = Math.max(0, Number(amount) || 0);
  const isFixedOdds = market?.config?.engineType === "fixed-odds";

  const qty = useMemo(() => {
    if (dollars <= 0 || !currentOutcome) return 0;
    if (type === "SELL") return Math.min(holding?.shares ?? 0, dollars);
    if (isFixedOdds) return dollars / Math.max(currentOutcome.price, 0.0001);
    let lo = 0;
    let hi = Math.max(1, (dollars / Math.max(currentOutcome.price, 0.01)) * 3);
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const est = estimate(marketId, outcomeId, mid, "BUY");
      if (est && Math.abs(est.totalCost) <= dollars) lo = mid; else hi = mid;
    }
    return lo;
  }, [dollars, type, currentOutcome, holding, marketId, outcomeId, estimate, isFixedOdds]);

  const tradeEstimate = useMemo(() => {
    if (qty <= 0) return null;
    return estimate(marketId, outcomeId, qty, type);
  }, [qty, marketId, outcomeId, type, estimate]);

  const validation = useMemo(() => {
    if (dollars <= 0) return { valid: false, error: type === "BUY" ? "Enter a stake" : "Enter an amount" };
    if (qty <= 0) return { valid: false, error: type === "BUY" ? "Stake is too small for this line" : "You have no position to cash out" };
    return validate(marketId, outcomeId, qty, type);
  }, [dollars, qty, marketId, outcomeId, type, validate]);

  const slippage = useMemo(() => {
    if (!tradeEstimate || !currentOutcome) return 0;
    return calculateSlippage(currentOutcome.price, tradeEstimate.avgPrice, type);
  }, [tradeEstimate, currentOutcome, type]);

  const fixedOdds = isFixedOdds;
  const slippagePct = !fixedOdds && currentOutcome && currentOutcome.price > 0
    ? (slippage / currentOutcome.price) * 100 : 0;
  const highSlippage = !fixedOdds && slippagePct > 5;
  const vigPct = market
    ? (() => {
        const sum = market.outcomes.reduce((t, o) => t + o.price, 0);
        return sum > 0 ? ((sum - 1) / sum) * 100 : 0;
      })()
    : 0;

  const forecastNum = forecast.trim() === "" ? NaN : Number(forecast);
  const forecastValid = Number.isFinite(forecastNum) && forecastNum >= 0 && forecastNum <= 100;
  const forecastProb = forecastValid ? forecastNum / 100 : null;
  const sideImplied = currentOutcome?.price ?? 0;
  const fairProb = market ? noVigProb(sideImplied, market.outcomes.map((o) => o.price)) : 0;
  const lockedDecimal = sideImplied > 0 ? 1 / sideImplied : 0;
  const ev = forecastProb !== null && dollars > 0 ? expectedValue(dollars, lockedDecimal, forecastProb) : null;
  const needsForecast = type === "BUY";

  const handleConfirm = () => {
    if (needsForecast && forecastProb === null) {
      toast.error("Enter your forecast first");
      return;
    }
    if (type === "BUY" && !gate.cleared) {
      toast.error("Finish \"Before you start\" in Learning first");
      return;
    }
    const result = trade(marketId, outcomeId, qty, type);
    if (result) {
      if (type === "BUY" && forecastProb !== null) {
        const meta = market?.metadata as { externalEventId?: string } | undefined;
        setForecastMeta((result as { id: string }).id, {
          forecast_prob: forecastProb,
          implied_prob: result.pricePerShare,
          no_vig_prob: fairProb,
          expected_value: expectedValue(Math.abs(result.totalCost), 1 / result.pricePerShare, forecastProb),
          external_event_id: meta?.externalEventId ?? null,
          event_starts_at: market?.startTime ?? null,
        });
      }
      setLastTrade(result);
      setStep("success");
      toast.success(`${type === "BUY" ? "Bet placed" : "Cashed out"} · $${Math.abs(result.totalCost).toFixed(2)} on ${outcomeName}`, {
        description: `Odds ${toAmerican(result.pricePerShare)}${type === "BUY" ? ` · Pays $${(qty).toFixed(2)} if it wins` : ""}`,
      });

      if (educationEnabled) {
        if (slippagePct > 5) pushNudge(NUDGE_CONTENT.slippage);
        if (result.totalCost > portfolio.cash * 0.4) pushNudge(NUDGE_CONTENT.concentration);
        if (type === "BUY" && result.priceBeforeTrade > 0.8) pushNudge(NUDGE_CONTENT.overconfident);
      }
    } else {
      toast.error("Bet failed", { description: "Something went wrong. Please try again." });
    }
  };

  if (!open || !market || !currentOutcome) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border/80 rounded-xl shadow-terminal-hover animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Terminal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/70 bg-muted/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
                EXECUTION TICKET
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground mt-0.5">{market.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "entry" && type === "BUY" && !gate.cleared && !gate.loading && (
          <div className="p-5 space-y-3 font-mono text-xs">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400 space-y-2">
              <p className="font-semibold">Complete "Before you start" first</p>
              <p className="text-muted-foreground font-sans">
                Before placing your first wager, read and acknowledge the required lessons in
                the module "Before you start: the real-world risks."
              </p>
            </div>
            <Button asChild className="w-full" onClick={onClose}>
              <Link to="/learn">Go to the module →</Link>
            </Button>
          </div>
        )}

        {step === "entry" && (gate.cleared || type === "SELL") && (
          <div className="p-5 space-y-4">
            {/* Outcome Overview Box */}
            <div className="rounded-lg border border-border/80 bg-background/50 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Selection</p>
                <p className="font-bold text-foreground text-sm sm:text-base">{outcomeName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Market Line</p>
                <p className="text-xl font-bold font-mono tracking-tight text-emerald-500 dark:text-emerald-400">
                  {toAmerican(currentOutcome.price)}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">{impliedPct(currentOutcome.price)} implied</p>
              </div>
            </div>

            {/* Buy / Cash-out toggle */}
            {!isFixedOdds && (
              <div className="flex rounded-md border border-border/80 p-1 bg-muted/30">
                <button
                  className={cn(
                    "flex-1 py-1.5 text-xs font-mono font-semibold rounded transition-colors flex items-center justify-center gap-1.5",
                    type === "BUY" ? "bg-emerald-500 text-white shadow-xs" : "hover:bg-muted text-muted-foreground",
                  )}
                  onClick={() => setType("BUY")}
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Place Bet
                </button>
                <button
                  className={cn(
                    "flex-1 py-1.5 text-xs font-mono font-semibold rounded transition-colors flex items-center justify-center gap-1.5",
                    type === "SELL" ? "bg-rose-500 text-white shadow-xs" : "hover:bg-muted text-muted-foreground",
                  )}
                  onClick={() => setType("SELL")}
                >
                  <TrendingDown className="h-3.5 w-3.5" /> Cash Out
                </button>
              </div>
            )}

            {/* Stake Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <label className="font-medium text-foreground">
                  {type === "BUY" ? "VIRTUAL STAKE ($)" : "AMOUNT TO CASH OUT ($)"}
                </label>
                {type === "BUY" ? (
                  <span className="text-muted-foreground">
                    Available: <span className="font-bold text-foreground">{money(book.bankroll)}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Position: <span className="font-bold text-foreground">${(holding?.shares ?? 0).toFixed(2)}</span> to win
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={1}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono text-lg pl-7 h-10 font-bold"
                />
              </div>
              <div className="flex gap-1.5">
                {[5, 10, 25, 50].map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className="flex-1 py-1 text-xs font-mono font-medium rounded border border-border/80 bg-background hover:bg-muted transition-colors"
                  >
                    ${q}
                  </button>
                ))}
                <button
                  onClick={() => setAmount(String(Math.floor(type === "BUY" ? Math.max(0, book.bankroll) : (holding?.shares ?? 0))))}
                  className="flex-1 py-1 text-xs font-mono font-medium rounded border border-border/80 bg-background hover:bg-muted transition-colors text-emerald-500"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Trade Impact Preview */}
            {tradeEstimate && qty > 0 && (
              <div className="rounded-lg bg-muted/40 border border-border/70 p-3.5 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-muted-foreground pb-1 border-b border-border/60">
                  <span className="uppercase text-[10px] font-semibold tracking-wider">Ticket Calculation</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">FIXED VIG</span>
                </div>
                {type === "BUY" && (
                  <div className="flex justify-between items-center text-sm font-bold text-foreground">
                    <span>Potential Net Profit:</span>
                    <span className="text-emerald-500 dark:text-emerald-400">
                      +${Math.max(0, qty - Math.abs(tradeEstimate.totalCost)).toFixed(2)}
                    </span>
                  </div>
                )}
                {type === "BUY" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Payout:</span>
                    <span className="font-semibold text-foreground">${qty.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Locked Odds:</span>
                  <span className="font-semibold text-foreground">{toAmerican(tradeEstimate.avgPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Market Vig / Margin:</span>
                  <span className="font-semibold text-amber-500">{vigPct.toFixed(1)}%</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex justify-between font-bold text-sm text-foreground">
                  <span>Total Stake:</span>
                  <span>${Math.abs(tradeEstimate.totalCost).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Slippage Warning */}
            {highSlippage && qty > 0 && (
              <div className="flex items-center gap-2 text-amber-500 text-xs font-mono rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Large order moves the line by {slippagePct.toFixed(1)}%. Consider a smaller stake.</span>
              </div>
            )}

            {/* Validation Error */}
            {qty > 0 && !validation.valid && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />{validation.error}
              </div>
            )}

            {isPaywalled ? (
              <AccessRequired action="place bets" />
            ) : (
              <div className="space-y-3 pt-1">
                {needsForecast && (
                  <div className="rounded-lg border border-border/80 bg-background/50 p-3 space-y-2.5 font-mono text-xs">
                    <div>
                      <label htmlFor="forecast" className="font-semibold text-foreground block">
                        Your Forecast: win probability for {outcomeName} (%)
                      </label>
                      <Input
                        id="forecast"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        placeholder="e.g. 55"
                        value={forecast}
                        onChange={(e) => setForecast(e.target.value)}
                        className="mt-1 font-mono text-sm h-8"
                      />
                      {forecast !== "" && !forecastValid && (
                        <p className="text-[11px] text-rose-500 mt-1">Enter a valid percentage between 0 and 100.</p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="rounded border border-border/60 bg-muted/30 p-1.5">
                        <p className="text-[10px] text-muted-foreground">Market Implied</p>
                        <p className="font-bold text-foreground">{(sideImplied * 100).toFixed(1)}%</p>
                      </div>
                      <div className="rounded border border-border/60 bg-muted/30 p-1.5">
                        <p className="text-[10px] text-muted-foreground">No-Vig Fair</p>
                        <p className="font-bold text-foreground">{(fairProb * 100).toFixed(1)}%</p>
                      </div>
                      <div className="rounded border border-border/60 bg-muted/30 p-1.5">
                        <p className="text-[10px] text-muted-foreground">Expected Value</p>
                        <p className={cn("font-bold", ev !== null && (ev >= 0 ? "text-emerald-500" : "text-rose-500"))}>
                          {ev === null ? "—" : `${ev >= 0 ? "+" : "−"}${money(Math.abs(ev))}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <Button
                  variant={type === "BUY" ? "hero" : "destructive"}
                  className="w-full h-10 font-mono text-xs uppercase"
                  disabled={!validation.valid || qty <= 0 || (needsForecast && !forecastValid)}
                  onClick={() => setStep("confirm")}
                >
                  Review {type === "BUY" ? "Bet Ticket" : "Cash Out"}<ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && tradeEstimate && (
          <div className="p-5 space-y-4 font-mono text-xs">
            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                CONFIRMATION
              </span>
              <p className="text-2xl font-bold font-sans text-foreground">
                {type === "BUY" ? "Wager" : "Cash out"} ${Math.abs(tradeEstimate.totalCost).toFixed(2)}
              </p>
              <p className="text-sm font-semibold text-emerald-500">{outcomeName}</p>
            </div>

            <div className="rounded-lg border border-border/80 bg-background/50 p-3.5 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Odds:</span>
                <span className="font-bold text-foreground">{toAmerican(tradeEstimate.avgPrice)}</span>
              </div>
              {type === "BUY" && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Potential Profit:</span>
                    <span className="font-bold text-emerald-500">
                      +${Math.max(0, qty - Math.abs(tradeEstimate.totalCost)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Payout:</span>
                    <span className="font-bold text-foreground">${qty.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-sm text-foreground">
                <span>Total Stake:</span>
                <span>${Math.abs(tradeEstimate.totalCost).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setStep("entry")}>
                Back
              </Button>
              <Button
                variant={type === "BUY" ? "hero" : "destructive"}
                className="flex-1 h-9 text-xs"
                onClick={handleConfirm}
              >
                {type === "BUY" ? "Submit Bet" : "Confirm Cash Out"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && lastTrade && (
          <div className="p-6 space-y-4 text-center font-mono text-xs">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold font-sans text-foreground">
                {lastTrade.type === "BUY" ? "Wager Accepted!" : "Position Cashed Out!"}
              </p>
              <p className="text-muted-foreground mt-1">
                ${Math.abs(lastTrade.totalCost).toFixed(2)} on {lastTrade.outcomeName} at {toAmerican(lastTrade.pricePerShare)}.
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/70 p-3.5 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Stake:</span>
                <span className="font-bold text-foreground">${Math.abs(lastTrade.totalCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Accepted Odds:</span>
                <span className="font-bold text-foreground">{toAmerican(lastTrade.pricePerShare)}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full h-9 text-xs mt-2" onClick={onClose}>
              Close Slip
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
