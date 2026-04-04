import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarket } from "@/context/MarketContext";
import { DEFAULT_LIQUIDITY, DEFAULT_MAX_TRADE_SIZE, PRICE_FLOOR, PRICE_CEILING } from "@/lib/tradingEngine";
import { getEngineOptions, type PricingEngineType } from "@/lib/pricing";

export function MarketCreator({ onClose }: { onClose: () => void }) {
  const { createMarket } = useMarket();
  const [title, setTitle] = useState("");
  const [league, setLeague] = useState("");
  const [sport, setSport] = useState("");
  const [startTime, setStartTime] = useState("");
  const [description, setDescription] = useState("");
  const [outcomes, setOutcomes] = useState(["", ""]);
  const [liquidity, setLiquidity] = useState(DEFAULT_LIQUIDITY);
  const [engineType, setEngineType] = useState<PricingEngineType>("linear-impact");
  const [maxTradeSize, setMaxTradeSize] = useState(DEFAULT_MAX_TRADE_SIZE);
  const [priceFloor, setPriceFloor] = useState(PRICE_FLOOR);
  const [priceCeiling, setPriceCeiling] = useState(PRICE_CEILING);

  const engineOptions = getEngineOptions();

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
    createMarket(
      title, league, sport || league, startTime || "TBD", description,
      outcomes.filter((o) => o.trim()), liquidity, engineType, maxTradeSize, priceFloor, priceCeiling
    );
    onClose();
  };

  const selectedEngine = engineOptions.find((e) => e.value === engineType);

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

          {/* Pricing Engine Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pricing Engine</label>
            <Select value={engineType} onValueChange={(v) => setEngineType(v as PricingEngineType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {engineOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEngine && (
              <p className="text-xs text-muted-foreground">{selectedEngine.description}</p>
            )}
          </div>

          {/* Market Configuration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Liquidity Parameter</label>
              <Input type="number" value={liquidity} onChange={(e) => setLiquidity(Number(e.target.value))} min={10} max={1000} />
              <p className="text-xs text-muted-foreground">Higher = less price movement</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max Trade Size</label>
              <Input type="number" value={maxTradeSize} onChange={(e) => setMaxTradeSize(Number(e.target.value))} min={1} max={10000} />
              <p className="text-xs text-muted-foreground">Max shares per trade</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Price Floor</label>
              <Input type="number" value={priceFloor} onChange={(e) => setPriceFloor(Number(e.target.value))} min={0.01} max={0.49} step={0.01} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Price Ceiling</label>
              <Input type="number" value={priceCeiling} onChange={(e) => setPriceCeiling(Number(e.target.value))} min={0.51} max={0.99} step={0.01} />
            </div>
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
