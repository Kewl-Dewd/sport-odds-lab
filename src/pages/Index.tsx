import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  FileSpreadsheet,
  FlaskConical,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

const tickerItems = [
  "REAL MARKET ODDS",
  "VIRTUAL STAKES",
  "FORECAST FIRST",
  "15-WEEK COURSE",
  "ZERO REAL MONEY WAGERED",
];

const coursePrinciples = [
  {
    number: "01",
    icon: Target,
    title: "Forecast before you position.",
    text: "Students state their own win probability, then compare it with the market price, the no-vig probability, and expected value.",
    note: "Analysis over outcomes",
  },
  {
    number: "02",
    icon: LineChart,
    title: "Follow the price, not the hype.",
    text: "Opening and closing lines turn every position into a lesson about price, timing, closing line value, and the cost of the vig.",
    note: "Real odds, locked prices",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Grade the thinking.",
    text: "Brier scores, calibration, journal completion, and reflections reward sound reasoning—not a lucky weekend of winners.",
    note: "Evidence over profit",
  },
];

const workflow = [
  {
    number: "01",
    label: "Set the table",
    title: "Build your classbook.",
    text: "Choose a ready-made course plan, publish the leagues you want, set the betting window, and invite students with your class code.",
  },
  {
    number: "02",
    label: "Make a case",
    title: "Put a forecast on record.",
    text: "Students read live prices, write down their estimated probability, and use virtual dollars to test their reasoning against the market.",
  },
  {
    number: "03",
    label: "Look closer",
    title: "Debrief what happened.",
    text: "Explore calibration, closing line value, book hold, and variance together. Export grades and reflections when the module is complete.",
  },
];

