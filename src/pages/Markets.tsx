import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/context/MarketContext";
import type { MarketStatus } from "@/lib/tradingEngine";

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
  const [filter, setFilter] = useState<MarketStatus | "all">("all");

  const filtered = markets.filter((m) => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container py-8 space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Markets</h1>
        <p className="text-muted-foreground">Browse and trade on sports events</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search markets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["all", "open", "suspended", "settled"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((market) => (
          <Link key={market.id} to={`/markets/${market.id}`} className="market-card block">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {statusBadge(market.status)}
                    <Badge variant="outline" className="text-xs">{market.league}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold">{market.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />{market.startTime}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
              </div>
              <div className="flex gap-3 flex-wrap">
                {market.outcomes.map((o) => (
                  <div key={o.id} className="flex-1 min-w-[100px] rounded-lg border p-3 text-center">
                    <p className="text-sm text-muted-foreground">{o.name}</p>
                    <p className="text-lg font-bold font-mono">{(o.price * 100).toFixed(1)}¢</p>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No markets found.</div>
        )}
      </div>
    </div>
  );
}
