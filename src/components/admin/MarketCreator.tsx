import { useState, useMemo } from "react";
import { Plus, X, Zap, Save, BookOpen, ChevronLeft, ChevronRight, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarket, type SavedTemplate } from "@/context/MarketContext";
import { DEFAULT_LIQUIDITY, DEFAULT_MAX_TRADE_SIZE, PRICE_FLOOR, PRICE_CEILING } from "@/lib/tradingEngine";
import type { MarketCategory, DifficultyLevel } from "@/lib/tradingEngine";
import { getEngineOptions, type PricingEngineType } from "@/lib/pricing";
import { MarketTemplateManager, type BuiltInTemplate, BUILT_IN_TEMPLATES } from "./MarketTemplateManager";
import { toast } from "sonner";

const MAX_OUTCOMES = 10;

const SPORTS = ["Basketball", "Football", "Soccer", "Baseball", "Hockey", "Tennis", "Golf", "MMA", "Other"];
const LEAGUES = ["NBA", "NFL", "MLB", "NHL", "Premier League", "La Liga", "UEFA", "ATP", "PGA", "UFC", "Other"];
const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

type Step = "template" | "details" | "outcomes" | "config" | "review";
const STEPS: Step[] = ["template", "details", "outcomes", "config", "review"];
const STEP_LABELS: Record<Step, string> = {
  template: "Template",
  details: "Event Details",
  outcomes: "Outcomes & Probabilities",
  config: "Configuration",
  review: "Review & Create",
};

