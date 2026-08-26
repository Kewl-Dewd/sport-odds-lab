import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConceptTooltipProps {
  term: string;
  explanation: string;
  children?: React.ReactNode;
}

export function ConceptTooltip({ term, explanation, children }: ConceptTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/40">
          {children ?? term}
          <Info className="h-3 w-3 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm" side="top">
        <p className="font-semibold mb-0.5">{term}</p>
        <p className="text-muted-foreground text-xs">{explanation}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Pre-built concept tooltips for common terms
export const CONCEPTS = {
  impliedProbability: {
    term: "Implied Probability",
    explanation: "The probability of an outcome as suggested by its current market price. A price of 60¢ implies a 60% probability.",
  },
  liquidity: {
    term: "Liquidity",
    explanation: "How much the price moves per bet. Higher liquidity means smaller price changes, making the market more stable.",
  },
  slippage: {
    term: "Slippage",
    explanation: "The difference between the expected price and the actual execution price. Larger bets cause more slippage.",
  },
  settlement: {
    term: "Settlement",
    explanation: "When a market closes and payouts are determined. Winning units pay $1.00, losing units pay $0.",
  },
  unrealizedPnL: {
    term: "Unrealized P&L",
    explanation: "Profit or loss on units you still hold, based on current market prices. It becomes 'realized' when you sell.",
  },
  portfolioValue: {
    term: "Bankroll Value",
    explanation: "Your total worth: cash balance plus the current market value of all units you hold.",
  },
  marketMaker: {
    term: "Market Maker",
    explanation: "An automated pricing formula that always offers to buy and sell units. It ensures you can always bet, even when no other bettors are active.",
  },
} as const;
