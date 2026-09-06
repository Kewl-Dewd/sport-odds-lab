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
import { AssignedLearning } from "@/components/learn/AssignedLearning";
import { useActiveClass } from "@/context/ClassContext";
import { useStudentBook, useClassStandings } from "@/hooks/useStudentBook";
import { money, signedMoney } from "@/lib/money";
import { toAmerican } from "@/lib/oddsFormat";

export default function Dashboard() {
  const { portfolio, topMovers, markets, classroom, ethicsSettings } = useMarket();
  const { mode } = useMode();
  const { activeEnrollment } = useActiveClass();
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
    { label: "Bankroll", value: money(book.bankroll), icon: DollarSign, change: null as string | null },
    { label: "At Risk", value: money(book.atRisk), icon: Briefcase, change: book.netPnl !== 0 ? signedMoney(book.netPnl) : null },
    { label: "Open Bets", value: String(book.openBets.length), icon: TrendingUp, change: null as string | null },
    { label: "Class Rank", value: myRank > 0 ? `#${myRank}` : "—", icon: GraduationCap, change: null as string | null },
  ];

  return (
    <>
      {showOnboarding && <OnboardingModal onComplete={completeOnboarding} />}
    <div className="container py-5 md:py-8 space-y-6 md:space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard {mode && <span className="text-base font-normal text-muted-foreground">· {MODE_LABELS[mode]}</span>}</h1>
        <p className="text-muted-foreground">{activeEnrollment?.klass.name ?? classroom.name} · {portfolio.displayName}</p>
      </div>

      {ethicsSettings.enabled && ethicsSettings.studentsAwareOfManipulation && (
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm">
          ⚠️ <strong>Experiment notice:</strong> This classroom is running in
          ethics-research mode. Betting patterns you see may include rumors,
          coordinated action, or large one-sided bets by other students.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between gap-2 mb-1.5 md:mb-2">
              <span className="text-xs md:text-sm text-muted-foreground leading-tight">{s.label}</span>
              <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="text-lg md:text-2xl font-bold font-mono truncate">{s.value}</div>
            {s.change && <span className={`text-xs md:text-sm font-medium ${s.change.startsWith("+") ? "price-up" : "price-down"}`}>{s.change}</span>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Bets</CardTitle></CardHeader>
          <CardContent>
            {scopedRecentTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No bets yet. <Link to="/markets" className="text-primary underline">Check the board</Link> to place your first bet.
              </p>
            ) : (
              <div className="space-y-3">
                {scopedRecentTrades.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{t.marketTitle}</p>
                      <p className="text-xs text-muted-foreground">{t.outcomeName}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className={`text-sm font-semibold ${t.type === "BUY" ? "price-up" : "price-down"}`}>
                        {t.type} {t.quantity} @ {(t.pricePerShare * 100).toFixed(1)}¢
                      </span>
                      <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />${t.totalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Top Movers</CardTitle></CardHeader>
          <CardContent>
            {scopedTopMovers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Lines will move as bets are placed.</p>
            ) : (
              <div className="space-y-3">
                {scopedTopMovers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{m.marketTitle}</p>
                      <p className="text-xs text-muted-foreground">{m.outcomeName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold">{(m.price * 100).toFixed(1)}¢</span>
                      <span className={`flex items-center text-sm font-medium ${m.change > 0 ? "price-up" : "price-down"}`}>
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
