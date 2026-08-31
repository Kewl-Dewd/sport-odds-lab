import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, ChevronRight, Filter, SlidersHorizontal, TrendingUp, BarChart3, Zap, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { useMarket } from "@/context/MarketContext";
import { useMode, marketMatchesMode, MODE_LABELS } from "@/context/ModeContext";
import type { MarketStatus } from "@/lib/tradingEngine";
import { cn } from "@/lib/utils";
import { TradeTicketModal } from "@/components/trading/TradeTicketModal";
import { MAJOR_LEAGUES } from "@/lib/liveBoard";
import { useBoardLeagues, useSetBoardLeagues } from "@/features/classes/useBoardLeagues";

const statusBadge = (status: MarketStatus) => {
  switch (status) {
    case "open": return <span className="badge-live"><span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-subtle" />Open</span>;
    case "suspended": return <span className="badge-upcoming">Suspended</span>;
    case "settled": return <span className="badge-closed">Settled</span>;
    default: return <span className="badge-closed">{status}</span>;
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

const diffBadgeStyle: Record<string, string> = {
  beginner: "bg-success/15 text-success",
  intermediate: "bg-warning/15 text-warning",
  advanced: "bg-destructive/15 text-destructive",
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
      // Feed markets must be in an enabled league; manual markets always show.
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
    <div className="container py-8 space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Markets {mode && <span className="text-base font-normal text-muted-foreground">· {MODE_LABELS[mode]}</span>}</h1>
        <p className="text-muted-foreground">Browse the board and place your bets</p>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {liveBoardLoading && <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading live odds…</span>}
        {!liveBoardLoading && liveBoardError && <span className="text-destructive">{liveBoardError}</span>}
        <Button variant="outline" size="sm" onClick={() => void loadLiveMarkets(enabledLeagues)} disabled={liveBoardLoading}>
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", liveBoardLoading && "animate-spin")} />
          Refresh board
        </Button>
      </div>

      {canEdit && classId && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <p className="text-sm font-medium">Leagues on the board (instructor only)</p>
          <p className="text-xs text-muted-foreground">
            Turn leagues on or off for your students. Only today&apos;s games are listed.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {MAJOR_LEAGUES.map((l) => {
              const on = enabledLeagues.includes(l.key);
              return (
                <Badge
                  key={l.key}
                  variant={on ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => {
                    const next = on
                      ? enabledLeagues.filter((k) => k !== l.key)
                      : [...enabledLeagues, l.key];
                    if (next.length === 0) return;
                    setBoardLeagues.mutate({ classId, leagues: next });
                  }}
                >
                  {l.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search markets, outcomes, leagues..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "open", "suspended", "settled"] as const).map((f) => (
              <Button key={f} variant={statusFilter === f ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f)} className="capitalize">
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />Filters{activeFilters > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{activeFilters}</Badge>}
          </div>
          <Select value={leagueFilter} onValueChange={setLeagueFilter}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="League" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {leagues.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Sport" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c!} value={c!}>{CATEGORY_LABELS[c!] ?? c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-32 h-8 text-xs">
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
            <button onClick={() => { setLeagueFilter("all"); setSportFilter("all"); setStatusFilter("all"); setCategoryFilter("all"); }}
              className="text-xs text-muted-foreground hover:text-foreground underline">Clear filters</button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} market{filtered.length !== 1 ? "s" : ""}</p>

      {/* Market Cards */}
      <div className="grid gap-4">
        {filtered.map((market) => {
          const isMulti = market.outcomes.length > 2;
          const sortedOutcomes = [...market.outcomes].sort((a, b) => b.price - a.price);
          const topOutcome = sortedOutcomes[0];
          const priceSum = market.outcomes.reduce((s, o) => s + o.price, 0);
          const vol = volumeByMarket.get(market.id);
          const catLabel = CATEGORY_LABELS[market.metadata?.category ?? "custom"] ?? market.metadata?.category;
          const diff = market.metadata?.difficultyLevel;

          return (
            <div key={market.id} className="market-card">
              <Link to={`/markets/${market.id}`} className="block p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {statusBadge(market.status)}
                      <Badge variant="outline" className="text-xs">{market.league}</Badge>
                      <Badge variant="outline" className="text-xs">{market.sport}</Badge>
                      {catLabel && <Badge variant="secondary" className="text-[10px]">{catLabel}</Badge>}
                      {diff && <Badge className={`text-[10px] border-0 ${diffBadgeStyle[diff] ?? ""}`}>{diff}</Badge>}
                      {isMulti && <Badge variant="secondary" className="text-xs">{market.outcomes.length} outcomes</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold">{market.title}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />{market.startTime}
                      </p>
                      {vol && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />${vol.volume.toFixed(0)} handle · {vol.count} bets
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                </div>

                {/* Outcomes */}
                {market.outcomes.length <= 3 ? (
                  <div className="flex gap-3 flex-wrap">
                    {market.outcomes.map((o) => (
                      <div key={o.id} className="flex-1 min-w-[100px] rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium truncate">{o.name}</p>
                          <span className="text-lg font-bold font-mono ml-2">{(o.price * 100).toFixed(1)}¢</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${(o.price / Math.max(priceSum, 0.01)) * 100}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground text-right mt-1">
                          {((o.price / Math.max(priceSum, 0.01)) * 100).toFixed(0)}%
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {sortedOutcomes.slice(0, 4).map((o, i) => {
                      const pct = (o.price / Math.max(priceSum, 0.01)) * 100;
                      return (
                        <div key={o.id} className="flex items-center gap-3 text-sm">
                          <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}.</span>
                          <span className="flex-1 truncate font-medium">{o.name}</span>
                          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                            <div className={cn("h-full rounded-full transition-all duration-500", i === 0 ? "bg-primary" : "bg-primary/50")}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono font-bold text-sm w-14 text-right">{(o.price * 100).toFixed(1)}¢</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                    {market.outcomes.length > 4 && (
                      <p className="text-xs text-muted-foreground pl-7">+{market.outcomes.length - 4} more</p>
                    )}
                  </div>
                )}
              </Link>

              {/* Quick Trade Buttons */}
              {market.status === "open" && (
                <div className="px-5 pb-4 pt-0">
                  <div className="flex gap-2 flex-wrap">
                    {market.outcomes.slice(0, 4).map((o) => (
                      <Button
                        key={o.id}
                        variant="outline"
                        size="sm"
                        className="text-xs flex-1 min-w-[80px]"
                        onClick={(e) => {
                          e.preventDefault();
                          setTradeModal({ marketId: market.id, outcomeId: o.id });
                        }}
                      >
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {o.name.length > 12 ? o.name.slice(0, 12) + "…" : o.name} {(o.price * 100).toFixed(0)}¢
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          markets.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title={liveBoardLoading ? "Loading the board…" : mode ? `No ${MODE_LABELS[mode]} markets yet` : "No markets yet"}
              description={mode
                ? `Your instructor hasn't published any ${MODE_LABELS[mode]} markets. Switch modes from the top nav or check back later.`
                : "Your instructor hasn't published any markets for this class. Check back once a market opens."}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No matches"
              description="Try clearing filters or searching by team, league, or outcome."
              actionLabel="Clear filters"
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
