import { Link } from "react-router-dom";
import {
  DollarSign, BarChart3, TrendingUp, TrendingDown, CheckCircle, Lightbulb,
  BookOpen, ArrowRight, Scale, Droplets, Calculator, PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HowItWorks() {
  return (
    <div className="container py-8 md:py-12 space-y-16 animate-slide-up max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">How Prediction Markets Work</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A prediction market is like a stock exchange for future events. Instead of buying company shares,
          you buy shares in possible outcomes. Here's everything you need to know.
        </p>
      </div>

      {/* Step by step */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-center">Four Steps to Trading</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              icon: DollarSign, step: "1", title: "Get Virtual Cash",
              body: "Each student starts with virtual money (typically $10,000). This is your trading capital — no real money is involved.",
            },
            {
              icon: BarChart3, step: "2", title: "Browse Markets",
              body: "Find sports events to trade on. Each market has outcomes with prices between 1¢ and 99¢ that reflect the market's implied probability.",
            },
            {
              icon: TrendingUp, step: "3", title: "Buy & Sell Shares",
              body: "Buy shares if you think an outcome is underpriced (more likely than the market believes). Sell if you think it's overpriced.",
            },
            {
              icon: CheckCircle, step: "4", title: "Collect Payouts",
              body: "When the event concludes, winning shares pay $1.00 each. Losing shares pay $0. Your profit = payout − cost.",
            },
          ].map((s) => (
            <Card key={s.step}>
              <CardContent className="p-6 flex gap-4">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">Step {s.step}</p>
                  <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How Prices Move */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">How Prices Move</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Prices aren't fixed odds set by a bookmaker. They change dynamically based on trading activity.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 space-y-3 text-center">
              <TrendingUp className="h-8 w-8 text-success mx-auto" />
              <h3 className="font-semibold">Buying Pushes Price Up</h3>
              <p className="text-sm text-muted-foreground">
                When traders buy shares in "Lakers Win," its price rises. More buyers = higher implied probability.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3 text-center">
              <TrendingDown className="h-8 w-8 text-destructive mx-auto" />
              <h3 className="font-semibold">Selling Pushes Price Down</h3>
              <p className="text-sm text-muted-foreground">
                Selling shares lowers the price. If traders think an outcome is overpriced, selling corrects it.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3 text-center">
              <Scale className="h-8 w-8 text-accent mx-auto" />
              <h3 className="font-semibold">Prices Stay Balanced</h3>
              <p className="text-sm text-muted-foreground">
                In a two-outcome market, prices sum to ~$1.00. If one goes up, the other goes down.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Not Fixed Odds */}
      <section className="rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border p-8 md:p-10 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Why Prices Aren't Fixed Odds</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Traditional Sportsbook</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2"><span className="text-destructive">✗</span> Odds set by the house</li>
              <li className="flex items-start gap-2"><span className="text-destructive">✗</span> Prices don't change with demand</li>
              <li className="flex items-start gap-2"><span className="text-destructive">✗</span> House always takes a cut</li>
              <li className="flex items-start gap-2"><span className="text-destructive">✗</span> You bet against the house</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Prediction Market (This App)</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2"><span className="text-success">✓</span> Prices set by trader activity</li>
              <li className="flex items-start gap-2"><span className="text-success">✓</span> Every trade moves the price</li>
              <li className="flex items-start gap-2"><span className="text-success">✓</span> Math-based market maker, no house edge</li>
              <li className="flex items-start gap-2"><span className="text-success">✓</span> You trade against other participants</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Implied Probability */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Understanding Implied Probability</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <PieChart className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Price = Probability</h3>
              <p className="text-sm text-muted-foreground">
                A share priced at <strong>65¢</strong> means the market collectively believes there's a
                <strong> 65% chance</strong> that outcome happens.
              </p>
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span>Lakers Win</span><span className="font-bold">65¢ = 65%</span></div>
                <div className="flex justify-between"><span>Celtics Win</span><span className="font-bold">35¢ = 35%</span></div>
                <div className="flex justify-between border-t pt-2"><span>Total</span><span className="font-bold">$1.00 = 100%</span></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Droplets className="h-6 w-6 text-accent" />
              <h3 className="font-semibold">Liquidity & Price Impact</h3>
              <p className="text-sm text-muted-foreground">
                The <strong>liquidity parameter</strong> controls how much prices move per trade.
                Higher liquidity = more stable prices. Your instructor may set different liquidity for different markets.
              </p>
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Low liquidity (50)</span>
                  <span className="text-warning font-medium">Prices swing more</span>
                </div>
                <div className="flex justify-between">
                  <span>High liquidity (200)</span>
                  <span className="text-success font-medium">Prices more stable</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Scoring */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">How You're Scored</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Your ranking is based on total portfolio value — cash plus the market value of your holdings.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Portfolio Value", desc: "Cash + current value of all shares you hold", icon: "💰" },
            { label: "Return %", desc: "How much you've grown (or lost) vs. starting balance", icon: "📈" },
            { label: "Accuracy", desc: "Percentage of trades where the price moved in your favor", icon: "🎯" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 text-center space-y-2">
                <span className="text-2xl">{s.icon}</span>
                <h3 className="font-semibold text-sm">{s.label}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Settlement */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">How Settlement Works</h2>
        </div>
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="space-y-4">
              <div className="rounded-lg border p-5 space-y-3">
                <h3 className="font-bold text-lg">Example: Lakers vs Celtics</h3>
                <p className="text-sm text-muted-foreground">You buy 100 shares of "Lakers Win" at 40¢ each.</p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-success/5 border border-success/20 p-4 space-y-2">
                    <p className="font-semibold text-success">If Lakers Win ✓</p>
                    <div className="font-mono space-y-1">
                      <p>Your cost: 100 × $0.40 = <strong>$40.00</strong></p>
                      <p>Your payout: 100 × $1.00 = <strong>$100.00</strong></p>
                      <p className="text-success font-bold">Profit: +$60.00</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-2">
                    <p className="font-semibold text-destructive">If Celtics Win ✗</p>
                    <div className="font-mono space-y-1">
                      <p>Your cost: 100 × $0.40 = <strong>$40.00</strong></p>
                      <p>Your payout: 100 × $0.00 = <strong>$0.00</strong></p>
                      <p className="text-destructive font-bold">Loss: -$40.00</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Settlement is triggered by your instructor when the event concludes. Payouts are automatic.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <div className="text-center space-y-4 pb-8">
        <h2 className="text-xl font-bold">Ready to start?</h2>
        <div className="flex gap-3 justify-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/markets">Browse Markets<ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
