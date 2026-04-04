import { DollarSign, BarChart3, TrendingUp, CheckCircle, Lightbulb, BookOpen } from "lucide-react";

const steps = [
  {
    icon: DollarSign,
    title: "1. Get Virtual Cash",
    description: "Each student starts with a configurable amount of virtual money. This is your trading capital — use it wisely!",
  },
  {
    icon: BarChart3,
    title: "2. Browse Markets",
    description: "Find sports events to trade on. Each market has outcomes (e.g., Team A wins, Team B wins) with prices that reflect the market's implied probability.",
  },
  {
    icon: TrendingUp,
    title: "3. Buy & Sell Shares",
    description: "Buy shares if you think an outcome is underpriced (likely to happen). Sell if you think it's overpriced. Prices range from $0.01 to $0.99.",
  },
  {
    icon: CheckCircle,
    title: "4. Market Settles",
    description: "When the event concludes, the winning outcome shares pay $1.00 each. Losing outcome shares pay $0.00. Your profit is the difference.",
  },
];

const concepts = [
  {
    icon: Lightbulb,
    title: "How Prices Work",
    description: "Prices represent implied probabilities. A share priced at $0.60 means the market thinks there's a 60% chance that outcome happens. Prices across all outcomes in a market always sum to approximately $1.00.",
  },
  {
    icon: BookOpen,
    title: "No AI, Just Math",
    description: "All prices are calculated using deterministic market-maker formulas (like a cost-function based market maker). There's no artificial intelligence or randomness — just supply, demand, and mathematics.",
  },
];

export default function HowItWorks() {
  return (
    <div className="container py-8 space-y-12 animate-slide-up max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold">How It Works</h1>
        <p className="text-muted-foreground mt-2">
          Learn how prediction markets work in four simple steps
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step) => (
          <div key={step.title} className="stat-card flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
              <step.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-8 space-y-6">
        <h2 className="text-xl font-bold text-center">Key Concepts</h2>
        {concepts.map((c) => (
          <div key={c.title} className="stat-card flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-accent/10 flex items-center justify-center">
              <c.icon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border p-8 text-center space-y-3">
        <h3 className="text-lg font-bold">Example Trade</h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          You buy 100 shares of "Lakers Win" at $0.40 each (cost: $40). If the Lakers win, your shares
          are worth $1.00 each ($100 total) — you profit $60. If they lose, shares are worth $0 and you
          lose your $40 investment.
        </p>
      </div>
    </div>
  );
}