export function MarketCreator({ onClose }: { onClose: () => void }) {
  const { createMarket, saveTemplate, bulkCreateMarkets } = useMarket();
  const [step, setStep] = useState<Step>("template");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Market fields
  const [title, setTitle] = useState("");
  const [league, setLeague] = useState("");
  const [sport, setSport] = useState("");
  const [startTime, setStartTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [description, setDescription] = useState("");
  const [outcomes, setOutcomes] = useState(["", ""]);
  const [customPrices, setCustomPrices] = useState<number[]>([]);
  const [useCustomPrices, setUseCustomPrices] = useState(false);
  const [liquidity, setLiquidity] = useState(DEFAULT_LIQUIDITY);
  const [engineType, setEngineType] = useState<PricingEngineType>("linear-impact");
  const [maxTradeSize, setMaxTradeSize] = useState(DEFAULT_MAX_TRADE_SIZE);
  const [priceFloor, setPriceFloor] = useState(PRICE_FLOOR);
  const [priceCeiling, setPriceCeiling] = useState(PRICE_CEILING);
  const [transactionFeePct, setTransactionFeePct] = useState(0);
  const [spread, setSpread] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Metadata
  const [category, setCategory] = useState<MarketCategory>("custom");
  const [season, setSeason] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [teamNames, setTeamNames] = useState("");
  const [playerNames, setPlayerNames] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [instructionalNotes, setInstructionalNotes] = useState("");
  const [settlementRules, setSettlementRules] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Bulk import
  const [bulkText, setBulkText] = useState("");

  const engineOptions = getEngineOptions();
  const evenPrice = outcomes.length > 0 ? 1 / outcomes.length : 0.5;

  const applyTemplate = (template: BuiltInTemplate | SavedTemplate) => {
    setDescription(template.description);
    setOutcomes(template.outcomes);
    setLiquidity(template.liquidity);
    setCategory(template.category);
    setDifficulty(template.difficultyLevel);
    setSelectedTemplateId(template.id);
    if (template.sport) setSport(template.sport);
    if (template.league) setLeague(template.league);
    if ("settlementRules" in template && template.settlementRules) setSettlementRules(template.settlementRules);
    if ("instructionalNotes" in template && template.instructionalNotes) setInstructionalNotes(template.instructionalNotes);
    setCustomPrices([]);
    setUseCustomPrices(false);
    setShowTemplateManager(false);
    setStep("details");
    toast.success(`Template "${template.name}" applied`);
  };

  const addOutcome = () => {
    if (outcomes.length >= MAX_OUTCOMES) return;
    setOutcomes([...outcomes, ""]);
    if (useCustomPrices) setCustomPrices([...customPrices, evenPrice]);
  };

  const removeOutcome = (i: number) => {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter((_, idx) => idx !== i));
    if (useCustomPrices) setCustomPrices(customPrices.filter((_, idx) => idx !== i));
  };

  const updateOutcome = (i: number, val: string) => {
    const next = [...outcomes];
    next[i] = val;
    setOutcomes(next);
  };

  const updateCustomPrice = (i: number, val: number) => {
    const next = [...customPrices];
    next[i] = Math.max(0.01, Math.min(0.99, val));
    setCustomPrices(next);
  };

  const normalizeCustomPrices = () => {
    if (customPrices.length === 0) return;
    const sum = customPrices.reduce((s, p) => s + p, 0);
    if (sum === 0) return;
    setCustomPrices(customPrices.map((p) => Math.round((p / sum) * 1000) / 1000));
  };

  const initCustomPrices = () => {
    setUseCustomPrices(true);
    setCustomPrices(outcomes.map(() => Math.round(evenPrice * 1000) / 1000));
  };

  const priceSum = useCustomPrices ? customPrices.reduce((s, p) => s + p, 0) : 1;
  const priceWarning = useCustomPrices && Math.abs(priceSum - 1) > 0.01;

  const canSubmit = title.trim() && league.trim() && outcomes.every((o) => o.trim()) && outcomes.length >= 2;

  const stepIndex = STEPS.indexOf(step);
  const canNext = () => {
    switch (step) {
      case "template": return true;
      case "details": return title.trim() && league.trim();
      case "outcomes": return outcomes.every((o) => o.trim()) && outcomes.length >= 2;
      case "config": return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1]);
  };
  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const metadata = {
      category,
      difficultyLevel: difficulty,
      season: season || undefined,
      eventDate: eventDate || undefined,
      teamNames: teamNames ? teamNames.split(",").map((t) => t.trim()) : undefined,
      playerNames: playerNames ? playerNames.split(",").map((p) => p.trim()) : undefined,
      instructionalNotes: instructionalNotes || undefined,
      settlementRules: settlementRules || undefined,
      templateId: selectedTemplateId || undefined,
    };
    const finalPrices = useCustomPrices && customPrices.length === outcomes.length ? customPrices : undefined;
    createMarket(
      title, league, sport || league, startTime || "TBD", description,
      outcomes.filter((o) => o.trim()), liquidity, engineType, maxTradeSize, priceFloor, priceCeiling,
      transactionFeePct / 100, spread, metadata, finalPrices
    );
    toast.success("Market created!");
    onClose();
  };

  const handleSaveAsTemplate = () => {
    const template: SavedTemplate = {
      id: `tpl-${crypto.randomUUID().slice(0, 8)}`,
      name: title || "Untitled Template",
      category,
      sport: sport || "",
      league: league || "",
      description,
      outcomes: outcomes.filter((o) => o.trim()),
      liquidity,
      difficultyLevel: difficulty,
      settlementRules: settlementRules || undefined,
      instructionalNotes: instructionalNotes || undefined,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    saveTemplate(template);
    toast.success("Saved as template!");
  };

  const [bulkParsed, setBulkParsed] = useState<Array<{ title: string; league: string; sport: string; startTime: string; description: string; outcomes: string[] }>>([]);
  const [bulkStep, setBulkStep] = useState<"paste" | "review">("paste");

  const parseBulkText = () => {
    try {
      const lines = bulkText.trim().split("\n").filter((l) => l.trim());
      const parsed = lines.map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length < 4) throw new Error("Each line needs: Title | League | Sport | Outcome1, Outcome2, ...");
        const [t, l, s, outcomesStr, ...rest] = parts;
        return {
          title: t,
          league: l,
          sport: s,
          startTime: rest[0] || "TBD",
          description: rest[1] || "",
          outcomes: outcomesStr.split(",").map((o) => o.trim()),
        };
      });
      setBulkParsed(parsed);
      setBulkStep("review");
    } catch (e: any) {
      toast.error(e.message || "Invalid format");
    }
  };

  const removeBulkItem = (idx: number) => {
    setBulkParsed((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateBulkItem = (idx: number, field: string, value: string) => {
    setBulkParsed((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleBulkImport = () => {
    if (bulkParsed.length === 0) return;
    const configs = bulkParsed.map((item) => ({
      ...item,
      liquidity: DEFAULT_LIQUIDITY,
      metadata: { category: "custom" as MarketCategory },
    }));
    bulkCreateMarkets(configs);
    toast.success(`${configs.length} markets created!`);
    setShowBulkImport(false);
    onClose();
  };

  if (showTemplateManager) {
    return <MarketTemplateManager onSelectTemplate={applyTemplate} onBulkImport={() => { setShowTemplateManager(false); setShowBulkImport(true); }} onClose={() => setShowTemplateManager(false)} />;
  }

  if (showBulkImport) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setShowBulkImport(false)} />
        <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Bulk Import Markets</CardTitle>
            <button onClick={() => { setShowBulkImport(false); setBulkStep("paste"); }} className="p-1.5 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
          </CardHeader>
          <CardContent className="space-y-4">
            {bulkStep === "paste" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Paste one market per line. Format: <code className="text-xs bg-muted px-1 py-0.5 rounded">Title | League | Sport | Outcome1, Outcome2 | StartTime | Description</code>
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={8}
                  placeholder={`Lakers vs Celtics | NBA | Basketball | Lakers Win, Celtics Win | Tonight 8PM | Regular season game\nChiefs vs Bills | NFL | Football | Chiefs Win, Bills Win | Sunday 4PM | AFC Championship`}
                  className="w-full rounded-lg border bg-background p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  {bulkText.trim().split("\n").filter((l) => l.trim()).length} market(s) detected
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowBulkImport(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={parseBulkText} disabled={!bulkText.trim()}>
                    Review Markets →
                  </Button>
                </div>
              </>
            )}

            {bulkStep === "review" && (
              <>
                <p className="text-sm text-muted-foreground">Review and edit before importing. Remove any you don't want.</p>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {bulkParsed.map((item, idx) => (
                    <div key={idx} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Input
                          value={item.title}
                          onChange={(e) => updateBulkItem(idx, "title", e.target.value)}
                          className="font-semibold h-8"
                        />
                        <button onClick={() => removeBulkItem(idx)} className="p-1 rounded hover:bg-muted shrink-0">
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input value={item.league} onChange={(e) => updateBulkItem(idx, "league", e.target.value)} placeholder="League" className="h-7 text-xs" />
                        <Input value={item.sport} onChange={(e) => updateBulkItem(idx, "sport", e.target.value)} placeholder="Sport" className="h-7 text-xs" />
                        <Input value={item.startTime} onChange={(e) => updateBulkItem(idx, "startTime", e.target.value)} placeholder="Start time" className="h-7 text-xs" />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.outcomes.map((o, oi) => (
                          <Badge key={oi} variant="secondary" className="text-[10px]">{o}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {bulkParsed.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">All markets removed.</p>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setBulkStep("paste")}>← Back</Button>
                  <Button className="flex-1" onClick={handleBulkImport} disabled={bulkParsed.length === 0}>
                    Import {bulkParsed.length} Market{bulkParsed.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create New Market</CardTitle>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => setStep(s)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors w-full justify-center ${
                    step === s ? "bg-primary text-primary-foreground" : i < stepIndex ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="font-mono">{i + 1}</span>
                  <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Step: Template */}
          {step === "template" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Start from a template or create from scratch.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUILT_IN_TEMPLATES.slice(0, 6).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className={`p-3 rounded-lg border text-left hover:border-primary/50 transition-colors space-y-1 ${
                      selectedTemplateId === t.id ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <p className="text-xs font-semibold">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{t.description}</p>
                    <Badge variant="secondary" className="text-[9px]">{t.outcomes.length} outcomes</Badge>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowTemplateManager(true)}>
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />All Templates
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowBulkImport(true)}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />Bulk Import
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setStep("details")}>
                Skip — create from scratch
              </Button>
            </div>
          )}

          {/* Step: Details */}
          {step === "details" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Event Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lakers vs Celtics" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">League *</label>
                  <Select value={league} onValueChange={setLeague}>
                    <SelectTrigger><SelectValue placeholder="Select league" /></SelectTrigger>
                    <SelectContent>
                      {LEAGUES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Sport</label>
                  <Select value={sport} onValueChange={setSport}>
                    <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                    <SelectContent>
                      {SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="Tonight, 8:00 PM ET" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Close Time</label>
                  <Input value={closeTime} onChange={(e) => setCloseTime(e.target.value)} placeholder="Before tipoff" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief market description for students..."
                  rows={2}
                  className="w-full rounded-lg border bg-background p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Season</label>
                  <Input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="2025-26" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Event Date</label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Team Names</label>
                  <Input value={teamNames} onChange={(e) => setTeamNames(e.target.value)} placeholder="Lakers, Celtics" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Player Names</label>
                  <Input value={playerNames} onChange={(e) => setPlayerNames(e.target.value)} placeholder="LeBron, Tatum" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={(v) => setCategory(v as MarketCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUILT_IN_TEMPLATES.map((t) => <SelectItem key={t.category} value={t.category}>{t.name}</SelectItem>)}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step: Outcomes */}
          {step === "outcomes" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Outcomes * ({outcomes.length}/{MAX_OUTCOMES})</label>
                <div className="flex items-center gap-2">
                  {!useCustomPrices ? (
                    <button onClick={initCustomPrices} className="text-xs text-primary hover:underline">
                      Set custom probabilities
                    </button>
                  ) : (
                    <button onClick={() => { setUseCustomPrices(false); setCustomPrices([]); }} className="text-xs text-muted-foreground hover:underline">
                      Use even split
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {outcomes.map((o, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}.</span>
                    <Input
                      value={o}
                      onChange={(e) => updateOutcome(i, e.target.value)}
                      placeholder={`Outcome ${i + 1}`}
                      className="flex-1"
                    />
                    {useCustomPrices && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Input
                          type="number"
                          value={customPrices[i] !== undefined ? (customPrices[i] * 100).toFixed(1) : ""}
                          onChange={(e) => updateCustomPrice(i, Number(e.target.value) / 100)}
                          className="w-20 text-right font-mono text-sm"
                          min={1} max={99} step={0.1}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    )}
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

              {useCustomPrices && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Sum: <span className={`font-mono font-bold ${priceWarning ? "text-destructive" : "text-success"}`}>{(priceSum * 100).toFixed(1)}%</span></span>
                    {priceWarning && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs" onClick={normalizeCustomPrices}>
                    Normalize to 100%
                  </Button>
                </div>
              )}

              {!useCustomPrices && (
                <p className="text-xs text-muted-foreground">
                  Even split: {(evenPrice * 100).toFixed(1)}% each
                </p>
              )}

              {/* Settlement rules */}
              <div className="space-y-1.5 pt-2 border-t">
                <label className="text-sm font-medium">Settlement Rules</label>
                <textarea
                  value={settlementRules}
                  onChange={(e) => setSettlementRules(e.target.value)}
                  placeholder="How will this market be settled? What counts as a win?"
                  rows={2}
                  className="w-full rounded-lg border bg-background p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Instructional Notes</label>
                <textarea
                  value={instructionalNotes}
                  onChange={(e) => setInstructionalNotes(e.target.value)}
                  placeholder="Teaching notes for students about this market type..."
                  rows={2}
                  className="w-full rounded-lg border bg-background p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Step: Config */}
          {step === "config" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Pricing Engine</label>
                <Select value={engineType} onValueChange={(v) => setEngineType(v as PricingEngineType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {engineOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Liquidity Parameter</label>
                <Input type="number" value={liquidity} onChange={(e) => setLiquidity(Number(e.target.value))} min={10} max={1000} />
                <p className="text-xs text-muted-foreground">Higher = less price movement per bet</p>
              </div>

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs text-muted-foreground hover:text-foreground underline">
                {showAdvanced ? "Hide" : "Show"} advanced settings
              </button>

              {showAdvanced && (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Max Bet Size</label>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Transaction Fee (%)</label>
                      <Input type="number" value={transactionFeePct} onChange={(e) => setTransactionFeePct(Number(e.target.value))} min={0} max={10} step={0.1} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Spread (¢/unit)</label>
                      <Input type="number" value={spread} onChange={(e) => setSpread(Number(e.target.value))} min={0} max={0.05} step={0.001} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Review */}
          {step === "review" && (
            <div className="space-y-3">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{title || "Untitled"}</h3>
                  <Badge variant="outline" className="text-xs">{category}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">{sport || league}</Badge>
                  <Badge variant="secondary" className="text-xs">{league}</Badge>
                  <Badge variant="outline" className="text-xs">{difficulty}</Badge>
                </div>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
                <p className="text-xs"><span className="text-muted-foreground">Start:</span> {startTime || "TBD"}</p>

                <div className="space-y-1.5 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground">OUTCOMES</p>
                  {outcomes.map((o, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{o || `Outcome ${i + 1}`}</span>
                      <span className="font-mono">
                        {useCustomPrices && customPrices[i] !== undefined
                          ? `${(customPrices[i] * 100).toFixed(1)}%`
                          : `${(evenPrice * 100).toFixed(1)}%`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t text-xs text-muted-foreground">
                  <span>Engine: <span className="font-medium text-foreground">{engineType}</span></span>
                  <span>Liquidity: <span className="font-medium text-foreground">{liquidity}</span></span>
                  {transactionFeePct > 0 && <span>Fee: <span className="font-medium text-foreground">{transactionFeePct}%</span></span>}
                </div>

                {settlementRules && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">SETTLEMENT</p>
                    <p className="text-xs">{settlementRules}</p>
                  </div>
                )}

                {instructionalNotes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">NOTES</p>
                    <p className="text-xs">{instructionalNotes}</p>
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={handleSaveAsTemplate}>
                <Save className="mr-1.5 h-3.5 w-3.5" />Save as Template
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {stepIndex > 0 && (
              <Button variant="outline" onClick={goBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />Back
              </Button>
            )}
            <div className="flex-1" />
            {step === "review" ? (
              <Button variant="hero" disabled={!canSubmit} onClick={handleSubmit}>
                Create Market
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!canNext()}>
                Next<ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
