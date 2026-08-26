import { Link } from "react-router-dom";
import {
  TrendingUp, BarChart3, Users, Trophy, ArrowRight, Zap,
  LineChart, Target, Flag, Calculator, GraduationCap, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const models = [
  {
    icon: LineChart,
    badge: "Prediction Market",
    title: "Bet outcome units",
    description:
      "Buy and sell units on event outcomes. Prices move with supply and demand using a deterministic LMSR or linear-impact market maker — students see how collective belief becomes a price.",
    bullets: ["LMSR & linear-impact engines", "Implied probabilities sum to 100%", "Live order book & price history"],
    accent: "from-primary/15 to-primary/5",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    icon: Target,
    badge: "Sportsbook",
    title: "Wager against fixed odds",
    description:
      "Place stakes against moneyline, spread, and totals lines pulled live from the The Odds API. Odds lock at the moment of acceptance, so students learn how vig and implied probability shape risk.",
    bullets: ["Moneyline · Spread · Totals", "American & decimal odds", "Live lines from The Odds API"],
    accent: "from-success/15 to-success/5",
    iconBg: "bg-success/10 text-success",
  },
  {
    icon: Flag,
    badge: "Racetrack",
    title: "Pari-mutuel pools",
    description:
      "Win, Place, and Show pools where the house never sets the price. Payouts come from the pool itself after takeout — students discover how crowd behavior determines the final odds.",
    bullets: ["Win / Place / Show pools", "Live indicative odds", "Configurable track takeout"],
    accent: "from-accent/15 to-accent/5",
    iconBg: "bg-accent/10 text-accent-foreground",
  },
  {
    icon: Calculator,
    badge: "The book",
    title: "The instructor is the house",
    description:
      "Every class runs like a real sportsbook. The instructor takes the action, carries the liability on open bets, and the class sees the book's handle, payouts, profit and hold percentage.",
    bullets: ["Handle & payouts tracked live", "Open liability on unsettled bets", "Hold % vs. a real book's 4–8%"],
    accent: "from-warning/15 to-warning/5",
    iconBg: "bg-warning/10 text-warning",
  },
  {
    icon: Trophy,
    badge: "Contests",
    title: "Windows, rounds & leaderboards",
    description:
      "Open the book for a weekend, a unit, or a whole semester. Each window has its own bankroll, stake caps and scored leaderboard by profit, ROI or win rate.",
    bullets: ["Weekend or semester windows", "Per-round bankrolls & caps", "Profit / ROI / wins scoring"],
    accent: "from-accent/15 to-accent/5",
    iconBg: "bg-accent/10 text-accent-foreground",
  },
];


const features = [
  {
    icon: Calculator,
    title: "Math-driven, no luck",
    description: "Every price comes from a transparent formula students can study, not a black box.",
  },
  {
    icon: GraduationCap,
    title: "Classroom ready",
    description: "Manage students, run experiments, and reset between units or semesters.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & virtual",
    description: "Virtual currency, instructor controls, and full activity tracking — zero financial risk.",
  },
  {
    icon: Trophy,
    title: "Compete & debrief",
    description: "Leaderboards, P&L, behavioral analytics and post-experiment debriefs built in.",
  },
];

// Prediction-market and racetrack models are hidden for now (sportsbook-only focus).
// Keep them in `models` so they can be re-enabled later.
const visibleModels = models.filter((m) => m.badge === "Sportsbook" || m.badge === "The book" || m.badge === "Contests");

export default function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="badge-live mx-auto w-fit">
              <Zap className="h-3 w-3" />
              Live odds · One classroom
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Learn Markets by{" "}
              <span className="text-gradient">Running a Sportsbook</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              A classroom sportsbook that runs on live moneyline, spread and totals odds.
              Your instructor runs the book, students wager virtual cash, and everyone
              sees the house&apos;s numbers. Real strategy, zero risk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?tab=signup">
                  Start Betting <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* Three market models */}
      <section className="container py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">Run a real book in your classroom</h2>
          <p className="text-muted-foreground">
            Instructors publish the games, set the betting windows, and take the action.
            Students bet the lines and watch the house&apos;s hold add up in real time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {visibleModels.map((m) => (
            <div
              key={m.badge}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${m.accent} p-6 space-y-4`}
            >
              <div className="flex items-center gap-2">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${m.iconBg}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.badge}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.description}</p>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-foreground/50" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Platform features */}
      <section className="container py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="stat-card space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it flows */}
      <section className="container py-12 md:py-16">
        <div className="rounded-2xl border p-8 md:p-10 bg-card">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">1</span>
                <h4 className="font-semibold">Instructor opens the board</h4>
              </div>
              <p className="text-muted-foreground">
                Pick the games, pull live moneyline, spread and totals lines from the odds API,
                set the betting window and stake limits.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">2</span>
                <h4 className="font-semibold">Students place their bets</h4>
              </div>
              <p className="text-muted-foreground">
                Each student stakes their virtual bankroll on the posted lines. Odds lock the
                moment a bet is accepted, so they learn how vig and price shape risk.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">3</span>
                <h4 className="font-semibold">Settle and debrief</h4>
              </div>
              <p className="text-muted-foreground">
                The instructor settles the results; the platform pays out winners and shows the
                book&apos;s handle, hold and the class leaderboard.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border p-8 md:p-12 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to open the book?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Join your classroom, bet the board your instructor posts, and see how your bankroll
            stacks up against the house and your classmates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth?tab=signup">Create Free Account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/how-it-works">See How Betting Works</Link>
            </Button>

          </div>
        </div>
      </section>
    </div>
  );
}
