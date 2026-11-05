import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Clock, BarChart3, TrendingUp, TrendingDown,
  Activity, Users as UsersIcon, Gauge, ArrowUpDown, Settings2,
  Droplets, Zap, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/context/MarketContext";
import { useEducation } from "@/context/EducationContext";
import { NUDGE_CONTENT } from "@/components/education/LearningNudges";
import { ConceptTooltip, CONCEPTS } from "@/components/ui/concept-tooltip";
import { TradeTicketModal } from "@/components/trading/TradeTicketModal";
import { EducationalSidebar } from "@/components/education/EducationalPanels";
import { PriceHistoryChart, VolumeChart, PressureIndicator } from "@/components/charts/AnalyticsCharts";
import { ReferenceOddsCard } from "@/components/markets/ReferenceOddsCard";
import { LiveSourceBadge } from "@/components/markets/LiveSourceBadge";
import { SportsbookTab } from "@/components/markets/SportsbookTab";
import { RacetrackTab } from "@/components/markets/RacetrackTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketDebrief } from "@/components/student/MarketDebrief";
import { BehavioralFraming } from "@/components/student/BehavioralFraming";
import { MarketNewsFeed, BreakingNewsBanner } from "@/components/student/MarketNewsFeed";
import { buildPriceHistory, calculateMarketAnalytics } from "@/lib/marketAnalytics";
import { cn } from "@/lib/utils";
import { toAmerican } from "@/lib/oddsFormat";

