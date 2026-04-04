import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, ChevronRight, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarket } from "@/context/MarketContext";
import type { MarketStatus } from "@/lib/tradingEngine";
import { cn } from "@/lib/utils";

const statusBadge = (status: MarketStatus) => {
  switch (status) {
    case "open": return <span className="badge-live"><span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-subtle" />Open</span>;
    case "suspended": return <span className="badge-upcoming">Suspended</span>;
    case "settled": return <span className="badge-closed">Settled</span>;
    default: return <span className="badge-closed">{status}</span>;
  }
};

export default function Markets() {
  const { markets } = useMarket();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MarketStatus | "all">("all");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "outcomes" | "title">("newest");

  const leagues = useMemo(() => [...new Set(markets.map((m) => m.league))].sort(), [markets]);
  const sports = useMemo(() => [...new Set(markets.map((m) => m.sport))].sort(), [markets]);

  const filtered = useMemo(() => {
    let result = markets.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (leagueFilter !== "all" && m.league !== leagueFilter) return false;
      if (sportFilter !== "all" && m.sport !== sportFilter) return false;
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
      default: break; // already newest first
    }
    return result;
  }, [markets, statusFilter, leagueFilter, sportFilter, search, sortBy]);

  const activeFilters = [statusFilter !== "all", leagueFilter !== "all", sportFilter !== "all"].filter(Boolean).length;

  return (
    <div className="container py-8 space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Markets</h1>
        <p className="text-muted-foreground">Browse and trade on sports events</p>
      </div>

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

        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />Filters{activeFilters > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{activeFilters}</Badge>}
          </div>
          <Select value={leagueFilter} onValueChange={setLeagueFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="League" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {leagues.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="outcomes">Most Outcomes</SelectItem>
              <SelectItem value="title">A-Z</SelectItem>
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <button onClick={() => { setLeagueFilter("all"); setSportFilter("all"); setStatusFilter("all"); }}
              className="text-xs text-muted-foreground hover:text-foreground underline">Clear filters</button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} market{filtered.length !== 1 ? "s" : ""}</p>

      {/* Market Cards */}
      <div className="grid gap-4">
        {filtered.map((market) => {
          const isMulti = market.outcomes.length > 2;
          const sortedOutcomes = [...market.outcomes].sort((a, b) => b.price - a.price);
          const topOutcome = sortedOutcomes[0];
          const priceSum = market.outcomes.reduce((s, o) => s + o.price, 0);

          return (
            <Link key={market.id} to={`/markets/${market.id}`} className="market-card block">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {statusBadge(market.status)}
                      <Badge variant="outline" className="text-xs">{market.league}</Badge>
                      <Badge variant="outline" className="text-xs">{market.sport}</Badge>
                      {isMulti && (
                        <Badge variant="secondary" className="text-xs">{market.outcomes.length} outcomes</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{market.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3.5 w-3.5" />{market.startTime}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                </div>

                {/* Outcome display: compact for many outcomes, full for binary */}
                {market.outcomes.length <= 3 ? (
                  <div className="flex gap-3 flex-wrap">
                    {market.outcomes.map((o) => (
                      <div key={o.id} className="flex-1 min-w-[100px] rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium truncate">{o.name}</p>
                          <span className="text-lg font-bold font-mono ml-2">{(o.price * 100).toFixed(1)}¢</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${(o.price / Math.max(priceSum, 0.01)) * 100}%` }}
                          />
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
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                i === 0 ? "bg-primary" : "bg-primary/50"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-sm w-14 text-right">{(o.price * 100).toFixed(1)}¢</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                    {market.outcomes.length > 4 && (
                      <p className="text-xs text-muted-foreground pl-7">
                        +{market.outcomes.length - 4} more outcome{market.outcomes.length - 4 > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No markets found.</div>
        )}
      </div>
    </div>
  );
}
