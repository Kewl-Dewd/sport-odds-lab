import { useState, useMemo } from "react";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: "pricing" | "trading" | "portfolio" | "market" | "risk";
  example?: string;
}

const TERMS: GlossaryTerm[] = [
  {
    term: "Market Price",
    definition: "The current cost of one share in an outcome. Ranges from 1¢ to 99¢. The price reflects the crowd's collective estimate of the outcome's likelihood.",
    category: "pricing",
    example: "A price of 65¢ means the market thinks there's roughly a 65% chance.",
  },
  {
    term: "Implied Probability",
    definition: "The probability an outcome will happen, as implied by its current market price. Calculated directly from the share price.",
    category: "pricing",
    example: "If 'Lakers Win' is priced at 60¢, the implied probability is 60%.",
  },
  {
    term: "Liquidity",
    definition: "A parameter that controls how much prices move per trade. Higher liquidity means prices are more stable and absorb larger trades with less movement.",
    category: "market",
    example: "Liquidity 200 → a 10-share buy moves price ~5¢. Liquidity 100 → same trade moves price ~10¢.",
  },
  {
    term: "Slippage",
    definition: "The difference between the displayed price and the actual average execution price of your trade. Larger trades cause more slippage because each successive share costs slightly more.",
    category: "trading",
    example: "Price shows 50¢ but your 50-share buy executes at 52.3¢ average → 2.3¢ slippage.",
  },
  {
    term: "Settlement",
    definition: "When a market closes and final payouts are determined. The instructor triggers settlement after the real-world event concludes. Winning shares pay $1.00, losing shares pay $0.",
    category: "market",
  },
  {
    term: "Unrealized P&L",
    definition: "Profit or loss on shares you still hold, calculated using current market prices. It changes as prices move and only becomes 'realized' when you sell or the market settles.",
    category: "portfolio",
    example: "Bought at 40¢, current price 55¢ → unrealized gain of 15¢ per share.",
  },
  {
    term: "Realized P&L",
    definition: "Profit or loss from trades you've completed — shares you've sold or positions that have been settled. This is locked in and won't change.",
    category: "portfolio",
  },
  {
    term: "Portfolio Value",
    definition: "Your total worth: cash balance + the current market value of all shares you hold. This is the primary metric used for leaderboard rankings.",
    category: "portfolio",
  },
  {
    term: "Diversification",
    definition: "Spreading your investments across multiple markets or outcomes to reduce risk. If one position loses, gains in others can offset the loss.",
    category: "risk",
    example: "Instead of putting $500 in one market, you put $100 in five different markets.",
  },
  {
    term: "Concentration Risk",
    definition: "The risk of having too large a portion of your portfolio in a single market or outcome. A concentrated bet can lead to large gains or large losses.",
    category: "risk",
  },
  {
    term: "Market Maker",
    definition: "An automated pricing formula that always offers to buy and sell shares. It ensures you can always trade, even when no other traders are active. The math determines how much prices move.",
    category: "market",
  },
  {
    term: "LMSR (Logarithmic Market Scoring Rule)",
    definition: "An advanced market-making formula used by prediction markets. It calculates prices using logarithms to ensure probabilities always sum to 100% and provides guaranteed liquidity.",
    category: "pricing",
  },
  {
    term: "Shares",
    definition: "Units of ownership in an outcome. Each share pays $1.00 if the outcome wins, or $0 if it loses. You buy shares when you think an outcome is underpriced.",
    category: "trading",
  },
  {
    term: "Buy / Sell",
    definition: "Buy shares to bet on an outcome (pushes price up). Sell shares to reduce your exposure (pushes price down). Every trade moves the market price.",
    category: "trading",
  },
  {
    term: "Price Impact",
    definition: "How much the market price changes as a result of your trade. Bigger trades in less liquid markets create more price impact.",
    category: "pricing",
  },
  {
    term: "Spread",
    definition: "The difference between the buy price and sell price. A wider spread means it costs more to enter and exit a position.",
    category: "trading",
  },
  {
    term: "Transaction Fee",
    definition: "A small percentage charged on each trade. Set by the instructor. It's deducted from the trade proceeds automatically.",
    category: "trading",
  },
  {
    term: "Volatility",
    definition: "How much and how quickly a market's price changes over time. High volatility means frequent or large price swings. Derived from actual trade history.",
    category: "market",
  },
  {
    term: "Edge",
    definition: "The difference between where you buy and the actual settlement value. Positive edge means you bought below the fair value. Capturing edge is the core skill in prediction markets.",
    category: "trading",
    example: "Bought at 40¢, outcome wins (pays $1.00) → you captured 60¢ of edge.",
  },
  {
    term: "Max Drawdown",
    definition: "The largest peak-to-trough decline in your portfolio value. Measures your worst stretch of losses. A smaller drawdown indicates better risk management.",
    category: "risk",
  },
  {
    term: "Win Rate",
    definition: "The percentage of your trades that were profitable. A useful metric, but high win rate with small wins can be worse than low win rate with large wins.",
    category: "portfolio",
  },
  {
    term: "Profit Factor",
    definition: "Total gross profits divided by total gross losses. A profit factor above 1.0 means you're profitable overall. Above 1.5 is strong.",
    category: "portfolio",
  },
];

const CATEGORIES: { key: GlossaryTerm["category"]; label: string; color: string }[] = [
  { key: "pricing", label: "Pricing", color: "bg-primary/10 text-primary" },
  { key: "trading", label: "Trading", color: "bg-accent/10 text-accent" },
  { key: "portfolio", label: "Portfolio", color: "bg-success/10 text-success" },
  { key: "market", label: "Market", color: "bg-warning/10 text-warning" },
  { key: "risk", label: "Risk", color: "bg-destructive/10 text-destructive" },
];

export default function Glossary() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let terms = TERMS;
    if (activeCategory) terms = terms.filter((t) => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      terms = terms.filter(
        (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
      );
    }
    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }, [search, activeCategory]);

  return (
    <div className="container py-8 space-y-6 animate-slide-up max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Glossary</h1>
        </div>
        <p className="text-muted-foreground">Key prediction market concepts explained in plain language.</p>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              !activeCategory ? "bg-foreground text-background border-foreground" : "hover:bg-muted"
            )}
          >
            All ({TERMS.length})
          </button>
          {CATEGORIES.map((c) => {
            const count = TERMS.filter((t) => t.category === c.key).length;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(activeCategory === c.key ? null : c.key)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  activeCategory === c.key ? c.color + " border-current" : "hover:bg-muted"
                )}
              >
                {c.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Terms */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No terms match your search.</p>
        )}
        {filtered.map((t) => {
          const cat = CATEGORIES.find((c) => c.key === t.category);
          return (
            <Card key={t.term}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-base">{t.term}</h3>
                  {cat && (
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", cat.color)}>
                      {cat.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.definition}</p>
                {t.example && (
                  <div className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                    <strong className="text-foreground">Example:</strong> {t.example}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
