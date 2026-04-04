import { useState } from "react";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarket } from "@/context/MarketContext";
import type { Market } from "@/lib/tradingEngine";
import { cn } from "@/lib/utils";

export function SettlementModal({ market, onClose }: { market: Market; onClose: () => void }) {
  const { settleMarket } = useMarket();
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSettle = () => {
    if (!selectedOutcome) return;
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    settleMarket(market.id, selectedOutcome);
    onClose();
  };

  const selectedName = market.outcomes.find((o) => o.id === selectedOutcome)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />Settle Market
          </CardTitle>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">{market.title}</p>
            <p className="text-sm text-muted-foreground">{market.league} · {market.sport}</p>
          </div>

          {!confirmed ? (
            <>
              <p className="text-sm text-muted-foreground">Select the winning outcome:</p>
              <div className="space-y-2">
                {market.outcomes.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOutcome(o.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                      selectedOutcome === o.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="font-medium">{o.name}</span>
                    <span className="font-mono text-sm">{(o.price * 100).toFixed(1)}¢</span>
                  </button>
                ))}
              </div>
              <Button
                variant="hero"
                className="w-full"
                disabled={!selectedOutcome}
                onClick={handleSettle}
              >
                Continue to Confirm
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg border-2 border-warning/50 bg-warning/5 p-4 text-center space-y-2">
                <p className="text-sm font-medium">Are you sure?</p>
                <p className="text-lg font-bold">{selectedName}</p>
                <p className="text-xs text-muted-foreground">
                  This will settle the market, pay out winning shares at $1.00 each,
                  and zero out losing positions. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmed(false)}>Back</Button>
                <Button variant="destructive" className="flex-1" onClick={handleSettle}>
                  Confirm Settlement
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
