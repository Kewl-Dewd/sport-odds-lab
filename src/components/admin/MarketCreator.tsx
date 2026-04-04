import { useState } from "react";
import { Plus, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/context/MarketContext";
import { DEFAULT_LIQUIDITY, DEFAULT_MAX_TRADE_SIZE, PRICE_FLOOR, PRICE_CEILING } from "@/lib/tradingEngine";
import { getEngineOptions, type PricingEngineType } from "@/lib/pricing";

// ── Market Templates ──────────────────────────────────────────────

export interface MarketTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultLeague: string;
  defaultSport: string;
  defaultOutcomes: string[];
  suggestedLiquidity: number;
}

export const MARKET_TEMPLATES: MarketTemplate[] = [
  {
    id: "game-winner", name: "Game Winner", category: "Game",
    description: "Which team wins the game?",
    defaultLeague: "", defaultSport: "",
    defaultOutcomes: ["Home Team", "Away Team"],
    suggestedLiquidity: 100,
  },
  {
    id: "series-winner", name: "Series Winner", category: "Playoff",
    description: "Which team wins the best-of series?",
    defaultLeague: "", defaultSport: "",
    defaultOutcomes: ["Team A", "Team B"],
    suggestedLiquidity: 150,
  },
  {
    id: "tournament-winner", name: "Tournament Winner", category: "Tournament",
    description: "Who will win the tournament or championship?",
    defaultLeague: "", defaultSport: "",
    defaultOutcomes: ["Team 1", "Team 2", "Team 3", "Team 4", "Field"],
    suggestedLiquidity: 200,
  },
  {
    id: "first-scorer", name: "First Scorer", category: "Player Prop",
    description: "Which player will score first?",
    defaultLeague: "", defaultSport: "",
    defaultOutcomes: ["Player A", "Player B", "Player C", "Other"],
    suggestedLiquidity: 120,
  },
  {
    id: "award-winner", name: "Award Winner", category: "Award",
    description: "Who wins the award (MVP, Cy Young, etc.)?",
    defaultLeague: "", defaultSport: "",
    defaultOutcomes: ["Candidate 1", "Candidate 2", "Candidate 3", "Candidate 4", "Candidate 5"],
    suggestedLiquidity: 180,
  },
  {
    id: "playoff-qualification", name: "Playoff Qualification", category: "Season",
    description: "Will this team make the playoffs?",
    defaultLeague: "", defaultSport: "",
    defaultOutcomes: ["Yes", "No"],
    suggestedLiquidity: 100,
  },
  {
    id: "division-champion", name: "Division Champion", category: "Season",
    description: "Which team wins the division?",
    defaultLeague: "", defaultSport: "",
    defaultOutcomes: ["Team 1", "Team 2", "Team 3", "Team 4"],
    suggestedLiquidity: 160,
  },
  {
    id: "over-under", name: "Over/Under (Placeholder)", category: "Game",
    description: "Will the total be over or under the line? (Coming soon: custom line entry)",
    defaultLeague: "", defaultSport: "",
    defaultOutcomes: ["Over", "Under"],
    suggestedLiquidity: 100,
  },
];

const MAX_OUTCOMES = 10;

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
  const [transactionFeePct, setTransactionFeePct] = useState(0);
  const [spread, setSpread] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const engineOptions = getEngineOptions();

  const applyTemplate = (templateId: string) => {
    const t = MARKET_TEMPLATES.find((m) => m.id === templateId);
    if (!t) return;
    setSelectedTemplate(templateId);
    setDescription(t.description);
    setOutcomes(t.defaultOutcomes);
    setLiquidity(t.suggestedLiquidity);
    if (t.defaultLeague) setLeague(t.defaultLeague);
    if (t.defaultSport) setSport(t.defaultSport);
  };

  const addOutcome = () => {
    if (outcomes.length >= MAX_OUTCOMES) return;
    setOutcomes([...outcomes, ""]);
  };
  const removeOutcome = (i: number) => {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter((_, idx) => idx !== i));
  };
  const updateOutcome = (i: number, val: string) => {
    const next = [...outcomes];
    next[i] = val;
    setOutcomes(next);
  };

  const canSubmit = title.trim() && league.trim() && outcomes.every((o) => o.trim()) && outcomes.length >= 2 && outcomes.length <= MAX_OUTCOMES;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createMarket(
      title, league, sport || league, startTime || "TBD", description,
      outcomes.filter((o) => o.trim()), liquidity, engineType, maxTradeSize, priceFloor, priceCeiling
    );
    onClose();
  };

  const selectedEngine = engineOptions.find((e) => e.value === engineType);
  const evenPrice = outcomes.length > 0 ? Math.round((100 / outcomes.length) * 10) / 10 : 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create New Market</CardTitle>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Templates */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />Quick Template
            </label>
            <div className="flex flex-wrap gap-2">
              {MARKET_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    selectedTemplate === t.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted border-border"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

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

          {/* Outcomes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Outcomes * ({outcomes.length}/{MAX_OUTCOMES})</label>
              <Badge variant="outline" className="text-xs font-mono">{evenPrice.toFixed(1)}¢ each</Badge>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {outcomes.map((o, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}.</span>
                  <Input
                    value={o}
                    onChange={(e) => updateOutcome(i, e.target.value)}
                    placeholder={`Outcome ${i + 1}`}
                    className="flex-1"
                  />
                  {outcomes.length > 2 && (
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeOutcome(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {outcomes.length < MAX_OUTCOMES && (
              <Button variant="outline" size="sm" onClick={addOutcome}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Outcome
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Prices auto-set to even split. {outcomes.length} outcomes = {evenPrice.toFixed(1)}¢ each.
            </p>
          </div>

          {/* Engine & Advanced */}
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Liquidity Parameter</label>
            <Input type="number" value={liquidity} onChange={(e) => setLiquidity(Number(e.target.value))} min={10} max={1000} />
            <p className="text-xs text-muted-foreground">Higher = less price movement per trade (default: 100)</p>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            {showAdvanced ? "Hide" : "Show"} advanced settings
          </button>

          {showAdvanced && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Max Trade Size</label>
                  <Input type="number" value={maxTradeSize} onChange={(e) => setMaxTradeSize(Number(e.target.value))} min={1} max={10000} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Price Floor</label>
                  <Input type="number" value={priceFloor} onChange={(e) => setPriceFloor(Number(e.target.value))} min={0.01} max={0.49} step={0.01} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Price Ceiling</label>
                  <Input type="number" value={priceCeiling} onChange={(e) => setPriceCeiling(Number(e.target.value))} min={0.51} max={0.99} step={0.01} />
                </div>
              </div>
            </div>
          )}

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