export default function Index() {
  const [selectedDemoOutcome, setSelectedDemoOutcome] = useState<"away" | "home">("away");
  const demoStake = 100;
  const demoOdds = selectedDemoOutcome === "away" ? -140 : 120;
  const demoNoVig = selectedDemoOutcome === "away" ? 56.2 : 43.8;
  const demoProfit = selectedDemoOutcome === "away" ? 71 : 120;
  const demoVig = 3.8;

  return (
    <div className="landing-page overflow-hidden bg-background text-foreground">
      <div className="border-b border-primary-foreground/10 bg-primary text-primary-foreground">
        <div className="landing-ticker flex w-max items-center py-2.5" aria-label="Course features">
          {[0, 1].map((group) => (
            <div key={group} className="flex items-center" aria-hidden={group === 1}>
              {tickerItems.map((item) => (
                <div key={`${group}-${item}`} className="flex items-center">
                  <span className="px-7 font-mono text-[10px] font-semibold tracking-[0.18em] sm:px-10 sm:text-[11px]">
                    {item}
                  </span>
                  <Sparkles className="h-3 w-3 text-accent" strokeWidth={1.8} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="paper-grain relative border-b border-border">
        <div className="pointer-events-none absolute right-[8%] top-16 hidden h-24 w-24 rounded-full border border-foreground/10 xl:block" />
        <div className="container relative max-w-[1440px] px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-8">
            <div className="relative z-10 lg:col-span-7">
              <div className="mb-8 flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-foreground/20 bg-card px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] shadow-sm sm:text-[11px]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  The classroom sportsbook is open
                </div>
                <span className="hidden font-editorial text-lg italic text-muted-foreground sm:inline">
                  A different kind of field study.
                </span>
              </div>

              <h1 className="max-w-[900px] font-display text-[clamp(3.55rem,8.2vw,8.4rem)] font-semibold leading-[0.95] tracking-[-0.065em] text-foreground">
                Don’t just pick<br />
                a winner. Read<br />
                the <span className="font-editorial font-normal italic tracking-[-0.045em] text-primary">market.</span>
              </h1>

              <div className="mt-9 grid max-w-2xl gap-7 sm:grid-cols-[1fr_auto] sm:items-end">
                <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                  A course-in-a-box for studying sportsbook prices, testing forecasts against real odds, and discovering why the house edge endures.
                  <strong className="font-medium text-foreground"> Real markets. Virtual money. Better questions.</strong>
                </p>
                <ArrowDownRight className="hidden h-12 w-12 text-accent sm:block" strokeWidth={1.25} />
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/auth?tab=signup"
                  className="group inline-flex h-13 items-center justify-center gap-5 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-[0_10px_25px_-16px_hsl(var(--foreground)/0.7)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Start learning
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  to="/instructors"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/25 bg-transparent px-7 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Explore the instructor kit
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-foreground/15 pt-5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">
                <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-accent" /> 15-week curriculum</span>
                <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-accent" /> Instructor controls</span>
                <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-accent" /> No real-money wagering</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[480px] lg:col-span-5 lg:mx-0 lg:ml-auto">
              <div className="relative">
                <div className="absolute -left-3 -top-5 z-20 -rotate-6 border border-primary bg-accent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-accent-foreground shadow-[3px_4px_0_hsl(var(--primary))] sm:-left-8">
                  Interactive field note
                </div>
                <div className="absolute -bottom-5 -right-2 z-20 rotate-3 rounded-full border border-foreground/20 bg-card px-4 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] shadow-md sm:-right-5 sm:text-[10px]">
                  $100 virtual stake
                </div>

                <div className="landing-paper-card relative rotate-[1.5deg] border border-foreground/25 bg-card px-5 pb-5 pt-8 shadow-[0_30px_70px_-42px_hsl(var(--foreground)/0.65),6px_7px_0_hsl(var(--foreground)/0.08)] sm:p-7">
                  <div className="flex items-start justify-between border-b border-foreground/20 pb-5">
                    <div>
                      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Market study / No. 001</div>
                      <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">What is the price saying?</h2>
                    </div>
                    <FlaskConical className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.5} />
                  </div>

                  <div className="py-5">
                    <div className="mb-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground sm:text-[10px]">
                      <span>NBA Regular Season</span>
                      <span>Today · 7:30 PM EST</span>
                    </div>
                    <div className="mb-4 flex flex-col items-start gap-2 border-b border-foreground/10 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="font-display text-lg font-semibold tracking-[-0.03em] sm:text-xl">
                        Boston Celtics <span className="font-editorial text-base font-normal italic text-muted-foreground">@</span> New York Knicks
                      </span>
                      <span className="shrink-0 border border-foreground/25 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Moneyline
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        aria-pressed={selectedDemoOutcome === "away"}
                        onClick={() => setSelectedDemoOutcome("away")}
                        className={`group border p-4 text-left transition-all ${
                          selectedDemoOutcome === "away"
                            ? "border-primary bg-primary text-primary-foreground shadow-[3px_4px_0_hsl(var(--accent))]"
                            : "border-foreground/20 bg-background hover:border-primary"
                        }`}
                      >
                        <span className={`block text-xs font-medium ${selectedDemoOutcome === "away" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Boston (Away)</span>
                        <span className="mt-2 block font-display text-4xl font-semibold tracking-[-0.05em]">−140</span>
                        <span className={`mt-2 block font-mono text-[9px] uppercase tracking-wider ${selectedDemoOutcome === "away" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>58.3% implied</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={selectedDemoOutcome === "home"}
                        onClick={() => setSelectedDemoOutcome("home")}
                        className={`group border p-4 text-left transition-all ${
                          selectedDemoOutcome === "home"
                            ? "border-primary bg-primary text-primary-foreground shadow-[3px_4px_0_hsl(var(--accent))]"
                            : "border-foreground/20 bg-background hover:border-primary"
                        }`}
                      >
                        <span className={`block text-xs font-medium ${selectedDemoOutcome === "home" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>New York (Home)</span>
                        <span className="mt-2 block font-display text-4xl font-semibold tracking-[-0.05em]">+120</span>
                        <span className={`mt-2 block font-mono text-[9px] uppercase tracking-wider ${selectedDemoOutcome === "home" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>45.5% implied</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-y border-foreground/20 py-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-editorial text-xl italic">Read between the lines</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{demoOdds > 0 ? "+" : ""}{demoOdds}</span>
                    </div>
                    <dl className="space-y-3 font-mono text-[11px]">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">Selection</dt>
                        <dd className="font-semibold text-foreground">{selectedDemoOutcome === "away" ? "BOS Celtics (−140)" : "NY Knicks (+120)"}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">Virtual stake</dt>
                        <dd className="font-semibold text-foreground">${demoStake}.00</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">No-vig probability</dt>
                        <dd className="font-semibold text-foreground">{demoNoVig}%</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">Potential profit</dt>
                        <dd className="font-semibold text-foreground">+${demoProfit}.00</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex items-end justify-between gap-4 pt-5">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Built into both prices</div>
                      <div className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">{demoVig}% <span className="font-editorial text-xl font-normal italic">vig</span></div>
                    </div>
                    <Link to="/how-it-works" className="group inline-flex items-center gap-1.5 border-b border-accent pb-1 text-xs font-semibold text-primary">
                      Unpack the math <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>

              <p className="mt-16 text-center font-editorial text-xl italic text-muted-foreground">
                “The price is never just a price.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="container max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="mb-5 flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                <Circle className="h-2 w-2 fill-accent text-accent" /> A better scorecard
              </div>
              <h2 className="max-w-4xl font-display text-[clamp(2.7rem,5.2vw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
                Reward the analysis.<br />
                <span className="font-editorial font-normal italic text-primary">Not the lucky bounce.</span>
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-muted-foreground lg:col-span-4 lg:pb-2">
              A winning pick can still be a bad decision. Sports Market Lab gives students the tools to explain their thinking—and instructors the evidence to grade it.
            </p>
          </div>

          <div className="mt-14 grid border-y border-foreground/20 md:grid-cols-3">
            {coursePrinciples.map((principle, index) => (
              <article
                key={principle.number}
                className={`group relative py-8 md:px-7 md:py-10 lg:px-10 ${index > 0 ? "border-t border-foreground/20 md:border-l md:border-t-0" : ""} ${index === 0 ? "md:pl-0" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-editorial text-3xl italic text-accent">{principle.number}</span>
                  <principle.icon className="h-5 w-5 text-primary transition-transform group-hover:-rotate-6" strokeWidth={1.5} />
                </div>
                <h3 className="mt-10 max-w-xs font-display text-2xl font-semibold leading-tight tracking-[-0.035em]">{principle.title}</h3>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{principle.text}</p>
                <div className="mt-8 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">{principle.note}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="container max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-5 lg:grid-cols-12">
            <article className="relative overflow-hidden border border-primary bg-primary p-7 text-primary-foreground sm:p-10 lg:col-span-7 lg:min-h-[510px] lg:p-12">
              <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full border border-primary-foreground/10" />
              <div className="absolute -bottom-10 -right-2 h-48 w-48 rounded-full border border-primary-foreground/10" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.17em] text-primary-foreground/70">For instructors</span>
                  <GraduationCap className="h-6 w-6 text-accent" strokeWidth={1.5} />
                </div>
                <h2 className="mt-16 max-w-xl font-display text-[clamp(2.5rem,4.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-primary-foreground">
                  Your class.<br />Your sportsbook.<br /><span className="font-editorial font-normal italic text-accent">Your lesson plan.</span>
                </h2>
                <p className="mt-7 max-w-lg text-sm leading-7 text-primary-foreground/75 sm:text-base">
                  Run a weekend market study or a full fifteen-week course. Publish leagues, control betting windows, assign lessons, and see both student reasoning and the book’s economics.
                </p>
                <div className="mt-auto pt-10">
                  <Link to="/instructors" className="group inline-flex items-center gap-3 border-b border-accent pb-2 text-sm font-semibold text-primary-foreground">
                    See the ready-to-teach course kit <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>

            <div className="grid gap-5 lg:col-span-5">
              <article className="relative border border-foreground/25 bg-accent p-7 shadow-[5px_6px_0_hsl(var(--foreground)/0.09)] sm:p-9 lg:flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground/70">Course-in-a-box</span>
                  <BookOpen className="h-5 w-5 text-accent-foreground" strokeWidth={1.5} />
                </div>
                <div className="mt-8 flex items-end gap-3">
                  <span className="font-display text-7xl font-semibold leading-none tracking-[-0.07em] text-accent-foreground sm:text-8xl">15</span>
                  <span className="pb-1 font-editorial text-2xl italic text-accent-foreground">weeks,<br />ready to teach.</span>
                </div>
                <p className="mt-6 max-w-md text-sm leading-6 text-accent-foreground/80">
                  Objectives, lessons, app tasks, quizzes, reflections, slide outlines, rubrics, and answer keys—all organized into seven teachable modules.
                </p>
              </article>

              <article className="border border-foreground/25 bg-card p-7 shadow-[5px_6px_0_hsl(var(--foreground)/0.07)] sm:p-9 lg:flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Less admin, more teaching</span>
                  <FileSpreadsheet className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <ul className="mt-7 space-y-4">
                  {["Quick class setup with a custom join code", "Gradebook export for Moodle, Canvas, or D2L", "Responsible-play lessons before the first position"].map((item) => (
                    <li key={item} className="flex gap-3 border-b border-foreground/10 pb-4 text-sm leading-6 last:border-0 last:pb-0">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="container max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">From line to learning</span>
                <h2 className="mt-5 font-display text-[clamp(2.8rem,4.5vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
                  One market.<br />Three acts of<br /><span className="font-editorial font-normal italic text-primary">discovery.</span>
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
                  The simulation is the laboratory. The real learning happens when students make their reasoning visible and revisit it.
                </p>
              </div>
            </div>
            <div className="lg:col-span-8">
              {workflow.map((step) => (
                <article key={step.number} className="grid gap-5 border-t border-foreground/20 py-8 first:pt-0 sm:grid-cols-[70px_1fr] sm:py-10 lg:grid-cols-[90px_1fr]">
                  <span className="font-editorial text-4xl italic text-accent">{step.number}</span>
                  <div>
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{step.label}</span>
                    <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{step.title}</h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="paper-grain relative bg-background">
        <div className="container relative max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="relative border border-foreground/25 bg-card px-6 py-12 shadow-[8px_9px_0_hsl(var(--foreground)/0.08)] sm:px-10 lg:px-16 lg:py-16">
            <div className="absolute -right-3 -top-4 rotate-3 bg-accent px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent-foreground shadow-[3px_3px_0_hsl(var(--primary))] sm:-right-5">
              Office hours optional. Curiosity required.
            </div>
            <div className="grid items-end gap-10 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="mb-6 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Educational by design
                </div>
                <h2 className="font-display text-[clamp(2.8rem,5.8vw,6.2rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
                  Bring the market<br />into your <span className="font-editorial font-normal italic text-primary">classroom.</span>
                </h2>
              </div>
              <div className="lg:col-span-4">
                <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
                  Join a class with your instructor’s code, or build a complete course around real prices and virtual stakes.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <Link to="/auth?tab=signup" className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
                    Start learning <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link to="/how-it-works" className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/25 px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-background">
                    How it works
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
