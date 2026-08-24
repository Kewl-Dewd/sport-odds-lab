import { Link } from "react-router-dom";
import {
  DollarSign, BarChart3, TrendingUp, TrendingDown, CheckCircle,
  ArrowRight, Scale, Droplets, Calculator, PieChart,
  Target, Trophy, Flag, Shuffle, Wallet, ShieldAlert, Users, Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HowItWorks() {
  return (
    <div className="container py-8 md:py-12 space-y-10 animate-slide-up max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">How It Works</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Sports Market Lab runs a classroom sportsbook on live odds. Your instructor is the house — here&apos;s how the betting and the book work.
        </p>
      </div>

      {/* Prediction-market and racetrack tabs are hidden for now (sportsbook-only focus).
          Their content blocks are kept below so they can be re-enabled later. */}
      <Tabs defaultValue="sportsbook" className="space-y-8">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="sportsbook">
            <Target className="h-4 w-4 mr-1.5" /> Sportsbook
          </TabsTrigger>
        </TabsList>

        {/* ─────────────────────── PREDICTION MARKET ─────────────────────── */}
        <TabsContent value="prediction" className="space-y-16">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Prediction Market</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A prediction market is like a stock exchange for future events. Instead of buying company shares,
              you buy shares in possible outcomes. Prices move with trader activity.
            </p>
          </div>

          <section className="space-y-8">
            <h3 className="text-xl font-bold text-center">Four Steps to Trading</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: DollarSign, step: "1", title: "Get Virtual Cash", body: "Each student starts with virtual money (typically $10,000). This is your trading capital — no real money is involved." },
                { icon: BarChart3, step: "2", title: "Browse Markets", body: "Find sports events to trade on. Each market has outcomes priced between 1¢ and 99¢ that reflect implied probability." },
                { icon: TrendingUp, step: "3", title: "Buy & Sell Shares", body: "Buy shares if you think an outcome is underpriced. Sell if you think it's overpriced." },
                { icon: CheckCircle, step: "4", title: "Collect Payouts", body: "When the event concludes, winning shares pay $1.00 each. Losing shares pay $0. Profit = payout − cost." },
              ].map((s) => (
                <Card key={s.step}>
                  <CardContent className="p-6 flex gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">Step {s.step}</p>
                      <h4 className="font-semibold text-lg mb-1">{s.title}</h4>
                      <p className="text-sm text-muted-foreground">{s.body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">How Prices Move</h3>
              <p className="text-muted-foreground max-w-xl mx-auto">Prices aren't fixed odds set by a bookmaker — they change dynamically with trading activity.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card><CardContent className="p-6 space-y-3 text-center">
                <TrendingUp className="h-8 w-8 text-success mx-auto" />
                <h4 className="font-semibold">Buying Pushes Price Up</h4>
                <p className="text-sm text-muted-foreground">When traders buy shares in "Lakers Win," its price rises. More buyers = higher implied probability.</p>
              </CardContent></Card>
              <Card><CardContent className="p-6 space-y-3 text-center">
                <TrendingDown className="h-8 w-8 text-destructive mx-auto" />
                <h4 className="font-semibold">Selling Pushes Price Down</h4>
                <p className="text-sm text-muted-foreground">Selling lowers the price. If traders think an outcome is overpriced, selling corrects it.</p>
              </CardContent></Card>
              <Card><CardContent className="p-6 space-y-3 text-center">
                <Scale className="h-8 w-8 text-accent mx-auto" />
                <h4 className="font-semibold">Prices Stay Balanced</h4>
                <p className="text-sm text-muted-foreground">In a two-outcome market, prices sum to ~$1.00. If one goes up, the other goes down.</p>
              </CardContent></Card>
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border p-8 md:p-10 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Why Prediction Markets Differ from Fixed Odds</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Traditional Sportsbook</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2"><span className="text-destructive">✗</span> Odds set by the house</li>
                  <li className="flex items-start gap-2"><span className="text-destructive">✗</span> Prices don't change with demand</li>
                  <li className="flex items-start gap-2"><span className="text-destructive">✗</span> House always takes a cut</li>
                  <li className="flex items-start gap-2"><span className="text-destructive">✗</span> You bet against the house</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Prediction Market (this tab)</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2"><span className="text-success">✓</span> Prices set by trader activity</li>
                  <li className="flex items-start gap-2"><span className="text-success">✓</span> Every trade moves the price</li>
                  <li className="flex items-start gap-2"><span className="text-success">✓</span> Math-based market maker, no house edge</li>
                  <li className="flex items-start gap-2"><span className="text-success">✓</span> You trade against other participants</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="text-center space-y-2"><h3 className="text-xl font-bold">Understanding Implied Probability</h3></div>
            <div className="grid sm:grid-cols-2 gap-6">
              <Card><CardContent className="p-6 space-y-4">
                <PieChart className="h-6 w-6 text-primary" />
                <h4 className="font-semibold">Price = Probability</h4>
                <p className="text-sm text-muted-foreground">A share priced at <strong>65¢</strong> means the market believes there's a <strong>65% chance</strong> that outcome happens.</p>
                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm font-mono">
                  <div className="flex justify-between"><span>Lakers Win</span><span className="font-bold">65¢ = 65%</span></div>
                  <div className="flex justify-between"><span>Celtics Win</span><span className="font-bold">35¢ = 35%</span></div>
                  <div className="flex justify-between border-t pt-2"><span>Total</span><span className="font-bold">$1.00 = 100%</span></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="p-6 space-y-4">
                <Droplets className="h-6 w-6 text-accent" />
                <h4 className="font-semibold">Liquidity & Price Impact</h4>
                <p className="text-sm text-muted-foreground">The <strong>liquidity parameter</strong> controls how much prices move per trade. Higher liquidity = more stable prices.</p>
                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Low liquidity (50)</span><span className="text-warning font-medium">Prices swing more</span></div>
                  <div className="flex justify-between"><span>High liquidity (200)</span><span className="text-success font-medium">Prices more stable</span></div>
                </div>
              </CardContent></Card>
            </div>
          </section>

          <section className="space-y-6">
            <div className="text-center space-y-2"><h3 className="text-xl font-bold">How Settlement Works</h3></div>
            <Card><CardContent className="p-6 md:p-8">
              <div className="rounded-lg border p-5 space-y-3">
                <h4 className="font-bold text-lg">Example: Lakers vs Celtics</h4>
                <p className="text-sm text-muted-foreground">You buy 100 shares of "Lakers Win" at 40¢ each.</p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-success/5 border border-success/20 p-4 space-y-2">
                    <p className="font-semibold text-success">If Lakers Win ✓</p>
                    <div className="font-mono space-y-1">
                      <p>Cost: 100 × $0.40 = <strong>$40.00</strong></p>
                      <p>Payout: 100 × $1.00 = <strong>$100.00</strong></p>
                      <p className="text-success font-bold">Profit: +$60.00</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-2">
                    <p className="font-semibold text-destructive">If Celtics Win ✗</p>
                    <div className="font-mono space-y-1">
                      <p>Cost: 100 × $0.40 = <strong>$40.00</strong></p>
                      <p>Payout: 100 × $0.00 = <strong>$0.00</strong></p>
                      <p className="text-destructive font-bold">Loss: -$40.00</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Settlement is triggered by your instructor when the event concludes. Payouts are automatic.
              </p>
            </CardContent></Card>
          </section>
        </TabsContent>

        {/* ─────────────────────── SPORTSBOOK ─────────────────────── */}
        <TabsContent value="sportsbook" className="space-y-16">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Sportsbook</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The sportsbook tab shows real moneyline, spread, and totals lines from a live odds API. You're betting <em>against the book</em>
              {" "}at fixed odds — your payout is locked in the moment you place the wager.
            </p>
          </div>

          <section className="space-y-8">
            <h3 className="text-xl font-bold text-center">Four Steps to Wagering</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Wallet, step: "1", title: "Use Your Bankroll", body: "Every student starts a class or contest window with a virtual bankroll. That bankroll is the only thing you can risk." },
                { icon: Target, step: "2", title: "Pick a Line", body: "Choose a moneyline (who wins), a point spread (who covers), or a total (over/under combined points). Each line has fixed decimal or American odds." },
                { icon: Coins, step: "3", title: "Place Your Stake", body: "Enter how much you want to risk. Your potential payout = stake × decimal odds. The price is locked the moment you confirm." },
                { icon: CheckCircle, step: "4", title: "Settle on the Result", body: "When the game finishes the instructor enters the score. Wins pay your full stake plus profit; losses forfeit the stake; pushes refund the stake." },
              ].map((s) => (
                <Card key={s.step}>
                  <CardContent className="p-6 flex gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">Step {s.step}</p>
                      <h4 className="font-semibold text-lg mb-1">{s.title}</h4>
                      <p className="text-sm text-muted-foreground">{s.body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Reading the Three Bet Types</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card><CardContent className="p-6 space-y-3">
                <Trophy className="h-7 w-7 text-primary" />
                <h4 className="font-semibold">Moneyline</h4>
                <p className="text-sm text-muted-foreground">Pick who wins outright. Favorites pay less than your stake (e.g. −150), underdogs pay more (e.g. +130).</p>
                <div className="rounded-lg bg-muted p-3 text-xs font-mono space-y-1">
                  <div className="flex justify-between"><span>Lakers ML</span><span>−150</span></div>
                  <div className="flex justify-between"><span>Celtics ML</span><span>+130</span></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="p-6 space-y-3">
                <Scale className="h-7 w-7 text-accent" />
                <h4 className="font-semibold">Point Spread</h4>
                <p className="text-sm text-muted-foreground">Bet on the margin. The favorite must win by more than the spread; the underdog can lose by less (or win outright) and still cover.</p>
                <div className="rounded-lg bg-muted p-3 text-xs font-mono space-y-1">
                  <div className="flex justify-between"><span>Lakers −4.5</span><span>−110</span></div>
                  <div className="flex justify-between"><span>Celtics +4.5</span><span>−110</span></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="p-6 space-y-3">
                <BarChart3 className="h-7 w-7 text-success" />
                <h4 className="font-semibold">Total (Over/Under)</h4>
                <p className="text-sm text-muted-foreground">Bet whether the combined final score is over or under the posted line, regardless of who wins.</p>
                <div className="rounded-lg bg-muted p-3 text-xs font-mono space-y-1">
                  <div className="flex justify-between"><span>Over 218.5</span><span>−110</span></div>
                  <div className="flex justify-between"><span>Under 218.5</span><span>−110</span></div>
                </div>
              </CardContent></Card>
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border p-8 md:p-10 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">American vs Decimal Odds</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">American Odds</h4>
                <p className="text-sm text-muted-foreground">A negative number (−150) is the stake needed to win $100. A positive number (+130) is the profit on a $100 stake.</p>
                <div className="rounded-lg bg-muted p-3 font-mono text-xs space-y-1">
                  <div>−150 → bet $150 to win $100</div>
                  <div>+130 → bet $100 to win $130</div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Decimal Odds</h4>
                <p className="text-sm text-muted-foreground">Multiply your stake by the decimal to get total return (stake + profit). Easier for math: implied probability = 1 ÷ decimal.</p>
                <div className="rounded-lg bg-muted p-3 font-mono text-xs space-y-1">
                  <div>1.67 → $10 returns $16.70</div>
                  <div>2.30 → $10 returns $23.00</div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="text-center space-y-2"><h3 className="text-xl font-bold">Sportsbook Settlement</h3></div>
            <Card><CardContent className="p-6 md:p-8">
              <div className="rounded-lg border p-5 space-y-3">
                <h4 className="font-bold text-lg">Example: Lakers −4.5 at −110</h4>
                <p className="text-sm text-muted-foreground">You stake $50 on Lakers −4.5 (decimal odds 1.91).</p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-success/5 border border-success/20 p-4 space-y-2">
                    <p className="font-semibold text-success">If Lakers win by 5+ ✓</p>
                    <div className="font-mono space-y-1">
                      <p>Stake: <strong>$50.00</strong></p>
                      <p>Payout: 50 × 1.91 = <strong>$95.50</strong></p>
                      <p className="text-success font-bold">Profit: +$45.50</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-2">
                    <p className="font-semibold text-destructive">If Lakers lose or win by ≤4 ✗</p>
                    <div className="font-mono space-y-1">
                      <p>Stake: <strong>$50.00</strong></p>
                      <p>Payout: <strong>$0.00</strong></p>
                      <p className="text-destructive font-bold">Loss: −$50.00</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">If the margin lands exactly on the spread (e.g. Lakers win by exactly 4 on a −4.0 line), the wager is a <strong>push</strong> and your stake is refunded.</p>
              </div>
            </CardContent></Card>
          </section>

          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Your instructor runs the book</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every class is its own sportsbook. Students bet against the house, and the house is
                the instructor — so the class can watch the book&apos;s economics play out in real time.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card><CardContent className="p-6 space-y-3">
                <Coins className="h-7 w-7 text-primary" />
                <h4 className="font-semibold">Handle</h4>
                <p className="text-sm text-muted-foreground">The total amount wagered into the book. Volume, not profit — a big handle can still be a losing week for the house.</p>
              </CardContent></Card>
              <Card><CardContent className="p-6 space-y-3">
                <ShieldAlert className="h-7 w-7 text-warning" />
                <h4 className="font-semibold">Liability</h4>
                <p className="text-sm text-muted-foreground">What the book would owe if every open bet won. Lopsided action on one side is how a book gets hurt.</p>
              </CardContent></Card>
              <Card><CardContent className="p-6 space-y-3">
                <Scale className="h-7 w-7 text-success" />
                <h4 className="font-semibold">Hold %</h4>
                <p className="text-sm text-muted-foreground">The share of settled handle the book keeps. Real sportsbooks hold roughly 4–8% over time thanks to the vig.</p>
              </CardContent></Card>
            </div>
            <Card><CardContent className="p-6 md:p-8 space-y-3">
              <h4 className="font-bold text-lg">Example: a balanced book</h4>
              <p className="text-sm text-muted-foreground">Two students bet $100 each on opposite sides of a −110 / −110 spread.</p>
              <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
                <div>Handle: $200.00</div>
                <div>Winner paid: 100 × 1.91 = $191.00</div>
                <div>Loser&apos;s stake kept: $100.00</div>
                <div className="font-bold">Book profit: $200.00 − $191.00 = $9.00 (4.5% hold)</div>
              </div>
              <p className="text-xs text-muted-foreground">
                That $9 is the vig. The book doesn&apos;t need to predict the game — it needs balanced
                action. Your class&apos;s live numbers are on the <strong>Class Board</strong> under &quot;The book.&quot;
              </p>
            </CardContent></Card>
          </section>
        </TabsContent>

        {/* ─────────────────────── RACETRACK (hidden) ─────────────────────── */}
        <TabsContent value="racetrack" className="space-y-16">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Racetrack (Pari-mutuel)</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              In a pari-mutuel race, all wagers in each pool are combined. The track takes a small cut, then the
              remaining money is divided among the winning tickets. Your odds aren't fixed — they're determined by
              how everyone else bet.
            </p>
          </div>

          <section className="space-y-8">
            <h3 className="text-xl font-bold text-center">Four Steps to Betting a Race</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Flag, step: "1", title: "Read the Card", body: "Each race has runners with a post position, name, and morning-line odds (the track's opening estimate)." },
                { icon: Shuffle, step: "2", title: "Pick a Pool", body: "Choose Win (1st only), Place (1st or 2nd), or Show (1st, 2nd, or 3rd). Wider pools pay less but win more often." },
                { icon: Coins, step: "3", title: "Place Your Stake", body: "Your stake goes into a shared pool with everyone else's. Indicative odds update as money flows in." },
                { icon: Trophy, step: "4", title: "Collect at the Finish", body: "After the instructor sets the finish order, the pool minus the takeout is split proportionally among winning tickets." },
              ].map((s) => (
                <Card key={s.step}>
                  <CardContent className="p-6 flex gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">Step {s.step}</p>
                      <h4 className="font-semibold text-lg mb-1">{s.title}</h4>
                      <p className="text-sm text-muted-foreground">{s.body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Win, Place, and Show Pools</h3>
              <p className="text-muted-foreground max-w-xl mx-auto">Each pool is separate. A horse can pay in one pool and not the others.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card><CardContent className="p-6 space-y-3 text-center">
                <Trophy className="h-8 w-8 text-warning mx-auto" />
                <h4 className="font-semibold">Win</h4>
                <p className="text-sm text-muted-foreground">Pays only if your horse finishes 1st. Highest reward, highest risk.</p>
              </CardContent></Card>
              <Card><CardContent className="p-6 space-y-3 text-center">
                <Users className="h-8 w-8 text-primary mx-auto" />
                <h4 className="font-semibold">Place</h4>
                <p className="text-sm text-muted-foreground">Pays if your horse finishes 1st <strong>or</strong> 2nd. Pool split between two horses.</p>
              </CardContent></Card>
              <Card><CardContent className="p-6 space-y-3 text-center">
                <CheckCircle className="h-8 w-8 text-success mx-auto" />
                <h4 className="font-semibold">Show</h4>
                <p className="text-sm text-muted-foreground">Pays if your horse finishes 1st, 2nd, <strong>or</strong> 3rd. Lowest payout, best hit rate.</p>
              </CardContent></Card>
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border p-8 md:p-10 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">How Pari-mutuel Payouts Are Calculated</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              For each pool: <strong>distributable pool = total pool × (1 − takeout)</strong>. That distributable amount is then split equally
              across the winning positions, and within each position split proportionally by stake. Your payout per dollar staked equals
              the share given to your horse divided by the total dollars wagered on that horse in that pool.
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
              <div>payout per $1 = (pool × (1 − takeout) / # winning positions) ÷ stake on your horse</div>
              <div>your payout = stake × payout per $1</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Default takeout in this app is <strong>16%</strong>, similar to a real US track. The instructor can change it per race.
            </p>
          </section>

          <section className="space-y-6">
            <div className="text-center space-y-2"><h3 className="text-xl font-bold">Win-Pool Settlement Example</h3></div>
            <Card><CardContent className="p-6 md:p-8">
              <div className="rounded-lg border p-5 space-y-3">
                <h4 className="font-bold text-lg">Race 5: Win Pool</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Setup</p>
                    <div className="font-mono space-y-1">
                      <p>Total Win pool: <strong>$1,000</strong></p>
                      <p>Takeout: <strong>16%</strong></p>
                      <p>Distributable: <strong>$840</strong></p>
                      <p>Bet on #4: <strong>$200</strong> (you bet $20)</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-success/5 border border-success/20 p-4 space-y-2">
                    <p className="font-semibold text-success">If #4 wins ✓</p>
                    <div className="font-mono space-y-1">
                      <p>Per $1: $840 ÷ $200 = <strong>$4.20</strong></p>
                      <p>Your payout: 20 × $4.20 = <strong>$84.00</strong></p>
                      <p className="text-success font-bold">Profit: +$64.00</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">If <strong>no one</strong> bet on the winning horse in a given pool, that pool refunds all stakes (a "no-winner" return).</p>
              </div>
            </CardContent></Card>
          </section>

          <section className="space-y-3">
            <div className="text-center space-y-2"><h3 className="text-xl font-bold">Things to Watch For</h3></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card><CardContent className="p-5 flex gap-3">
                <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Late Money Moves Odds</p>
                  <p className="text-xs text-muted-foreground">A heavy bet just before post time can crash the indicative odds. Watch the pool, not just the morning line.</p>
                </div>
              </CardContent></Card>
              <Card><CardContent className="p-5 flex gap-3">
                <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Scratched Runners Refund</p>
                  <p className="text-xs text-muted-foreground">If a horse is scratched before the race, all stakes on that horse are returned regardless of pool.</p>
                </div>
              </CardContent></Card>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <div className="text-center space-y-4 pt-4 pb-8">
        <h2 className="text-xl font-bold">Ready to start?</h2>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="hero" size="lg" asChild>
            <Link to="/markets">Browse Markets<ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/glossary">Glossary</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
