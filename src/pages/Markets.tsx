import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Clock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MarketStatus = "live" | "upcoming" | "closed";

interface Market {
  id: string;
  title: string;
  league: string;
  sport: string;
  status: MarketStatus;
  startTime: string;
  outcomes: { name: string; price: number }[];
}

const mockMarkets: Market[] = [
  {
    id: "1", title: "Lakers vs Celtics", league: "NBA", sport: "Basketball",
    status: "live", startTime: "Live Now",
    outcomes: [{ name: "Lakers", price: 0.62 }, { name: "Celtics", price: 0.38 }],
  },
  {
    id: "2", title: "Super Bowl LIX", league: "NFL", sport: "Football",
    status: "upcoming", startTime: "Feb 9, 7:30 PM",
    outcomes: [{ name: "Chiefs", price: 0.55 }, { name: "49ers", price: 0.45 }],
  },
  {
    id: "3", title: "Man City vs Arsenal", league: "Premier League", sport: "Soccer",
    status: "live", startTime: "Live Now",
    outcomes: [{ name: "City", price: 0.48 }, { name: "Draw", price: 0.24 }, { name: "Arsenal", price: 0.28 }],
  },
  {
    id: "4", title: "Wimbledon Final", league: "ATP", sport: "Tennis",
    status: "upcoming", startTime: "Jul 14, 2:00 PM",
    outcomes: [{ name: "Djokovic", price: 0.55 }, { name: "Alcaraz", price: 0.45 }],
  },
  {
    id: "5", title: "World Series Game 7", league: "MLB", sport: "Baseball",
    status: "closed", startTime: "Settled",
    outcomes: [{ name: "Yankees", price: 1.0 }, { name: "Dodgers", price: 0.0 }],
  },
];

const statusBadge = (status: MarketStatus) => {
  switch (status) {
    case "live": return <span className="badge-live"><span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-subtle" />Live</span>;
    case "upcoming": return <span className="badge-upcoming">Upcoming</span>;
    case "closed": return <span className="badge-closed">Settled</span>;
  }
};

export default function Markets() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MarketStatus | "all">("all");

  const filtered = mockMarkets.filter((m) => {
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "live", "upcoming", "closed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Market Cards */}
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
                  <div
                    key={o.name}
                    className="flex-1 min-w-[100px] rounded-lg border p-3 text-center"
                  >
                    <p className="text-sm text-muted-foreground">{o.name}</p>
                    <p className="text-lg font-bold font-mono">{(o.price * 100).toFixed(0)}¢</p>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
