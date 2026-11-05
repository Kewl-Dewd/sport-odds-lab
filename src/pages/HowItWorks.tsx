import { Link } from "react-router-dom";
import {
  DollarSign, BarChart3, TrendingUp, TrendingDown, CheckCircle,
  ArrowRight, Scale, Droplets, Calculator, PieChart,
  Target, Trophy, Flag, Shuffle, Wallet, ShieldAlert, Users, Coins,
  HelpCircle, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function HowItWorks() {
  return (
    <div className="container py-8 md:py-14 space-y-12 animate-slide-up max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3 border-b border-border/70 pb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
          <BookOpen className="h-3.5 w-3.5" /> CURRICULUM GUIDE
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          How Sports Market Lab Works
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A classroom sportsbook simulation powered by live market odds. Your instructor acts as the house — here is how the wagering mathematics, odds pricing, and hold economics operate.
        </p>
      </div>

      <Tabs defaultValue="sportsbook" className="space-y-8">
        <TabsList className="hidden">
          <TabsTrigger value="sportsbook">
            <Target className="h-4 w-4 mr-1.5" /> Sportsbook
          </TabsTrigger>
        </TabsList>

        {/* PREDICTION MARKET (Hidden fallback) */}
        <TabsContent value="prediction" className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Prediction Market</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A prediction market is like an exchange for event outcomes. Prices move with trader activity using automated market makers.
            </p>
          </div>

          <section className="space-y-6">
            <h3 className="text-lg font-bold text-center uppercase tracking-wider font-mono text-muted-foreground">Execution Steps</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: DollarSign, step: "01", title: "Virtual Capital", body: "Each student starts with virtual money. This is your simulation bankroll — no real money is ever involved." },
                { icon: BarChart3, step: "02", title: "Browse the Board", body: "Find sports events to trade on. Each market outcome is priced between 1¢ and 99¢ reflecting implied probability." },
                { icon: TrendingUp, step: "03", title: "Buy & Sell Units", body: "Acquire units if you evaluate an outcome as underpriced. Cash out if the market has moved in your favor." },
                { icon: CheckCircle, step: "04", title: "Collect Settlements", body: "When the event concludes, winning shares pay $1.00 each. Losing shares pay $0. Profit = payout − stake." },
              ].map((s) => (
                <Card key={s.step} className="shadow-subtle-card dark:shadow-terminal-card">
                  <CardContent className="p-5 flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-mono text-xs font-bold">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-base mb-1 text-foreground">{s.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </TabsContent>

        {/* SPORTSBOOK */}
        <TabsContent value="sportsbook" className="space-y-12">
          {/* Bet Types */}
          <section className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-500 font-semibold">MARKET STRUCTURE</span>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Understanding the Three Wager Types</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="h-9 w-9 rounded-md bg-muted/60 border border-border/80 flex items-center justify-center text-emerald-500">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-base text-foreground">Moneyline</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pick who wins outright. Favorites require laying more money (e.g. −150), while underdogs yield higher profits (e.g. +130).
                  </p>
                  <div className="rounded-md border border-border/80 bg-background/60 p-2.5 text-xs font-mono space-y-1.5">
                    <div className="flex justify-between"><span>Lakers ML</span><span className="font-bold text-foreground">−150</span></div>
                    <div className="flex justify-between"><span>Celtics ML</span><span className="font-bold text-emerald-500">+130</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="h-9 w-9 rounded-md bg-muted/60 border border-border/80 flex items-center justify-center text-amber-500">
                    <Scale className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-base text-foreground">Point Spread</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bet on the point margin. The favorite must win by more than the spread line; the underdog covers by keeping it closer or winning.
                  </p>
                  <div className="rounded-md border border-border/80 bg-background/60 p-2.5 text-xs font-mono space-y-1.5">
                    <div className="flex justify-between"><span>Lakers −4.5</span><span className="font-bold text-foreground">−110</span></div>
                    <div className="flex justify-between"><span>Celtics +4.5</span><span className="font-bold text-foreground">−110</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="h-9 w-9 rounded-md bg-muted/60 border border-border/80 flex items-center justify-center text-sky-500">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-base text-foreground">Totals (Over/Under)</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Wager on whether the combined score ends over or under the projected total benchmark, regardless of which team triumphs.
                  </p>
                  <div className="rounded-md border border-border/80 bg-background/60 p-2.5 text-xs font-mono space-y-1.5">
                    <div className="flex justify-between"><span>Over 218.5</span><span className="font-bold text-foreground">−110</span></div>
                    <div className="flex justify-between"><span>Under 218.5</span><span className="font-bold text-foreground">−110</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* American vs Decimal Odds Box */}
          <section className="rounded-xl border border-border/80 bg-card p-6 md:p-8 space-y-4 shadow-terminal-card">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <Calculator className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-foreground">American vs. Decimal Odds Formatting</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-5 pt-1">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">American Lines (+ / −)</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Negative figures (−150) indicate the stake required to win $100 profit. Positive figures (+130) indicate the net profit on a $100 stake.
                </p>
                <div className="rounded-md border border-border/80 bg-muted/30 p-3 font-mono text-xs space-y-1 text-muted-foreground">
                  <div><span className="text-foreground font-bold">−150</span> → Stake $150 to win $100 profit</div>
                  <div><span className="text-emerald-500 font-bold">+130</span> → Stake $100 to win $130 profit</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Decimal Odds (European Standard)</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Multiplies your stake by the decimal multiplier to output total payout (stake returned + profit). Implied chance = 1 ÷ decimal.
                </p>
                <div className="rounded-md border border-border/80 bg-muted/30 p-3 font-mono text-xs space-y-1 text-muted-foreground">
                  <div><span className="text-foreground font-bold">1.67</span> → $10 stake yields $16.70 total return</div>
                  <div><span className="text-emerald-500 font-bold">2.30</span> → $10 stake yields $23.00 total return</div>
                </div>
              </div>
            </div>
          </section>

          {/* Settlement Walkthrough */}
          <section className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-500 font-semibold">MATH OF SETTLEMENT</span>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Settlement Mechanics</h3>
            </div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-bold text-base text-foreground">Example Scenario: Lakers −4.5 @ −110</h4>
                  <Badge variant="outline" className="font-mono text-xs">DECIMAL: 1.91</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Suppose you wager $50.00 on Lakers −4.5 point spread:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-2">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 font-sans text-sm">Outcome: Lakers win by 5+ points ✓</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>Initial Stake: <span className="text-foreground font-bold">$50.00</span></p>
                      <p>Payout Return: 50 × 1.91 = <span className="text-foreground font-bold">$95.50</span></p>
                      <p className="text-emerald-500 font-bold text-sm pt-1 border-t border-emerald-500/20">Net Profit: +$45.50</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 space-y-2">
                    <p className="font-bold text-rose-500 font-sans text-sm">Outcome: Lakers lose or win by ≤4 ✗</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>Initial Stake: <span className="text-foreground font-bold">$50.00</span></p>
                      <p>Payout Return: <span className="text-foreground font-bold">$0.00</span></p>
                      <p className="text-rose-500 font-bold text-sm pt-1 border-t border-rose-500/20">Net Loss: −$50.00</p>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  * If the final margin equals the spread line exactly (e.g. line is −4.0 and margin is 4), the wager pushes and stakes are 100% refunded.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* House Economics (Handle, Liability, Hold) */}
          <section className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-500 font-semibold">THE INSTRUCTOR IS THE HOUSE</span>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">The Economics of "The Book"</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5 space-y-2">
                  <Coins className="h-6 w-6 text-emerald-500 mb-1" />
                  <h4 className="font-bold text-sm text-foreground">Total Handle</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Gross volume wagered into the book. High handle does not equal profit — unhedged lopsided handle creates massive liability for the house.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 space-y-2">
                  <ShieldAlert className="h-6 w-6 text-amber-500 mb-1" />
                  <h4 className="font-bold text-sm text-foreground">Open Liability</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The maximum payout the instructor's book owes if unsettled student bets cash. Risk management requires tracking this ratio continuously.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 space-y-2">
                  <Scale className="h-6 w-6 text-sky-500 mb-1" />
                  <h4 className="font-bold text-sm text-foreground">Hold Percentage</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Percentage of settled handle retained as profit by the bookmaker. Institutional sportsbooks average 4–8% hold over volume via the vig.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6 space-y-3 font-mono text-xs">
                <h4 className="font-bold text-sm font-sans text-foreground">Demonstration: A Perfectly Balanced Book</h4>
                <p className="text-muted-foreground font-sans">
                  Two students stake $100.00 each on opposing sides of a standard −110 / −110 point spread line:
                </p>
                <div className="rounded-md border border-border/80 bg-muted/40 p-4 space-y-1.5 text-muted-foreground">
                  <div>Total Book Handle: <span className="font-bold text-foreground">$200.00</span></div>
                  <div>Winning Ticket Return: 100 × 1.91 = <span className="font-bold text-foreground">$191.00</span></div>
                  <div>Losing Ticket Stake Retained: <span className="font-bold text-foreground">$100.00</span></div>
                  <div className="pt-1.5 border-t border-border/60 font-bold text-emerald-500 text-sm">
                    Guaranteed Book Hold: $200.00 − $191.00 = $9.00 (4.5% Hold Percentage)
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                  Notice that the book never needed to predict the outcome of the match — it simply maintained balanced volume on both sides and harvested the 4.5% vigorish margin.
                </p>
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>

      {/* Bottom CTA */}
      <div className="text-center space-y-4 pt-6 pb-4 border-t border-border/70">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Ready to analyze live lines?</h2>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="hero" size="lg" asChild className="h-10 px-6 font-mono text-xs uppercase">
            <Link to="/markets">
              View Odds Board <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-10 px-6 font-mono text-xs uppercase">
            <Link to="/glossary">Financial Glossary</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
