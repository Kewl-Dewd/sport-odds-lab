import { X, Lightbulb } from "lucide-react";
import { useEducation } from "@/context/EducationContext";
import { cn } from "@/lib/utils";

export function LearningNudgeBar() {
  const { nudges, dismissNudge, educationEnabled } = useEducation();

  if (!educationEnabled || nudges.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {nudges.slice(0, 2).map((n) => (
        <div
          key={n.id}
          className={cn(
            "rounded-xl border bg-card shadow-lg p-4 animate-slide-up",
            "border-l-4 border-l-primary"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{n.title}</p>
                <button
                  onClick={() => dismissNudge(n.id)}
                  className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Nudge triggers (call these from components) ────────────────────

export const NUDGE_CONTENT = {
  concentration: {
    type: "concentration" as const,
    title: "Concentration Risk",
    message:
      "You placed a large bet in a single market. If this outcome loses, it could significantly impact your bankroll. Consider spreading your capital across multiple markets to reduce risk.",
  },
  slippage: {
    type: "slippage" as const,
    title: "Why Did the Price Slip?",
    message:
      "Your bet was large relative to the market's liquidity, so each share cost slightly more (or earned slightly less) than the displayed price. This is called slippage. Smaller bets experience less slippage.",
  },
  settlement: {
    type: "settlement" as const,
    title: "How Payouts Work",
    message:
      "This market has been settled. Units in the winning outcome pay $1.00 each. Units in losing outcomes pay $0.00. Your bankroll has been updated automatically with the payout.",
  },
  unrealized: {
    type: "unrealized" as const,
    title: "Unrealized vs Realized P&L",
    message:
      "Unrealized P&L is the gain or loss on units you still hold, based on current prices. It only becomes 'realized' when you sell the units or the market settles. Prices can change before then.",
  },
  overconfident: {
    type: "overconfident" as const,
    title: "Buying High-Probability Outcomes",
    message:
      "You bought an outcome already priced above 80¢ (80% implied probability). The potential upside is small (max $1.00) but you risk losing most of your investment if it doesn't happen.",
  },
  diversification: {
    type: "diversification" as const,
    title: "Diversification",
    message:
      "All your open bets are in one market. By betting across multiple markets, you reduce the chance that a single bad outcome significantly hurts your bankroll.",
  },
} as const;
