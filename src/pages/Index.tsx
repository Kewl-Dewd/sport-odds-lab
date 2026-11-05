import { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, BarChart3, Users, Trophy, ArrowRight, Zap,
  LineChart, Target, Flag, Calculator, GraduationCap, ShieldCheck,
  Activity, CheckCircle2, ChevronRight, Layers, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const models = [
  {
    icon: LineChart,
    badge: "Prediction Market",
    code: "MOD-01",
    title: "Bet outcome units",
    description:
      "Buy and sell units on event outcomes. Prices move with supply and demand using a deterministic LMSR or linear-impact market maker — students see how collective belief becomes a price.",
    bullets: ["LMSR & linear-impact engines", "Implied probabilities sum to 100%", "Live order book & price history"],
    accent: "border-emerald-500/30 bg-emerald-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-500",
  },
  {
    icon: Target,
    badge: "Sportsbook",
    code: "MOD-02",
    title: "Wager against fixed odds",
    description:
      "Place stakes against moneyline, spread, and totals lines pulled live from The Odds API. Odds lock at the moment of acceptance, so students learn how vig and implied probability shape risk.",
    bullets: ["Moneyline · Spread · Totals", "American & decimal odds", "Live lines from The Odds API"],
    accent: "border-primary/40 bg-primary/5",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    icon: Flag,
    badge: "Racetrack",
    code: "MOD-03",
    title: "Pari-mutuel pools",
    description:
      "Win, Place, and Show pools where the house never sets the price. Payouts come from the pool itself after takeout — students discover how crowd behavior determines the final odds.",
    bullets: ["Win / Place / Show pools", "Live indicative odds", "Configurable track takeout"],
    accent: "border-amber-500/30 bg-amber-500/5",
    iconBg: "bg-amber-500/10 text-amber-500",
  },
  {
    icon: Calculator,
    badge: "The book",
    code: "MOD-04",
    title: "The instructor is the house",
    description:
      "Every class runs like a real sportsbook. The instructor takes the action, carries the liability on open bets, and the class sees the book's handle, payouts, profit and hold percentage.",
    bullets: ["Handle & payouts tracked live", "Open liability on unsettled bets", "Hold % vs. a real book's 4–8%"],
    accent: "border-sky-500/30 bg-sky-500/5",
    iconBg: "bg-sky-500/10 text-sky-500",
  },
  {
    icon: Trophy,
    badge: "Contests",
    code: "MOD-05",
    title: "Windows, rounds & leaderboards",
    description:
      "Open the book for a weekend, a unit, or a whole semester. Each window has its own bankroll, stake caps and scored leaderboard by profit, ROI or win rate.",
    bullets: ["Weekend or semester windows", "Per-round bankrolls & caps", "Profit / ROI / wins scoring"],
    accent: "border-indigo-500/30 bg-indigo-500/5",
    iconBg: "bg-indigo-500/10 text-indigo-500",
  },
];

const features = [
  {
    icon: Calculator,
    title: "Transparent pricing",
    tag: "MATH",
    description: "Every price comes from a transparent formula that students can study, verify, and simulate.",
  },
  {
    icon: GraduationCap,
    title: "Classroom ready",
    tag: "CURRICULUM",
    description: "Easily manage students, run controlled behavioral experiments, and reset between semesters.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & virtual",
    tag: "ZERO RISK",
    description: "Virtual currency, instructor controls, and full activity tracking — zero real money wagered.",
  },
  {
    icon: Trophy,
    title: "Compete & debrief",
    tag: "ANALYTICS",
    description: "Leaderboards, P&L attribution, behavioral analytics, and post-experiment debriefs built in.",
  },
];

const visibleModels = models.filter((m) => m.badge === "Sportsbook" || m.badge === "The book" || m.badge === "Contests");

const TICKER_ITEMS = [
  { league: "NBA", match: "BOS Celtics -140", opp: "NY Knicks +120", vig: "4.1%" },
  { league: "NFL", match: "KC Chiefs -3.5 (-110)", opp: "SF 49ers +3.5 (-110)", vig: "4.7%" },
  { league: "EPL", match: "Man City -175", opp: "Real Madrid +220", vig: "4.4%" },
  { league: "MLB", match: "LAD Dodgers -160", opp: "NY Yankees +135", vig: "4.3%" },
  { league: "METRICS", match: "Classroom Hold: 5.2%", opp: "Simulated Handle: $428,500", vig: "ACTIVE" },
];

export default function Index() {
  const [selectedDemoOutcome, setSelectedDemoOutcome] = useState<"away" | "home">("home");
  const demoStake = 100;
  const demoOdds = selectedDemoOutcome === "away" ? -140 : 120;
  const demoImplied = selectedDemoOutcome === "away" ? 58.3 : 45.5;
  const demoProfit = selectedDemoOutcome === "away" ? Math.round((demoStake / 140) * 100) : Math.round((demoStake * 120) / 100);

  return (
    <div className="relative">
      {/* Precision Ticker Strip */}
      <div className="border-b border-border/70 bg-card/60 backdrop-blur-sm overflow-hidden py-2 select-none">
        <div className="flex items-center gap-8 animate-ticker whitespace-nowrap text-xs font-mono">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {item.league}
              </span>
              <span className="font-medium text-foreground">{item.match}</span>
              <span className="text-muted-foreground/60">vs</span>
              <span className="font-medium text-foreground">{item.opp}</span>
              <span className="text-[10px] text-emerald-500 font-semibold dark:text-emerald-400">vig: {item.vig}</span>
              <span className="text-border mx-2">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-grid-pattern hero-glow py-16 md:py-24 border-b border-border/60">
        <div className="container relative max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE ODDS ENGINE · CLASSROOM SPORTSBOOK SIMULATOR
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                See How Sports Markets <span className="text-gradient-emerald">Really Work</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                A classroom simulation for studying how sportsbook prices are set, testing
                forecasts against live odds feeds, and discovering why the house edge wins over time.
                Zero real money wagered.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="hero" size="lg" asChild className="h-11 px-6">
                  <Link to="/auth?tab=signup" className="flex items-center gap-2">
                    Start Learning <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-11 px-6 font-medium">
                  <Link to="/how-it-works">How Betting Works</Link>
                </Button>
                <Button variant="ghost" size="lg" asChild className="h-11 px-4 text-muted-foreground hover:text-foreground">
                  <Link to="/instructors">For Instructors →</Link>
                </Button>
              </div>

              {/* Trust & Proof points */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60 text-xs font-mono">
                <div>
                  <div className="text-base sm:text-lg font-bold text-foreground">100%</div>
                  <div className="text-muted-foreground">Virtual Funds</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-emerald-500 dark:text-emerald-400">LIVE</div>
                  <div className="text-muted-foreground">The Odds API Feed</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-foreground">4–8%</div>
                  <div className="text-muted-foreground">Real-World Vig / Hold</div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Terminal Preview Widget */}
            <div className="lg:col-span-5">
              <div className="relative rounded-xl border border-border/80 bg-card p-5 shadow-terminal-hover transition-all duration-300">
                
                {/* Terminal Title Bar */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/80 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground font-medium">TERMINAL PREVIEW // SIM-01</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-500 dark:text-emerald-400 font-semibold">
                    <Activity className="h-3 w-3" /> FEED SYNCED
                  </span>
                </div>

                {/* Matchup Header */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>NBA REGULAR SEASON</span>
                    <span>TODAY · 7:30 PM EST</span>
                  </div>
                  <div className="text-base font-semibold text-foreground flex items-center justify-between">
                    <span>Boston Celtics @ New York Knicks</span>
                    <Badge variant="outline" className="text-[10px] font-mono">MONEYLINE</Badge>
                  </div>
                </div>

                {/* Interactive Odds Cells */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <button
                    onClick={() => setSelectedDemoOutcome("away")}
                    className={`rounded-lg border p-3 text-left transition-all duration-150 ${
                      selectedDemoOutcome === "away"
                        ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                        : "border-border/80 bg-muted/40 hover:border-border hover:bg-muted/70"
                    }`}
                  >
                    <div className="text-xs text-muted-foreground font-medium">Boston (Away)</div>
                    <div className="text-xl font-bold font-mono tracking-tight text-foreground mt-0.5">-140</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-1">58.3% implied</div>
                  </button>

                  <button
                    onClick={() => setSelectedDemoOutcome("home")}
                    className={`rounded-lg border p-3 text-left transition-all duration-150 ${
                      selectedDemoOutcome === "home"
                        ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                        : "border-border/80 bg-muted/40 hover:border-border hover:bg-muted/70"
                    }`}
                  >
                    <div className="text-xs text-muted-foreground font-medium">New York (Home)</div>
                    <div className="text-xl font-bold font-mono tracking-tight text-foreground mt-0.5">+120</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-1">45.5% implied</div>
                  </button>
                </div>

                {/* Live Math / Payout Simulator Box */}
                <div className="rounded-lg border border-border/80 bg-background/80 p-3.5 space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Virtual Stake:</span>
                    <span className="font-semibold text-foreground">${demoStake}.00</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Selection:</span>
                    <span className="font-semibold text-foreground">
                      {selectedDemoOutcome === "away" ? "BOS Celtics (-140)" : "NY Knicks (+120)"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Potential Profit:</span>
                    <span className="font-semibold text-emerald-500 dark:text-emerald-400 font-bold text-sm">
                      +${demoProfit}.00
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border/60 flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Market Overround (Vig):</span>
                    <span className="font-semibold text-amber-500 dark:text-amber-400">3.8% House Advantage</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>TAP CELLS TO COMPARE ODDS</span>
                  <Link to="/markets" className="text-emerald-500 dark:text-emerald-400 hover:underline flex items-center gap-1 font-sans">
                    View Live Board <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Three Market Models (Precision Grid) */}
      <section className="container max-w-6xl py-16 md:py-20">
        <div className="text-left md:text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-emerald-500" /> SIMULATION ENGINES
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
            Study How a Book Operates in Real Time
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Instructors publish games, configure betting windows, and hold the book&apos;s risk.
            Students wager virtual stakes and analyze why the math guarantees the house edge.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {visibleModels.map((m) => (
            <div
              key={m.badge}
              className={`relative overflow-hidden rounded-xl border ${m.accent} p-6 space-y-4 shadow-terminal-card hover:shadow-terminal-hover transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className={`h-9 w-9 rounded-md flex items-center justify-center ${m.iconBg}`}>
                  <m.icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {m.code}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold tracking-tight text-foreground">{m.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{m.description}</p>
              </div>

              <div className="pt-2 border-t border-border/60">
                <ul className="space-y-2 text-xs font-mono text-muted-foreground">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="border-y border-border/60 bg-muted/20 py-16 md:py-20">
        <div className="container max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="stat-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-md bg-muted/80 border border-border/80 flex items-center justify-center text-foreground">
                    <f.icon className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase px-1.5 py-0.5 rounded border border-border/60 bg-background">
                    {f.tag}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teaching & Debrief Flow */}
      <section className="container max-w-6xl py-16 md:py-20">
        <div className="rounded-xl border border-border/80 p-6 md:p-10 bg-card shadow-terminal-card">
          <div className="mb-8">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-500 font-semibold">
              EXECUTION PIPELINE
            </span>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mt-1">
              From Opening Line to Settled P&L
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2.5 p-4 rounded-lg bg-muted/30 border border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs">
                  01
                </span>
                <h4 className="font-semibold text-foreground text-sm">Instructor Opens the Board</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select target leagues, ingest real-time lines from The Odds API, set wagering windows, and enforce bankroll limits.
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-lg bg-muted/30 border border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs">
                  02
                </span>
                <h4 className="font-semibold text-foreground text-sm">Students Place Stakes</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Students allocate virtual currency on moneyline, spread, and totals. Odds lock at acceptance to expose implied probabilities.
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-lg bg-muted/30 border border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs">
                  03
                </span>
                <h4 className="font-semibold text-foreground text-sm">Settle and Debrief</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Games settle automatically or by instructor action. The platform pays winners and displays book handle, hold %, and behavioral stats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* High-Impact Institutional CTA */}
      <section className="container max-w-6xl pb-20">
        <div className="rounded-xl border border-emerald-500/30 bg-card p-8 md:p-12 text-center space-y-5 shadow-terminal-hover relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-500">
            <Sparkles className="h-3.5 w-3.5" /> READY FOR CLASSROOM SIMULATION
          </div>

          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground max-w-xl mx-auto">
            Ready to Open the Classroom Book?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Join your class, test your predictive forecasting against live market prices, and examine how sportsbook economics play out in practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button variant="hero" size="lg" asChild className="h-11 px-8">
              <Link to="/auth?tab=signup">Create Student Account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-11 px-6">
              <Link to="/how-it-works">See How Betting Works</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
