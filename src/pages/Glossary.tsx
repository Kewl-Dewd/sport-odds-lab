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
    term: "Price (per $1 payout)",
    definition: "What one unit of a bet costs. A unit pays $1.00 if your side wins and $0 if it loses. Prices run from 1¢ to 99¢ and reflect how likely the board thinks that outcome is.",
    category: "pricing",
    example: "A price of 65¢ means the board is pricing roughly a 65% chance to win.",
  },
  {
    term: "Implied Chance to Win",
    definition: "The win probability baked into the current price or odds. Convert American odds to a percentage, or read the price directly.",
    category: "pricing",
    example: "'Lakers ML' priced at 60¢ implies a 60% chance to win.",
  },
  {
    term: "Moneyline",
    definition: "A straight bet on who wins the game, with no points involved. Favorites are priced higher (cost more per $1 of payout); underdogs are cheaper.",
    category: "pricing",
  },
  {
    term: "Spread",
    definition: "A handicap the book applies so both sides are close to even money. The favorite must win by more than the spread; the underdog can lose by less than it and still cash.",
    category: "pricing",
    example: "Lakers −5.5 must win by 6 or more for that bet to win.",
  },
  {
    term: "Total (Over/Under)",
    definition: "A bet on the combined score of both teams finishing above or below a number set by the book.",
    category: "pricing",
  },
  {
    term: "Vig (Juice)",
    definition: "The book's built-in margin. It's why the two sides of a market add up to more than 100% of implied chance — that overround is the house's expected cut.",
    category: "market",
    example: "Both sides priced at 52¢ → 104% total. The extra 4% is the vig.",
  },
  {
    term: "Line Movement",
    definition: "How the board's price shifts as bets come in and news breaks. Heavy action on one side pushes that price up and the other side down.",
    category: "market",
  },
  {
    term: "Line Movement Cost",
    definition: "The gap between the price you saw and the average price you actually got. Bigger stakes move the line against you as you fill.",
    category: "trading",
    example: "Board shows 50¢, your large bet fills at 52.3¢ average → 2.3¢ of movement cost.",
  },
  {
    term: "Stake",
    definition: "The amount of bankroll you put at risk on a single bet. Your stake is deducted immediately and is gone if the bet loses.",
    category: "trading",
  },
  {
    term: "Units",
    definition: "How many $1 payouts your bet is buying. Units × price = your stake; units × $1 = your payout if it wins.",
    category: "trading",
    example: "100 units at 40¢ = $40 stake, $100 payout if it wins.",
  },
  {
    term: "Payout",
    definition: "What a winning bet returns, including your stake. Losing bets return nothing.",
    category: "trading",
  },
  {
    term: "Cash Out",
    definition: "Closing an open bet early at the board's current price instead of waiting for the final result. Locks in a smaller profit or limits a loss.",
    category: "trading",
  },
  {
    term: "Settlement",
    definition: "When the game ends and the book grades every bet. The instructor settles the market after the real result is known: winners are paid, losers are cleared.",
    category: "market",
  },
  {
    term: "Open Bets",
    definition: "Bets on games that haven't settled yet. Their value moves with the board until the final whistle.",
    category: "portfolio",
    example: "Bet at 40¢, board now 55¢ → you're up 15¢ per unit, but nothing is locked in.",
  },
  {
    term: "Settled P&L",
    definition: "Profit or loss from bets that are already graded or cashed out. This is locked in and won't change.",
    category: "portfolio",
  },
  {
    term: "Bankroll",
    definition: "Your total worth: available cash plus the current value of your open bets. This is what the leaderboard ranks you on.",
    category: "portfolio",
  },
  {
    term: "At Risk",
    definition: "Total stake currently tied up in open bets. Cash that is committed and can't be used on new bets.",
    category: "risk",
  },
  {
    term: "Bankroll Management",
    definition: "Sizing bets as a small, consistent slice of your bankroll so a bad run can't wipe you out.",
    category: "risk",
    example: "Instead of $500 on one game, five $100 bets across different games.",
  },
  {
    term: "Concentration Risk",
    definition: "Having too much of your bankroll on one game or one side. It can produce a huge night — or take you to zero.",
    category: "risk",
  },
  {
    term: "The Book (House)",
    definition: "Your instructor. The book sets the board, takes the other side of every student bet, collects the vig, and carries the liability if the class hits.",
    category: "market",
  },
  {
    term: "Handle",
    definition: "The total dollars wagered through the book over a period. Handle is volume, not profit.",
    category: "market",
  },
  {
    term: "Hold",
    definition: "The share of settled handle the book keeps. Real sportsbooks hold roughly 4–8% over time thanks to the vig.",
    category: "market",
  },
  {
    term: "Liability",
    definition: "The worst-case amount the book would have to pay out if the outcomes it's most exposed to all come in.",
    category: "risk",
  },
  {
    term: "Closing Line Value (Edge)",
    definition: "Whether you beat the price the board settled at. Consistently betting better numbers than the close is the core skill in a sportsbook.",
    category: "trading",
    example: "You bet at 40¢, the line closed at 55¢ → you captured 15¢ of edge.",
  },
  {
    term: "Max Drawdown",
    definition: "The largest peak-to-trough drop in your bankroll. Measures your worst losing stretch — smaller is better discipline.",
    category: "portfolio",
  },
  {
    term: "Win Rate",
    definition: "The percentage of your bets that cashed. Useful, but a high win rate on short prices can still lose money.",
    category: "portfolio",
  },
  {
    term: "ROI per Bet",
    definition: "Total profit divided by total staked. Above 0% means you're beating the book overall; anything above 5% is strong.",
    category: "portfolio",
  },
];

