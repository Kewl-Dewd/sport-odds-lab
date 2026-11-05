import { useMemo } from "react";
import { DollarSign, Briefcase, TrendingUp, TrendingDown, Clock, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarket } from "@/context/MarketContext";
import { useMode, marketMatchesMode, MODE_LABELS } from "@/context/ModeContext";
import { OnboardingModal, useOnboarding } from "@/components/onboarding/OnboardingModal";
import { MarketNewsFeed } from "@/components/student/MarketNewsFeed";
import { ClassActionTicker } from "@/components/student/ClassActionTicker";
import { ReflectionForm } from "@/components/student/ReflectionForm";
import { StudentScoreCard } from "@/components/student/StudentScoreCard";
import { JoinClassCard } from "@/components/student/JoinClassCard";
import { AssignedLearning } from "@/components/learn/AssignedLearning";
import { useActiveClass } from "@/context/ClassContext";
import { useStudentBook, useClassStandings } from "@/hooks/useStudentBook";
import { money, signedMoney } from "@/lib/money";
import { toAmerican } from "@/lib/oddsFormat";

export default function Dashboard() {
  const { portfolio, topMovers, markets, classroom, ethicsSettings } = useMarket();
  const { mode } = useMode();
  const { activeEnrollment, enrollments, isLoading: classesLoading } = useActiveClass();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Real money, read from the same bet records the instructor's book uses.
  const book = useStudentBook();
  const { data: standings = [] } = useClassStandings();
  const myRank = standings.findIndex((s) => s.user_id === portfolio.userId) + 1;

  const modeMarketIds = useMemo(
    () => new Set(mode ? markets.filter((m) => marketMatchesMode(m, mode)).map((m) => m.id) : markets.map((m) => m.id)),
    [markets, mode],
  );
  const scopedMarketTitles = useMemo(() => new Set(markets.filter((m) => modeMarketIds.has(m.id)).map((m) => m.title)), [markets, modeMarketIds]);
  const scopedTopMovers = useMemo(() => topMovers.filter((m) => scopedMarketTitles.has(m.marketTitle)), [topMovers, scopedMarketTitles]);

  const stats = [
    { label: "Bankroll", value: book.enrolled ? money(book.bankroll) : "—", icon: DollarSign, change: null as string | null, sub: "Available cash" },
    { label: "At Risk", value: money(book.atRisk), icon: Briefcase, change: book.netPnl !== 0 ? signedMoney(book.netPnl) : null, sub: "Open wagers" },
    { label: "Active Bets", value: String(book.openBets.length), icon: TrendingUp, change: null as string | null, sub: "Pending settle" },
    { label: "Class Rank", value: myRank > 0 ? `#${myRank}` : "—", icon: GraduationCap, change: null as string | null, sub: "Leaderboard" },
  ];

  return (
    <>
      {showOnboarding && <OnboardingModal onComplete={completeOnboarding} />}
    <div className="container max-w-6xl py-6 md:py-10 space-y-6 md:space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Student Dashboard
            </h1>
            {mode && (
              <span className="rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-xs font-mono font-medium text-foreground">
                {MODE_LABELS[mode]}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-1">
            {activeEnrollment?.klass.name ?? classroom.name} · {portfolio.displayName}
          </p>
        </div>
      </div>

      {!classesLoading && enrollments.length === 0 && <JoinClassCard />}

      {ethicsSettings.enabled && ethicsSettings.studentsAwareOfManipulation && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-600 dark:text-amber-400 font-mono">
          ⚠️ <strong>EXPERIMENT NOTICE:</strong> Classroom running in ethics-research mode. Market prices may reflect coordinated volume or simulated liquidity shifts.
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono tracking-tight text-foreground truncate">{s.value}</div>
            <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
              <span className="text-muted-foreground">{s.sub}</span>
              {s.change && (
                <span className={`font-semibold ${s.change.startsWith("+") ? "price-up" : "price-down"}`}>
                  {s.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Recent Wagers</CardTitle>
              <Link to="/portfolio" className="text-xs font-mono text-emerald-500 dark:text-emerald-400 hover:underline">
                View All →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {book.bets.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center font-mono">
                No active wagers. <Link to="/markets" className="text-emerald-500 dark:text-emerald-400 underline">Check the board</Link> to make your first selection.
              </p>
            ) : (
              <div className="divide-y divide-border/60 font-mono text-xs">
                {book.bets.slice(0, 5).map((b) => {
                  const open = b.status === "open" || b.status === "executed";
                  const net = Number(b.payout ?? 0) - Number(b.stake ?? 0);
                  return (
                    <div key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-foreground truncate font-sans text-xs">{b.market_title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {b.selection}
                          {b.odds_decimal ? ` · ${toAmerican(Number(b.odds_decimal))}` : ""}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5 shrink-0">
                        <span className={`text-[11px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          open
                            ? "bg-muted text-muted-foreground"
                            : net >= 0
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                        }`}>
                          {open ? "OPEN" : b.status}
                        </span>
                        <p className="text-[11px] text-muted-foreground flex items-center justify-end gap-1 pt-1">
                          <Clock className="h-2.5 w-2.5" />{money(b.stake)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold">Top Market Movers</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {scopedTopMovers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center font-mono">Lines will adjust dynamically as trades execute.</p>
            ) : (
              <div className="divide-y divide-border/60 font-mono text-xs">
                {scopedTopMovers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground font-sans text-xs">{m.marketTitle}</p>
                      <p className="text-[11px] text-muted-foreground">{m.outcomeName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{(m.price * 100).toFixed(1)}¢</span>
                      <span className={`flex items-center font-bold ${m.change > 0 ? "price-up" : "price-down"}`}>
                        {m.change > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                        {m.change > 0 ? "+" : ""}{(m.change * 100).toFixed(1)}¢
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <AssignedLearning compact />
      </div>

      <ClassActionTicker />
      <StudentScoreCard />
      <ReflectionForm />
      <MarketNewsFeed />
    </div>
    </>
  );
}