type OutcomeSort = "price-desc" | "price-asc" | "name" | "change";

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const { getMarket, getHolding, trades, ethicsSettings } = useMarket();
  const { educationEnabled, mode, pushNudge } = useEducation();
  const market = getMarket(id ?? "");

  const [tradeModal, setTradeModal] = useState<{
    open: boolean;
    outcomeId: string;
    outcomeName: string;
    type: "BUY" | "SELL";
  }>({ open: false, outcomeId: "", outcomeName: "", type: "BUY" });

  const [outcomeSort, setOutcomeSort] = useState<OutcomeSort>("price-desc");

  const priceHistory = useMemo(
    () => (market ? buildPriceHistory(market, trades) : []),
    [market, trades]
  );

  const analytics = useMemo(
    () => (market ? calculateMarketAnalytics(market, trades) : null),
    [market, trades]
  );

  const sortedOutcomes = useMemo(() => {
    if (!market) return [];
    const items = [...market.outcomes];
    switch (outcomeSort) {
      case "price-desc": return items.sort((a, b) => b.price - a.price);
      case "price-asc": return items.sort((a, b) => a.price - b.price);
      case "name": return items.sort((a, b) => a.name.localeCompare(b.name));
      case "change": {
        return items.sort((a, b) => {
          const aChange = analytics?.outcomeAnalytics.find((oa) => oa.outcomeId === a.id)?.priceChange ?? 0;
          const bChange = analytics?.outcomeAnalytics.find((oa) => oa.outcomeId === b.id)?.priceChange ?? 0;
          return Math.abs(bChange) - Math.abs(aChange);
        });
      }
      default: return items;
    }
  }, [market, outcomeSort, analytics]);

  if (!market) {
    return (
      <div className="container py-16 text-center font-mono">
        <p className="text-sm text-muted-foreground">Market reference not found.</p>
        <Link to="/markets" className="text-emerald-500 hover:underline text-xs mt-2 inline-block">
          ← Return to Board
        </Link>
      </div>
    );
  }

  const marketTrades = trades.filter((t) => t.marketId === market.id).slice(0, 15);
  const isOpen = market.status === "open";
  const firstOutcome = market.outcomes[0];
  const isMulti = market.outcomes.length > 2;
  const priceSum = market.outcomes.reduce((s, o) => s + o.price, 0);

  const statusBadge = () => {
    switch (market.status) {
      case "open":
        return (
          <span className="badge-live">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            OPEN
          </span>
        );
      case "suspended": return <span className="badge-upcoming">SUSPENDED</span>;
      case "settled": return <span className="badge-closed">SETTLED</span>;
      default: return <span className="badge-closed">{String(market.status).toUpperCase()}</span>;
    }
  };

  const statusMessage = () => {
    if (market.status === "suspended") return (
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs font-mono text-center text-amber-600 dark:text-amber-400">
        ⏸ Trading is temporarily suspended by the classroom instructor.
      </div>
    );
    if (market.status === "settled") {
      if (educationEnabled) pushNudge(NUDGE_CONTENT.settlement);
      return (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-mono text-center text-emerald-600 dark:text-emerald-400">
          ✓ Market settled. Graded outcome: <strong>{market.settlementResult}</strong>
        </div>
      );
    }
    return null;
  };

  const engineLabel = market.config.engineType === "lmsr" ? "LMSR" : "Linear Impact";

  return (
    <div className="container max-w-6xl py-6 md:py-10 animate-slide-up space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <Link
          to="/markets"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>RETURN TO BOARD</span>
        </Link>
        <div className="flex items-center gap-2">
          {statusBadge()}
          <Badge variant="outline" className="text-[10px] font-mono border-border/80">
            {market.league}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
            {market.sport}
          </Badge>
        </div>
      </div>

      {/* Main Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
          {market.title}
        </h1>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mt-2 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {market.startTime}
          </span>
          <LiveSourceBadge source={market.metadata.dataSource} />
          {isMulti && <span>· {market.outcomes.length} outcomes</span>}
        </div>
      </div>

      {statusMessage()}

      {ethicsSettings.enabled && ethicsSettings.studentsAwareOfManipulation && market.status === "open" && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs font-mono text-center text-amber-600 dark:text-amber-400">
          ⚠️ <strong>EXPERIMENT NOTICE:</strong> Classroom running in ethics-research mode. Odds patterns may include rumors or coordinated volume.
        </div>
      )}

      {market.status === "settled" && ethicsSettings.studentDebriefEnabled && (
        <MarketDebrief marketId={market.id} />
      )}

      {market.status === "open" && <BehavioralFraming marketId={market.id} />}
      {market.status === "open" && <BreakingNewsBanner marketId={market.id} />}
      <MarketNewsFeed marketId={market.id} />

      <Tabs defaultValue="sportsbook" className="w-full">
        <TabsList className="mb-6 h-9">
          <TabsTrigger value="sportsbook" className="font-mono text-xs uppercase px-4">
            Sportsbook Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prediction" className="mt-0">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Analytics bar */}
              {analytics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="stat-card !p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Volume</span>
                    </div>
                    <p className="font-bold font-mono text-sm">${analytics.totalVolume.toFixed(0)}</p>
                  </div>
                  <div className="stat-card !p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Bets</span>
                    </div>
                    <p className="font-bold font-mono text-sm">{analytics.tradeCount}</p>
                  </div>
                  <div className="stat-card !p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Bettors</span>
                    </div>
                    <p className="font-bold font-mono text-sm">{analytics.uniqueTraders}</p>
                  </div>
                  <div className="stat-card !p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Activity</span>
                    </div>
                    <p className="font-bold font-mono text-sm">{analytics.activityScore}/min</p>
                  </div>
                </div>
              )}

              {analytics && analytics.tradeCount > 0 && (
                <PressureIndicator buyPressure={analytics.buyPressure} />
              )}

              {/* Price History Chart */}
              <Card>
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                    Price Movement History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <PriceHistoryChart priceHistory={priceHistory} outcomes={market.outcomes} />
                </CardContent>
              </Card>

              {/* Volume Handle Chart */}
              <Card>
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold">Volume Handle</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <VolumeChart priceHistory={priceHistory} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ReferenceOddsCard market={market} />
              {educationEnabled && (
                <EducationalSidebar
                  price={firstOutcome?.price ?? 0.5}
                  outcomeName={firstOutcome?.name ?? ""}
                  liquidityParameter={market.config.liquidityParameter}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sportsbook" className="mt-0">
          <SportsbookTab market={market} />
        </TabsContent>

        <TabsContent value="racetrack" className="mt-0">
          <RacetrackTab market={market} />
        </TabsContent>
      </Tabs>

      <TradeTicketModal
        open={tradeModal.open}
        onClose={() => setTradeModal((s) => ({ ...s, open: false }))}
        marketId={market.id}
        outcomeId={tradeModal.outcomeId}
        outcomeName={tradeModal.outcomeName}
        initialType={tradeModal.type}
      />
    </div>
  );
}
