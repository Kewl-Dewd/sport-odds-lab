import { useMemo, useState } from "react";
import {
  ShieldAlert,
  Megaphone,
  Users2,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  Trash2,
  Flag,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarket,
  SCENARIO_LABELS,
  type ScenarioKind,
} from "@/context/MarketContext";
import {
  summarizeClassIntegrity,
  FLAG_LABELS,
  type IntegrityFlagKind,
} from "@/lib/integrityAnalytics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FLAG_ICONS: Record<IntegrityFlagKind, typeof Zap> = {
  "volume-spike": TrendingUp,
  "rapid-price-move": Zap,
  "trader-concentration": Users2,
  "coordinated-direction": Users2,
  "sharp-reversal": TrendingDown,
  "volatility-spike": Zap,
  "whale-trade": ShieldAlert,
};

const SCENARIO_KINDS: ScenarioKind[] = [
  "rumor-injection",
  "pump-burst",
  "fake-confidence",
  "rumor-overreaction",
  "coordinated-buy",
  "rapid-reversal",
  "herd-setup",
  "bluff-unwind",
];

export function EthicsControlPanel() {
  const {
    markets,
    students,
    classroom,
    trades,
    ethicsSettings,
    updateEthicsSettings,
    scenarioEvents,
    injectScenarioEvent,
    deleteScenarioEvent,
    executeWhaleTrade,
  } = useMarket();

  const classMarkets = markets.filter((m) => m.classroomId === classroom.id);
  const tradeableMarkets = classMarkets.filter((m) => m.status === "open");

  // Scenario form state
  const [scKind, setScKind] = useState<ScenarioKind>("rumor-injection");
  const [scMarketId, setScMarketId] = useState<string>("none");
  const [scNote, setScNote] = useState("");

  // Whale form state
  const [whMarketId, setWhMarketId] = useState<string>("");
  const [whOutcomeId, setWhOutcomeId] = useState<string>("");
  const [whUserId, setWhUserId] = useState<string>("");
  const [whQty, setWhQty] = useState<string>("100");
  const [whType, setWhType] = useState<"BUY" | "SELL">("BUY");

  const whMarket = classMarkets.find((m) => m.id === whMarketId);

  const integrity = useMemo(
    () => summarizeClassIntegrity(classMarkets, trades),
    [classMarkets, trades],
  );

  const classScenarios = scenarioEvents.filter((e) => e.classroomId === classroom.id);

  const handleInject = () => {
    if (!scNote.trim()) {
      toast.error("Add a description for this scenario event");
      return;
    }
    injectScenarioEvent({
      kind: scKind,
      marketId: scMarketId === "none" ? null : scMarketId,
      note: scNote.trim(),
    });
    setScNote("");
    toast.success("Scenario event logged");
  };

  const handleWhale = () => {
    if (!whMarketId || !whOutcomeId || !whUserId) {
      toast.error("Pick market, outcome, and bettor");
      return;
    }
    const qty = Number(whQty);
    if (!qty || qty <= 0) {
      toast.error("Quantity must be positive");
      return;
    }
    if (!ethicsSettings.allowWhaleTrades) {
      toast.error("Enable 'Allow whale bets' in settings first");
      return;
    }
    const trade = executeWhaleTrade({
      marketId: whMarketId,
      outcomeId: whOutcomeId,
      quantity: qty,
      type: whType,
      asUserId: whUserId,
    });
    if (trade) {
      toast.success(`Whale ${whType} executed: ${qty}× ${trade.outcomeName}`);
    } else {
      toast.error("Whale bet failed — check balance / market status");
    }
  };

  return (
    <div className="space-y-4">
      {/* Master toggle + awareness banner */}
      <Card className={cn(ethicsSettings.enabled && "border-warning/40 bg-warning/5")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-warning" />
            Market Manipulation & Ethics Mode
            {ethicsSettings.enabled && (
              <Badge variant="outline" className="text-xs border-warning text-warning">
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            A teaching mode for demonstrating how coordinated behavior, rumors, or
            concentrated trading distort markets. All flags are derived from measured
            activity in the trade ledger — no AI commentary.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <SettingToggle
              label="Enable ethics mode"
              checked={ethicsSettings.enabled}
              onChange={(v) => updateEthicsSettings({ enabled: v })}
            />
            <SettingToggle
              label="Students know manipulation may occur"
              checked={ethicsSettings.studentsAwareOfManipulation}
              onChange={(v) => updateEthicsSettings({ studentsAwareOfManipulation: v })}
            />
            <SettingToggle
              label="Allow rumor injection"
              checked={ethicsSettings.allowRumorInjection}
              onChange={(v) => updateEthicsSettings({ allowRumorInjection: v })}
            />
            <SettingToggle
              label="Allow coordinated team betting"
              checked={ethicsSettings.allowCoordinatedTrading}
              onChange={(v) => updateEthicsSettings({ allowCoordinatedTrading: v })}
            />
            <SettingToggle
              label="Public class chat enabled"
              checked={ethicsSettings.publicChatEnabled}
              onChange={(v) => updateEthicsSettings({ publicChatEnabled: v })}
            />
            <SettingToggle
              label="Allow directional-push group"
              checked={ethicsSettings.allowDirectionalGroup}
              onChange={(v) => updateEthicsSettings({ allowDirectionalGroup: v })}
            />
            <SettingToggle
              label="Allow whale-style bets"
              checked={ethicsSettings.allowWhaleTrades}
              onChange={(v) => updateEthicsSettings({ allowWhaleTrades: v })}
            />
            <SettingToggle
              label="Show detection flags in replay"
              checked={ethicsSettings.detectionFlagsVisible}
              onChange={(v) => updateEthicsSettings({ detectionFlagsVisible: v })}
            />
            <SettingToggle
              label="Show student debrief after experiment"
              checked={ethicsSettings.studentDebriefEnabled}
              onChange={(v) => updateEthicsSettings({ studentDebriefEnabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scenarios">
        <TabsList>
          <TabsTrigger value="scenarios">
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />Inject scenario
          </TabsTrigger>
          <TabsTrigger value="whale">
            <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />Whale trade
          </TabsTrigger>
          <TabsTrigger value="flags">
            <Flag className="h-3.5 w-3.5 mr-1.5" />
            Integrity flags
            {integrity.totalFlags > 0 && (
              <Badge variant="outline" className="ml-1.5 text-xs">{integrity.totalFlags}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="log">
            <Info className="h-3.5 w-3.5 mr-1.5" />Scenario log
          </TabsTrigger>
        </TabsList>

        {/* Inject scenario */}
        <TabsContent value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Inject a scenario event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Recorded as a marker in the replay and student debrief. Use this when
                you start a coordinated push, plant a rumor, or trigger a herd setup.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Scenario type</Label>
                  <Select value={scKind} onValueChange={(v) => setScKind(v as ScenarioKind)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCENARIO_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>{SCENARIO_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Linked market (optional)</Label>
                  <Select value={scMarketId} onValueChange={setScMarketId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific market</SelectItem>
                      {classMarkets.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Rumor planted that the Lakers' starting PG is questionable for tonight"
                  value={scNote}
                  onChange={(e) => setScNote(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={handleInject}>
                <Megaphone className="h-3.5 w-3.5 mr-1.5" />Inject scenario
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Whale trade */}
        <TabsContent value="whale">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Simulate a whale-style bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Execute a large trade attributed to a chosen student account. The trade
                runs through the normal pricing engine and is logged as a scenario event.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Market</Label>
                  <Select value={whMarketId} onValueChange={(v) => { setWhMarketId(v); setWhOutcomeId(""); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Choose market" /></SelectTrigger>
                    <SelectContent>
                      {tradeableMarkets.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Outcome</Label>
                  <Select value={whOutcomeId} onValueChange={setWhOutcomeId} disabled={!whMarket}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Choose outcome" /></SelectTrigger>
                    <SelectContent>
                      {whMarket?.outcomes.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name} ({(o.price * 100).toFixed(0)}¢)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Acting bettor</Label>
                  <Select value={whUserId} onValueChange={setWhUserId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Choose student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.userId} value={s.userId}>
                          {s.displayName} (${s.cash.toFixed(0)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Side</Label>
                  <Select value={whType} onValueChange={(v) => setWhType(v as "BUY" | "SELL")}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUY">BUY</SelectItem>
                      <SelectItem value="SELL">SELL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={whQty}
                    onChange={(e) => setWhQty(e.target.value)}
                    placeholder="100"
                  />
                </div>
              </div>
              <Button size="sm" onClick={handleWhale} disabled={!ethicsSettings.allowWhaleTrades}>
                <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />Execute whale trade
              </Button>
              {!ethicsSettings.allowWhaleTrades && (
                <p className="text-xs text-warning">Enable "Allow whale-style bets" in settings to use this.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrity flags */}
        <TabsContent value="flags">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Flag className="h-4 w-4" />Detected suspicious activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Deterministic detectors over actual trades. These are factual signals
                of unusual market activity — useful for ethical discussion, not accusations.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(integrity.flagsByKind) as IntegrityFlagKind[]).map((k) => (
                  <div key={k} className="rounded-md border p-2">
                    <p className="text-xs text-muted-foreground">{FLAG_LABELS[k]}</p>
                    <p className="text-lg font-bold font-mono">{integrity.flagsByKind[k]}</p>
                  </div>
                ))}
              </div>
              {integrity.totalFlags === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No suspicious patterns detected yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {integrity.reports.flatMap((r) =>
                    r.flags.map((f) => {
                      const Icon = FLAG_ICONS[f.kind];
                      return (
                        <div
                          key={f.id}
                          className="flex items-start gap-2 rounded-md border p-2 text-xs"
                        >
                          <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">
                                {FLAG_LABELS[f.kind]}
                              </Badge>
                              <span className="font-medium truncate">{r.marketTitle}</span>
                              <span className="text-muted-foreground">
                                {new Date(f.at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-0.5">{f.detail}</p>
                          </div>
                        </div>
                      );
                    }),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario log */}
        <TabsContent value="log">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scenario events ({classScenarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {classScenarios.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No scenario events injected yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {classScenarios.map((e) => {
                    const market = e.marketId
                      ? classMarkets.find((m) => m.id === e.marketId)
                      : null;
                    return (
                      <div
                        key={e.id}
                        className="flex items-start gap-2 rounded-md border p-2 text-xs"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">
                              {SCENARIO_LABELS[e.kind]}
                            </Badge>
                            {market && (
                              <span className="font-medium truncate">{market.title}</span>
                            )}
                            <span className="text-muted-foreground">
                              {new Date(e.injectedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-0.5">{e.note}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => { deleteScenarioEvent(e.id); toast.success("Scenario removed"); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs cursor-pointer">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
