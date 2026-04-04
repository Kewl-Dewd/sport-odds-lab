import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MarketDetail() {
  const { id } = useParams();

  // Placeholder data
  const market = {
    id,
    title: "Lakers vs Celtics",
    league: "NBA",
    sport: "Basketball",
    status: "live" as const,
    startTime: "Live Now",
    description: "Regular season matchup between the Los Angeles Lakers and Boston Celtics. Trade outcome shares based on who you think will win.",
    outcomes: [
      { name: "Lakers Win", price: 0.62, volume: 1250 },
      { name: "Celtics Win", price: 0.38, volume: 980 },
    ],
  };

  return (
    <div className="container py-8 space-y-6 animate-slide-up">
      <Link to="/markets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to Markets
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-live"><span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-subtle" />Live</span>
          <Badge variant="outline">{market.league}</Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">{market.title}</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
          <Clock className="h-4 w-4" />{market.startTime}
        </p>
      </div>

      {/* Outcomes */}
      <div className="grid sm:grid-cols-2 gap-4">
        {market.outcomes.map((o) => (
          <Card key={o.name}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{o.name}</h3>
                <span className="text-2xl font-bold font-mono">{(o.price * 100).toFixed(0)}¢</span>
              </div>
              <p className="text-sm text-muted-foreground">Volume: {o.volume.toLocaleString()} shares</p>
              <div className="flex gap-2">
                <Button variant="success" className="flex-1">Buy</Button>
                <Button variant="destructive" className="flex-1">Sell</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            Price chart will be rendered here
          </div>
        </CardContent>
      </Card>

      {/* Market Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {market.description}
        </CardContent>
      </Card>
    </div>
  );
}
