import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, ChevronRight, Filter, SlidersHorizontal, TrendingUp, BarChart3, Zap, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { useMarket } from "@/context/MarketContext";
import { useMode, marketMatchesMode, MODE_LABELS } from "@/context/ModeContext";
import type { MarketStatus } from "@/lib/tradingEngine";
import { cn } from "@/lib/utils";
import { toAmerican } from "@/lib/oddsFormat";
import { TradeTicketModal } from "@/components/trading/TradeTicketModal";
import { MAJOR_LEAGUES } from "@/lib/liveBoard";
import { useBoardLeagues, useSetBoardLeagues } from "@/features/classes/useBoardLeagues";

const statusBadge = (status: MarketStatus) => {
  switch (status) {
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
    case "suspended":
      return <span className="badge-upcoming">SUSPENDED</span>;
    case "settled":
      return <span className="badge-closed">SETTLED</span>;
    default:
      return <span className="badge-closed">{String(status).toUpperCase()}</span>;
  }
};

const CATEGORY_LABELS: Record<string, string> = {
  "game-winner": "Game Winner",
  "series-winner": "Series",
  "tournament-winner": "Tournament",
  "division-winner": "Division",
  "award-winner": "Award",
  "first-scorer": "First Scorer",
  "first-td-scorer": "First TD",
  "playoff-qualification": "Playoff",
  "over-under": "Over/Under",
  "head-to-head": "H2H",
  "prop": "Prop",
  "custom": "Custom",
};

