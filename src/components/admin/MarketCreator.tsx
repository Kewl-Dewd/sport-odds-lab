import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarket } from "@/context/MarketContext";
import { DEFAULT_LIQUIDITY } from "@/lib/tradingEngine";

export function MarketCreator({ onClose }: { onClose: () => void }) {
  const { createMarket } = useMarket();
  const [title, setTitle] = useState("");
  const [league, setLeague] = useState("");
  const [sport, setSport] = useState("");
  const [startTime, setStartTime] = useState("");
  const [description, setDescription] = useState("");
  const [outcomes, setOutcomes] = useState(["", ""]);
  const [liquidity, setLiquidity] = useState(DEFAULT_LIQUIDITY);

  const addOutcome = () => setOutcomes([...outcomes, ""]);
  const removeOutcome = (i: number) => {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter((_, idx) => idx !== i));
  };
  const updateOutcome = (i: number, val: string) => {
    const next = [...outcomes];
    next[i] = val;
    setOutcomes(next);
  };

  const canSubmit = title.trim() && league.trim() && outcomes.every((o) => o.trim()) && outcomes.length >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createMarket(title, league, sport || league, startTime || "TBD", description, outcomes.filter((o) => o.trim()), liquidity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create New Market</CardTitle>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Event Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lakers vs Celtics" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">League *</label>
              <Input value={league} onChange={(e) => setLeague(e.target.value)} placeholder="NBA" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sport</label>
              <Input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Basketball" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Start Time</label>
            <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="Tonight, 8:00 PM ET" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief market description" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Liquidity Parameter</label>
            <Input type="number" value={liquidity} onChange={(e) => setLiquidity(Number(e.target.value))} min={10} max={1000} />
            <p className="text-xs text-muted-foreground">Higher = less price movement per trade (default: 100)</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Outcomes *</label>
            {outcomes.map((o, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={o}
                  onChange={(e) => updateOutcome(i, e.target.value)}
                  placeholder={`Outcome ${i + 1}`}
                />
                {outcomes.length > 2 && (
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeOutcome(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOutcome}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add Outcome
            </Button>
            <p className="text-xs text-muted-foreground">
              Prices auto-set to even split (e.g., 2 outcomes = 50¢/50¢)
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="hero" className="flex-1" disabled={!canSubmit} onClick={handleSubmit}>
              Create Market
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
