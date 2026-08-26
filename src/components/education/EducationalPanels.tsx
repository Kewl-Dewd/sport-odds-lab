import { Lightbulb, TrendingUp, BarChart3, Droplets, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useEducation } from "@/context/EducationContext";
import { cn } from "@/lib/utils";

interface PanelProps {
  defaultOpen?: boolean;
}

function ExpandablePanel({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
  accentColor = "primary",
}: {
  icon: typeof Lightbulb;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", `bg-${accentColor}/10`)}>
          <Icon className={cn("h-4 w-4", `text-${accentColor}`)} />
        </div>
        <span className="font-medium text-sm flex-1">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2 animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
}

export function PriceMeaningPanel({ price, outcomeName }: { price: number; outcomeName: string }) {
  const { mode } = useEducation();
  const pct = (price * 100).toFixed(0);
  return (
    <ExpandablePanel icon={Lightbulb} title="What this price means" accentColor="primary" defaultOpen={mode === "beginner"}>
      <p>
        A price of <strong className="text-foreground font-mono">{pct}¢</strong> for "{outcomeName}" means the
        market currently implies a <strong className="text-foreground">{pct}%</strong> probability that this
        outcome will happen.
      </p>
      <p>
        If you think the real probability is <em>higher</em> than {pct}%, buying shares could be profitable.
        If you think it's <em>lower</em>, selling (or not buying) is the better move.
      </p>
      <div className="rounded-lg bg-muted p-3 mt-2">
        <p className="text-xs">
          <strong className="text-foreground">Example:</strong> If you buy 100 shares at {pct}¢ and this outcome wins,
          each share pays $1.00. Your profit = 100 × ($1.00 − ${(price).toFixed(2)}) = <strong className="text-foreground price-up">${((1 - price) * 100).toFixed(2)}</strong>
        </p>
      </div>
      {mode === "advanced" && (
        <div className="rounded-lg bg-muted p-3 mt-2">
          <p className="text-xs">
            <strong className="text-foreground">Advanced:</strong> The expected value of this bet is positive when
            your estimated probability exceeds {pct}%. The Kelly criterion would suggest sizing your bet proportionally
            to the perceived edge.
          </p>
        </div>
      )}
    </ExpandablePanel>
  );
}

export function TradingImpactPanel() {
  return (
    <ExpandablePanel icon={TrendingUp} title="How betting changes prices" accentColor="accent">
      <p>
        Every trade moves the price. When you <strong className="text-foreground">buy</strong> shares of an outcome,
        you're expressing confidence it will happen — the price goes <strong className="price-up">up</strong>.
      </p>
      <p>
        When you <strong className="text-foreground">sell</strong> shares, you're reducing your exposure — the
        price goes <strong className="price-down">down</strong>.
      </p>
      <div className="rounded-lg bg-muted p-3 space-y-1 mt-2">
        <p className="text-xs"><strong className="text-foreground">Larger bets</strong> move prices more than small ones.</p>
        <p className="text-xs"><strong className="text-foreground">Higher liquidity</strong> markets absorb bets with less price movement.</p>
        <p className="text-xs">In binary markets, if one outcome goes up, the other automatically goes down.</p>
      </div>
    </ExpandablePanel>
  );
}

export function ImpliedProbabilityPanel() {
  return (
    <ExpandablePanel icon={BarChart3} title="What implied probability is" accentColor="success">
      <p>
        <strong className="text-foreground">Implied probability</strong> is the likelihood of an outcome as
        estimated by the market's collective trading activity. It's derived directly from the share price.
      </p>
      <p>
        A price of <strong className="font-mono text-foreground">65¢</strong> implies a 65% probability.
        On a two-way market the two prices sum to a bit over $1.00 — that extra slice is the book's vig.
      </p>
      <div className="rounded-lg bg-muted p-3 mt-2">
        <p className="text-xs">
          <strong className="text-foreground">Key insight:</strong> The market isn't always right! If you have
          better information or analysis, you can profit by betting against the board's implied chance to win.
          This is the core skill in beating a sportsbook.
        </p>
      </div>
    </ExpandablePanel>
  );
}

export function LiquidityPanel({ liquidityParameter }: { liquidityParameter: number }) {
  return (
    <ExpandablePanel icon={Droplets} title="Why market liquidity matters" accentColor="warning">
      <p>
        This market has a <strong className="text-foreground">liquidity parameter of {liquidityParameter}</strong>.
        This controls how much each trade moves the price.
      </p>
      <p>
        <strong className="text-foreground">Higher liquidity</strong> ({">"}100): Prices move slowly.
        Good for popular events where you want stable pricing.
      </p>
      <p>
        <strong className="text-foreground">Lower liquidity</strong> ({"<"}100): Prices move quickly.
        Each trade has a bigger impact, making the market more volatile and responsive.
      </p>
      <div className="rounded-lg bg-muted p-3 mt-2">
        <p className="text-xs">
          <strong className="text-foreground">Formula:</strong> Price impact = Trade size ÷ Liquidity parameter.
          Buying 10 shares with liquidity 100 moves the price by 10¢. The same trade with liquidity 200 moves
          it only 5¢.
        </p>
      </div>
    </ExpandablePanel>
  );
}

export function EducationalSidebar({ price, outcomeName, liquidityParameter }: {
  price: number;
  outcomeName: string;
  liquidityParameter: number;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Learn</h3>
      <PriceMeaningPanel price={price} outcomeName={outcomeName} />
      <TradingImpactPanel />
      <ImpliedProbabilityPanel />
      <LiquidityPanel liquidityParameter={liquidityParameter} />
    </div>
  );
}
