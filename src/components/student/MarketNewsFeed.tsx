import { useMemo } from "react";
import {
  Newspaper, AlertTriangle, CheckCircle2, Cloud,
  UserX, Megaphone, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useMarket, SHOCK_LABELS, type ShockKind,
} from "@/context/MarketContext";
import { cn } from "@/lib/utils";

const ICONS: Partial<Record<ShockKind, typeof Zap>> = {
  "breaking-news": Newspaper,
  "player-injury": UserX,
  "weather": Cloud,
  "rumor": Megaphone,
  "correction": CheckCircle2,
  "false-alarm": AlertTriangle,
};

/** Student-facing news feed of shock events visible to the current user. */
export function MarketNewsFeed({ marketId }: { marketId?: string }) {
  const { portfolio, getShocksForUser, getShocksForMarket } = useMarket();
  const items = useMemo(() => {
    const list = marketId
      ? getShocksForMarket(marketId, portfolio.userId)
      : getShocksForUser(portfolio.userId);
    return [...list].sort(
      (a, b) => new Date(b.releasedAt ?? "").getTime() - new Date(a.releasedAt ?? "").getTime(),
    );
  }, [marketId, getShocksForMarket, getShocksForUser, portfolio.userId]);

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-muted-foreground" />
            News feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground py-4 text-center">No news yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-info" />
          News feed
          <Badge variant="outline" className="text-[10px] ml-auto">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((s) => {
          const Icon = ICONS[s.kind] ?? Newspaper;
          const isBreaking = s.urgency === "breaking";
          const isCorrection = s.kind === "correction";
          return (
            <div
              key={s.id}
              className={cn(
                "rounded-md border p-2.5 text-xs space-y-1",
                isBreaking && !isCorrection && "border-warning/40 bg-warning/5",
                isCorrection && "border-info/40 bg-info/5",
              )}
            >
              <div className="flex items-start gap-2">
                <Icon className={cn(
                  "h-3.5 w-3.5 mt-0.5 shrink-0",
                  isCorrection ? "text-info" : isBreaking ? "text-warning" : "text-muted-foreground",
                )} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isBreaking && !isCorrection && (
                      <Badge variant="outline" className="text-[9px] border-warning text-warning uppercase">
                        Breaking
                      </Badge>
                    )}
                    {isCorrection && (
                      <Badge variant="outline" className="text-[9px] border-info text-info uppercase">
                        Correction
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[9px]">{SHOCK_LABELS[s.kind]}</Badge>
                    <Badge variant="outline" className="text-[9px]">conf: {s.confidence}</Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {s.releasedAt && new Date(s.releasedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="font-medium mt-1">{s.title}</p>
                  <p className="text-muted-foreground">{s.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** Compact breaking-news banner shown at the top of a market card or page. */
export function BreakingNewsBanner({ marketId }: { marketId: string }) {
  const { portfolio, getShocksForMarket } = useMarket();
  const recent = useMemo(() => {
    const tenMinAgo = Date.now() - 10 * 60_000;
    return getShocksForMarket(marketId, portfolio.userId)
      .filter((s) => s.urgency === "breaking" && s.releasedAt && new Date(s.releasedAt).getTime() >= tenMinAgo)
      .sort((a, b) => new Date(b.releasedAt!).getTime() - new Date(a.releasedAt!).getTime())
      .slice(0, 1);
  }, [getShocksForMarket, marketId, portfolio.userId]);

  if (recent.length === 0) return null;
  const s = recent[0];
  const Icon = ICONS[s.kind] ?? Newspaper;
  const isCorrection = s.kind === "correction";

  return (
    <div className={cn(
      "rounded-md border-l-4 p-2.5 flex items-start gap-2",
      isCorrection ? "border-info bg-info/10" : "border-warning bg-warning/10",
    )}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", isCorrection ? "text-info" : "text-warning")} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={cn(
            "text-[9px] uppercase",
            isCorrection ? "border-info text-info" : "border-warning text-warning",
          )}>
            {isCorrection ? "Correction" : "Breaking"}
          </Badge>
          <Badge variant="outline" className="text-[9px]">{SHOCK_LABELS[s.kind]}</Badge>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {s.releasedAt && new Date(s.releasedAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm font-medium mt-0.5">{s.title}</p>
        <p className="text-xs text-muted-foreground">{s.description}</p>
      </div>
    </div>
  );
}