const CATEGORIES: { key: GlossaryTerm["category"]; label: string; color: string }[] = [
  { key: "pricing", label: "Odds & Lines", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  { key: "trading", label: "Betting Mechanics", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  { key: "portfolio", label: "Bankroll Metrics", color: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
  { key: "market", label: "The Book & Vig", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  { key: "risk", label: "Risk Management", color: "bg-rose-500/10 text-rose-500 border-rose-500/30" },
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
    <div className="container py-8 space-y-6 animate-slide-up max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border/50 pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
            Market Taxonomy
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Sportsbook Vocabulary
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
          <BookOpen className="h-6 w-6 text-emerald-500" />
          <span>Market Glossary</span>
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Essential sportsbook terminology, pricing mathematics, and risk management definitions.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts, formulas, or terms (e.g. vig, CLV, spread)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-mono border transition-all",
              !activeCategory
                ? "bg-foreground text-background border-foreground font-semibold"
                : "border-border/60 hover:bg-muted/40 text-muted-foreground"
            )}
          >
            All ({TERMS.length})
          </button>
          {CATEGORIES.map((c) => {
            const count = TERMS.filter((t) => t.category === c.key).length;
            const isSelected = activeCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(isSelected ? null : c.key)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-mono border transition-all",
                  isSelected
                    ? c.color + " font-semibold ring-1 ring-current"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                )}
              >
                {c.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Terms Grid */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 rounded-lg border border-dashed border-border/60 bg-muted/20">
            <p className="text-xs font-mono text-muted-foreground">No terminology matching query.</p>
          </div>
        )}
        {filtered.map((t) => {
          const cat = CATEGORIES.find((c) => c.key === t.category);
          return (
            <Card key={t.term} className="border-border/60 bg-card/60 backdrop-blur-sm shadow-subtle-card hover:border-emerald-500/30 transition-all">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-sm sm:text-base tracking-tight text-foreground">{t.term}</h3>
                  {cat && (
                    <span className={cn("shrink-0 rounded px-2 py-0.5 text-[10px] font-mono border", cat.color)}>
                      {cat.label}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{t.definition}</p>
                {t.example && (
                  <div className="mt-3 rounded border border-border/40 bg-muted/30 p-2.5 text-xs font-mono text-muted-foreground">
                    <span className="text-emerald-500 font-semibold uppercase tracking-wider text-[10px] block mb-0.5">Example</span>
                    {t.example}
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