export default function Markets() {
  const { markets: allMarkets, trades, liveBoardLoading, liveBoardError, loadLiveMarkets } = useMarket();
  const { mode } = useMode();
  const { leagues: enabledLeagues, classId, canEdit } = useBoardLeagues();
  const setBoardLeagues = useSetBoardLeagues();
  const enabledKey = enabledLeagues.join(",");

  useEffect(() => {
    void loadLiveMarkets(enabledKey.split(","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKey]);

  const markets = useMemo(() => {
    const scoped = mode ? allMarkets.filter((m) => marketMatchesMode(m, mode)) : allMarkets;
    return scoped.filter((m) => {
      const slug = m.metadata?.externalLeague;
      return m.metadata?.dataSource !== "odds-api" || (slug ? enabledLeagues.includes(slug) : false);
    });
  }, [allMarkets, mode, enabledLeagues]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MarketStatus | "all">("all");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "outcomes" | "title" | "volume">("newest");
  const [tradeModal, setTradeModal] = useState<{ marketId: string; outcomeId: string } | null>(null);

  const leagues = useMemo(() => [...new Set(markets.map((m) => m.league))].sort(), [markets]);
  const sports = useMemo(() => [...new Set(markets.map((m) => m.sport))].sort(), [markets]);
  const categories = useMemo(() => [...new Set(markets.map((m) => m.metadata?.category).filter(Boolean))].sort(), [markets]);

  const volumeByMarket = useMemo(() => {
    const map = new Map<string, { volume: number; count: number }>();
    for (const t of trades) {
      const existing = map.get(t.marketId) ?? { volume: 0, count: 0 };
      map.set(t.marketId, { volume: existing.volume + t.totalCost, count: existing.count + 1 });
    }
    return map;
  }, [trades]);

  const filtered = useMemo(() => {
    let result = markets.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (leagueFilter !== "all" && m.league !== leagueFilter) return false;
      if (sportFilter !== "all" && m.sport !== sportFilter) return false;
      if (categoryFilter !== "all" && m.metadata?.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!m.title.toLowerCase().includes(q) &&
            !m.league.toLowerCase().includes(q) &&
            !m.sport.toLowerCase().includes(q) &&
            !m.outcomes.some((o) => o.name.toLowerCase().includes(q))) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "outcomes": result.sort((a, b) => b.outcomes.length - a.outcomes.length); break;
      case "title": result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "volume": result.sort((a, b) => (volumeByMarket.get(b.id)?.volume ?? 0) - (volumeByMarket.get(a.id)?.volume ?? 0)); break;
      default: break;
    }
    return result;
  }, [markets, statusFilter, leagueFilter, sportFilter, categoryFilter, search, sortBy, volumeByMarket]);

  const activeFilters = [statusFilter !== "all", leagueFilter !== "all", sportFilter !== "all", categoryFilter !== "all"].filter(Boolean).length;

  return (
    <div className="container max-w-6xl py-6 md:py-10 space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Odds Board
            </h1>
            {mode && (
              <span className="rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-xs font-mono font-medium text-foreground">
                {MODE_LABELS[mode]}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time lines from The Odds API · Virtual stakes and live hold tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {liveBoardLoading && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
              Syncing feed…
            </span>
          )}
          {!liveBoardLoading && liveBoardError && (
            <span className="text-xs text-rose-500 font-mono font-medium">{liveBoardError}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadLiveMarkets(enabledLeagues)}
            disabled={liveBoardLoading}
            className="h-8 text-xs font-medium"
          >
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", liveBoardLoading && "animate-spin")} />
            Refresh Odds
          </Button>
        </div>
      </div>

      {/* Instructor League Controls */}
      {canEdit && classId && (
        <div className="rounded-lg border border-emerald-500/30 bg-card p-4 sm:p-5 space-y-3 shadow-subtle-card dark:shadow-terminal-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
              <p className="text-sm sm:text-base font-semibold text-foreground">Instructor Controls · Active Leagues</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              INSTRUCTOR ACCESS
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure leagues enabled for class betting. Games cover today and the next two calendar days.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-2.5 pt-1">
            {MAJOR_LEAGUES.map((l) => {
              const on = enabledLeagues.includes(l.key);
              const toggle = () => {
                const next = on
                  ? enabledLeagues.filter((k) => k !== l.key)
                  : [...enabledLeagues, l.key];
                if (next.length === 0) return;
                setBoardLeagues.mutate({ classId, leagues: next });
              };
              return (
                <label
                  key={l.key}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md border px-3 py-2 cursor-pointer transition-all duration-150 text-xs font-medium",
                    on
                      ? "border-emerald-500/50 bg-emerald-500/5 text-foreground shadow-xs"
                      : "border-border/60 bg-muted/30 text-muted-foreground opacity-75 hover:opacity-100",
                  )}
                >
                  <span className="font-mono">{l.label}</span>
                  <Switch checked={on} onCheckedChange={toggle} disabled={setBoardLeagues.isPending} />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search teams, markets, leagues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "open", "suspended", "settled"] as const).map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f)}
                className="h-9 px-3 text-xs font-mono uppercase shrink-0"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-center overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground shrink-0 font-mono text-[11px]">
            <Filter className="h-3 w-3" />
            <span>FILTER:</span>
            {activeFilters > 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-emerald-500/40 text-emerald-500">
                {activeFilters}
              </Badge>
            )}
          </div>
          <Select value={leagueFilter} onValueChange={setLeagueFilter}>
            <SelectTrigger className="w-32 h-8 text-xs shrink-0 font-mono"><SelectValue placeholder="League" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {leagues.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger className="w-32 h-8 text-xs shrink-0 font-mono"><SelectValue placeholder="Sport" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-8 text-xs shrink-0 font-mono"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c!} value={c!}>{CATEGORY_LABELS[c!] ?? c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-32 h-8 text-xs shrink-0 font-mono">
              <SlidersHorizontal className="h-3 w-3 mr-1" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="volume">Most Volume</SelectItem>
              <SelectItem value="outcomes">Most Outcomes</SelectItem>
              <SelectItem value="title">A-Z</SelectItem>
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <button
              onClick={() => { setLeagueFilter("all"); setSportFilter("all"); setStatusFilter("all"); setCategoryFilter("all"); }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 shrink-0 font-mono"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>{filtered.length} active market{filtered.length !== 1 ? "s" : ""}</span>
        <span>FORMAT: AMERICAN ODDS (IMPLIED PROBABILITY)</span>
      </div>

      {/* Market Cards Grid */}
      <div className="grid gap-3.5">
        {filtered.map((market) => {
          const isMulti = market.outcomes.length > 2;
          const sortedOutcomes = [...market.outcomes].sort((a, b) => b.price - a.price);
          const priceSum = market.outcomes.reduce((s, o) => s + o.price, 0);
          const vol = volumeByMarket.get(market.id);
          const catLabel = CATEGORY_LABELS[market.metadata?.category ?? "custom"] ?? market.metadata?.category;

          return (
            <div key={market.id} className="market-card">
              <Link to={`/markets/${market.id}`} className="block p-4 sm:p-5 hover:bg-muted/10 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {statusBadge(market.status)}
                      <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-border/80">
                        {market.league}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 text-muted-foreground border-border/60">
                        {market.sport}
                      </Badge>
                      {catLabel && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          · {catLabel}
                        </span>
                      )}
                      {isMulti && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({market.outcomes.length} outcomes)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                      {market.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {market.startTime}
                      </span>
                      {vol && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-emerald-500" />
                          ${vol.volume.toFixed(0)} handle · {vol.count} bets
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                </div>

                {/* Outcomes Display */}
                {market.outcomes.length <= 3 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {market.outcomes.map((o) => {
                      const fairChance = ((o.price / Math.max(priceSum, 0.01)) * 100);
                      return (
                        <div
                          key={o.id}
                          className="rounded-md border border-border/80 bg-background/60 p-3 transition-colors hover:border-border"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold truncate text-foreground">{o.name}</span>
                            <span className="text-base font-bold font-mono tracking-tight text-foreground ml-2">
                              {toAmerican(o.price)}
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${fairChance}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground mt-1.5">
                            <span>Fair chance</span>
                            <span className="font-semibold text-foreground">{fairChance.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {sortedOutcomes.slice(0, 4).map((o, i) => {
                      const pct = (o.price / Math.max(priceSum, 0.01)) * 100;
                      return (
                        <div key={o.id} className="flex items-center gap-3 text-xs font-mono py-1 border-b border-border/40 last:border-0">
                          <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                          <span className="flex-1 truncate font-medium text-foreground">{o.name}</span>
                          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", i === 0 ? "bg-emerald-500" : "bg-emerald-500/60")}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-bold text-sm w-16 text-right text-foreground">{toAmerican(o.price)}</span>
                          <span className="text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                    {market.outcomes.length > 4 && (
                      <p className="text-[11px] font-mono text-muted-foreground pl-7 pt-1">
                        +{market.outcomes.length - 4} more selections
                      </p>
                    )}
                  </div>
                )}
              </Link>

              {/* Quick Trade Cell Actions */}
              {market.status === "open" && (
                <div className="px-4 sm:px-5 pb-4 pt-0">
                  <div className="flex gap-2 flex-wrap">
                    {market.outcomes.slice(0, 4).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setTradeModal({ marketId: market.id, outcomeId: o.id });
                        }}
                        className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-[100px] h-9 px-3 rounded-md border border-border/80 bg-muted/40 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-between text-xs"
                      >
                        <span className="truncate font-medium text-foreground mr-1.5">{o.name}</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {toAmerican(o.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          markets.length === 0 ? (
            liveBoardLoading ? (
              <EmptyState
                icon={Loader2}
                title="Syncing live board…"
                description="Ingesting today's games and live odds from The Odds API."
              />
            ) : liveBoardError ? (
              <EmptyState
                icon={RefreshCw}
                title="Odds feed connection error"
                description={`${liveBoardError} — please check network connection or retry in a moment.`}
                actionLabel="Retry"
                onAction={() => void loadLiveMarkets(enabledLeagues)}
              />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No games scheduled"
                description="There are currently no games in the selected leagues for the next 48 hours. Check back closer to matchday."
              />
            )
          ) : (
            <EmptyState
              icon={Search}
              title="No matching markets"
              description="No games matched your search criteria. Try resetting filters."
              actionLabel="Clear Filters"
              onAction={() => { setLeagueFilter("all"); setSportFilter("all"); setStatusFilter("all"); setCategoryFilter("all"); setSearch(""); }}
            />
          )
        )}
      </div>

      {/* Trade Modal */}
      {tradeModal && (() => {
        const m = markets.find((mk) => mk.id === tradeModal.marketId);
        const o = m?.outcomes.find((oc) => oc.id === tradeModal.outcomeId);
        return m && o ? (
          <TradeTicketModal
            open={true}
            marketId={tradeModal.marketId}
            outcomeId={tradeModal.outcomeId}
            outcomeName={o.name}
            onClose={() => setTradeModal(null)}
          />
        ) : null;
      })()}
    </div>
  );
}
