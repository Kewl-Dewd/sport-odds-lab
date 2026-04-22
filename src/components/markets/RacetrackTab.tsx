import { Card, CardContent } from "@/components/ui/card";
import type { Market } from "@/lib/tradingEngine";

interface Props {
  market: Market;
}

export function RacetrackTab({ market }: Props) {
  const surface = market.racetrack;

  if (!surface || !surface.enabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-sm">Racetrack is not enabled for this market.</p>
          <p className="text-xs mt-1">
            The instructor can configure runners and a Win/Place/Show pool to enable pari-mutuel betting.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        <p className="text-sm font-medium text-foreground">Racetrack pool — coming soon</p>
        <p className="text-xs mt-2">
          Runners table, live indicative odds, and Win/Place/Show stake form will be added in the next update.
        </p>
        <p className="text-xs mt-3">
          {surface.runners.length} runner{surface.runners.length === 1 ? "" : "s"} configured ·
          Takeout {(surface.takeout * 100).toFixed(0)}%
        </p>
      </CardContent>
    </Card>
  );
}
