import { useMemo, useState } from "react";
import {
  Zap,
  Plus,
  Send,
  Trash2,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  History,
  Newspaper,
  Cloud,
  UserX,
  Users as UsersIcon,
  CalendarClock,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarket,
  SHOCK_LABELS,
  type ShockKind,
  type ShockTruth,
  type ShockUrgency,
  type ShockConfidence,
  type ShockVisibility,
  type ShockEvent,
} from "@/context/MarketContext";
import {
  analyzeShockReactions,
  compareTruthReactions,
} from "@/lib/shockAnalytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SHOCK_KINDS: ShockKind[] = [
  "breaking-news", "player-injury", "lineup-change", "weather",
  "coach-change", "suspension", "schedule-change", "confidence-shock",
  "rumor", "false-alarm",
];

const SHOCK_ICONS: Partial<Record<ShockKind, typeof Zap>> = {
  "breaking-news": Newspaper,
  "player-injury": UserX,
  "weather": Cloud,
  "rumor": Megaphone,
  "correction": CheckCircle2,
};

const QUICK_TEMPLATES: Array<{
  kind: ShockKind;
  title: string;
  description: string;
  urgency: ShockUrgency;
  confidence: ShockConfidence;
}> = [
  { kind: "breaking-news", title: "Breaking: trade rumor", description: "Reports of a potential roster move emerging in the next 24 hours.", urgency: "breaking", confidence: "low" },
  { kind: "player-injury", title: "Star player questionable", description: "Team's leading scorer listed as questionable with a minor injury.", urgency: "breaking", confidence: "medium" },
  { kind: "weather", title: "Weather delay possible", description: "Forecast shows storms in the area; game may be delayed.", urgency: "routine", confidence: "medium" },
  { kind: "rumor", title: "Locker room tension", description: "Unconfirmed reports of disagreements between coach and players.", urgency: "breaking", confidence: "low" },
];

export function ShockEventConsole() {
  const {
    markets, classroom, students,
    shockEvents, trades,
    createShockEvent, releaseShockEvent, cancelShockEvent,
    correctShockEvent, deleteShockEvent, updateShockTruthStatus,
  } = useMarket();

  const classMarkets = markets.filter((m) => m.classroomId === classroom.id);
  const classShocks = shockEvents.filter((s) => s.classroomId === classroom.id);

  const [creating, setCreating] = useState(false);
  const [correcting, setCorrecting] = useState<ShockEvent | null>(null);
  const [replayShock, setReplayShock] = useState<ShockEvent | null>(null);

  // Form state
  const [kind, setKind] = useState<ShockKind>("breaking-news");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [marketIds, setMarketIds] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<ShockConfidence>("medium");
  const [urgency, setUrgency] = useState<ShockUrgency>("breaking");
  const [visibility, setVisibility] = useState<ShockVisibility>("everyone");
  const [audienceUserIds, setAudienceUserIds] = useState<string[]>([]);
  const [truthStatus, setTruthStatus] = useState<ShockTruth>("unresolved");
  const [scheduledFor, setScheduledFor] = useState("");

  const resetForm = () => {
    setKind("breaking-news");
    setTitle(""); setDescription(""); setMarketIds([]);
    setConfidence("medium"); setUrgency("breaking");
    setVisibility("everyone"); setAudienceUserIds([]);
    setTruthStatus("unresolved"); setScheduledFor("");
  };

  const applyTemplate = (t: typeof QUICK_TEMPLATES[number]) => {
    setKind(t.kind);
    setTitle(t.title);
    setDescription(t.description);
    setUrgency(t.urgency);
    setConfidence(t.confidence);
    setCreating(true);
  };

  const handleSubmit = (releaseNow: boolean) => {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    createShockEvent({
      kind, title: title.trim(), description: description.trim(),
      marketIds, confidence, urgency, visibility,
      audienceUserIds: visibility === "subgroup" ? audienceUserIds : [],
      truthStatus,
      scheduledFor: releaseNow ? null : (scheduledFor ? new Date(scheduledFor).toISOString() : null),
      releaseNow,
    });
    resetForm();
    setCreating(false);
    toast.success(releaseNow ? "Shock released to class" : "Shock scheduled");
  };

  const displayNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of students) map[s.userId] = s.displayName;
    return map;
  }, [students]);

  const reactions = useMemo(
    () => analyzeShockReactions({
      shocks: classShocks, markets: classMarkets, trades, displayNames,
    }),
    [classShocks, classMarkets, trades, displayNames],
  );

  const truthCompare = useMemo(() => compareTruthReactions(reactions), [reactions]);

  const scheduled = classShocks.filter((s) => s.status === "scheduled");
  const released = classShocks.filter((s) => s.status === "released" || s.status === "corrected");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            Shock Event Console
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Trigger market-relevant events live, schedule them ahead of time, or correct
            previous events. Students see a news feed and breaking-news banners on
            affected markets.
          </p>

          <div className="flex flex-wrap gap-2">
            <Dialog open={creating} onOpenChange={(v) => { setCreating(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />New shock event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>New shock event</DialogTitle></DialogHeader>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select value={kind} onValueChange={(v) => setKind(v as ShockKind)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SHOCK_KINDS.map((k) => (
                            <SelectItem key={k} value={k}>{SHOCK_LABELS[k]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Urgency</Label>
                      <Select value={urgency} onValueChange={(v) => setUrgency(v as ShockUrgency)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breaking">Urgent breaking news</SelectItem>
                          <SelectItem value="routine">Routine update</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline shown to students" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short body text" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Confidence</Label>
                      <Select value={confidence} onValueChange={(v) => setConfidence(v as ShockConfidence)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (unconfirmed)</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High (confirmed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Truth status</Label>
                      <Select value={truthStatus} onValueChange={(v) => setTruthStatus(v as ShockTruth)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unresolved">Unresolved (decide later)</SelectItem>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False alarm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Linked markets</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto rounded-md border p-2">
                      {classMarkets.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">No markets in classroom.</p>
                      ) : classMarkets.map((m) => {
                        const checked = marketIds.includes(m.id);
                        return (
                          <label key={m.id} className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => setMarketIds(
                                v ? [...marketIds, m.id] : marketIds.filter((x) => x !== m.id),
                              )}
                            />
                            <span className="truncate">{m.title}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Leave empty to apply to all markets.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Visibility</Label>
                    <Select value={visibility} onValueChange={(v) => setVisibility(v as ShockVisibility)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone in class</SelectItem>
                        <SelectItem value="subgroup">Specific students only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {visibility === "subgroup" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Audience</Label>
                      <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto rounded-md border p-2">
                        {students.map((s) => {
                          const checked = audienceUserIds.includes(s.userId);
                          return (
                            <label key={s.userId} className="flex items-center gap-2 text-xs cursor-pointer">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => setAudienceUserIds(
                                  v ? [...audienceUserIds, s.userId] : audienceUserIds.filter((x) => x !== s.userId),
                                )}
                              />
                              <span className="truncate">{s.displayName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1.5">
                      <CalendarClock className="h-3 w-3" />Schedule for later (optional)
                    </Label>
                    <Input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                  <Button variant="ghost" onClick={() => { setCreating(false); resetForm(); }}>Cancel</Button>
                  {scheduledFor && (
                    <Button variant="outline" onClick={() => handleSubmit(false)}>
                      <Clock className="h-3.5 w-3.5 mr-1.5" />Schedule
                    </Button>
                  )}
                  <Button onClick={() => handleSubmit(true)}>
                    <Send className="h-3.5 w-3.5 mr-1.5" />Release now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick templates for live use */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Quick launch</p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_TEMPLATES.map((t) => (
                <Button
                  key={t.title}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => applyTemplate(t)}
                >
                  <Zap className="h-3 w-3 mr-1.5 text-warning shrink-0" />
                  <span className="truncate">{t.title}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            <Send className="h-3.5 w-3.5 mr-1.5" />Released ({released.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="h-3.5 w-3.5 mr-1.5" />Scheduled ({scheduled.length})
          </TabsTrigger>
          <TabsTrigger value="impact">
            <History className="h-3.5 w-3.5 mr-1.5" />Impact analytics
          </TabsTrigger>
          <TabsTrigger value="replay">
            <Newspaper className="h-3.5 w-3.5 mr-1.5" />Replay
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-2">
          {released.length === 0 ? (
            <Card><CardContent className="text-xs text-muted-foreground text-center py-8">No shocks released yet.</CardContent></Card>
          ) : released.map((s) => (
            <ShockRow
              key={s.id}
              shock={s}
              onCancel={() => { if (confirm("Cancel this shock?")) { cancelShockEvent(s.id); toast.info("Shock cancelled"); } }}
              onCorrect={() => setCorrecting(s)}
              onDelete={() => { if (confirm("Delete this shock?")) { deleteShockEvent(s.id); toast.info("Deleted"); } }}
              onTruthChange={(v) => updateShockTruthStatus(s.id, v)}
              onReplay={() => setReplayShock(s)}
            />
          ))}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-2">
          {scheduled.length === 0 ? (
            <Card><CardContent className="text-xs text-muted-foreground text-center py-8">No scheduled shocks.</CardContent></Card>
          ) : scheduled.map((s) => (
            <ShockRow
              key={s.id}
              shock={s}
              onRelease={() => { releaseShockEvent(s.id); toast.success("Released"); }}
              onCancel={() => { if (confirm("Cancel this scheduled shock?")) { cancelShockEvent(s.id); } }}
              onDelete={() => { if (confirm("Delete?")) { deleteShockEvent(s.id); } }}
              onTruthChange={(v) => updateShockTruthStatus(s.id, v)}
            />
          ))}
        </TabsContent>

        <TabsContent value="impact">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />Reaction analytics (5-min window)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reactions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No released shocks to analyze yet.
                </p>
              ) : (
                <>
                  {/* Truth comparison */}
                  {(truthCompare.trueShocks.count > 0 || truthCompare.falseShocks.count > 0) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md border p-2">
                        <p className="text-[11px] text-muted-foreground">True shocks ({truthCompare.trueShocks.count})</p>
                        <div className="text-xs space-y-0.5 mt-1">
                          <p>Volume surge: <strong className="font-mono">{truthCompare.trueShocks.avgVolumeSurge.toFixed(2)}×</strong></p>
                          <p>Avg price move: <strong className="font-mono">{(truthCompare.trueShocks.avgPriceMove * 100).toFixed(1)}¢</strong></p>
                          <p>Reversal rate: <strong className="font-mono">{(truthCompare.trueShocks.avgReversalRate * 100).toFixed(0)}%</strong></p>
                        </div>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-[11px] text-muted-foreground">False alarms ({truthCompare.falseShocks.count})</p>
                        <div className="text-xs space-y-0.5 mt-1">
                          <p>Volume surge: <strong className="font-mono">{truthCompare.falseShocks.avgVolumeSurge.toFixed(2)}×</strong></p>
                          <p>Avg price move: <strong className="font-mono">{(truthCompare.falseShocks.avgPriceMove * 100).toFixed(1)}¢</strong></p>
                          <p>Reversal rate: <strong className="font-mono">{(truthCompare.falseShocks.avgReversalRate * 100).toFixed(0)}%</strong></p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Per-shock detail */}
                  <div className="space-y-2">
                    {reactions.map((r) => (
                      <div key={r.shockId} className="rounded-md border p-2 text-xs space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="font-medium">{r.shock.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {SHOCK_LABELS[r.shock.kind]} · {r.shock.truthStatus}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="rounded bg-muted/30 p-1.5">
                            <p className="text-[10px] text-muted-foreground">Vol surge</p>
                            <p className="font-mono font-medium">{r.volumeSurge.toFixed(2)}×</p>
                          </div>
                          <div className="rounded bg-muted/30 p-1.5">
                            <p className="text-[10px] text-muted-foreground">Reactors</p>
                            <p className="font-mono font-medium">{r.reactorCount}</p>
                          </div>
                          <div className="rounded bg-muted/30 p-1.5">
                            <p className="text-[10px] text-muted-foreground">Markets</p>
                            <p className="font-mono font-medium">{r.perMarket.length}</p>
                          </div>
                        </div>
                        {r.firstReactors.length > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            First reactors: {r.firstReactors.map((f) => `${f.displayName} (+${f.secondsAfter}s)`).join(", ")}
                          </p>
                        )}
                        {r.perMarket.filter((m) => m.priceMove > 0).map((m) => (
                          <div key={m.marketId} className="text-[11px]">
                            <span className="text-muted-foreground">{m.marketTitle}:</span>{" "}
                            <span>{(m.priceMove * 100).toFixed(1)}¢ {m.direction > 0 ? "↑" : "↓"} on {m.movedOutcomeName}</span>
                            {m.reversed && <Badge variant="outline" className="ml-1.5 text-[9px]">reversed</Badge>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replay">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Replay shocks for debrief</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {released.length === 0 ? (
                <p className="text-xs text-muted-foreground">No released shocks.</p>
              ) : released.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-2"
                  onClick={() => setReplayShock(s)}
                >
                  <Newspaper className="h-3 w-3 mr-1.5 shrink-0" />
                  <span className="truncate">{s.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {s.releasedAt && new Date(s.releasedAt).toLocaleTimeString()}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Correction dialog */}
      {correcting && (
        <CorrectionDialog
          shock={correcting}
          onClose={() => setCorrecting(null)}
          onSubmit={(c) => {
            correctShockEvent(correcting.id, c);
            toast.success("Correction released");
            setCorrecting(null);
          }}
        />
      )}

      {/* Replay dialog */}
      {replayShock && (
        <ReplayDialog
          shock={replayShock}
          reaction={reactions.find((r) => r.shockId === replayShock.id)}
          onClose={() => setReplayShock(null)}
        />
      )}
    </div>
  );
}

function ShockRow({
  shock, onRelease, onCancel, onCorrect, onDelete, onTruthChange, onReplay,
}: {
  shock: ShockEvent;
  onRelease?: () => void;
  onCancel?: () => void;
  onCorrect?: () => void;
  onDelete?: () => void;
  onTruthChange: (v: ShockTruth) => void;
  onReplay?: () => void;
}) {
  const Icon = SHOCK_ICONS[shock.kind] ?? Zap;
  return (
    <Card className={cn(
      shock.urgency === "breaking" && shock.status === "released" && "border-warning/40",
      shock.status === "cancelled" && "opacity-60",
    )}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", shock.urgency === "breaking" ? "text-warning" : "text-muted-foreground")} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{shock.title}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{shock.description}</p>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <Badge variant="outline" className="text-[10px]">{SHOCK_LABELS[shock.kind]}</Badge>
                <Badge variant="outline" className="text-[10px]">conf: {shock.confidence}</Badge>
                <Badge variant="outline" className="text-[10px]">{shock.visibility === "everyone" ? "all" : `${shock.audienceUserIds.length} students`}</Badge>
                {shock.releasedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    · {new Date(shock.releasedAt).toLocaleTimeString()}
                  </span>
                )}
                {shock.scheduledFor && shock.status === "scheduled" && (
                  <span className="text-[10px] text-muted-foreground">
                    · scheduled {new Date(shock.scheduledFor).toLocaleString()}
                  </span>
                )}
                {shock.status === "cancelled" && <Badge variant="outline" className="text-[10px]">CANCELLED</Badge>}
                {shock.status === "corrected" && <Badge variant="outline" className="text-[10px] border-info text-info">CORRECTED</Badge>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Select value={shock.truthStatus} onValueChange={(v) => onTruthChange(v as ShockTruth)}>
            <SelectTrigger className="h-7 text-[11px] w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False alarm</SelectItem>
            </SelectContent>
          </Select>
          {onRelease && (
            <Button size="sm" variant="default" className="h-7 text-[11px]" onClick={onRelease}>
              <Send className="h-3 w-3 mr-1" />Release now
            </Button>
          )}
          {onCorrect && shock.status === "released" && shock.kind !== "correction" && (
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onCorrect}>
              <AlertTriangle className="h-3 w-3 mr-1" />Correct
            </Button>
          )}
          {onReplay && (
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={onReplay}>
              <Newspaper className="h-3 w-3 mr-1" />Replay
            </Button>
          )}
          {onCancel && shock.status !== "cancelled" && (
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={onCancel}>
              <XCircle className="h-3 w-3 mr-1" />Cancel
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-auto" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CorrectionDialog({
  shock, onClose, onSubmit,
}: {
  shock: ShockEvent;
  onClose: () => void;
  onSubmit: (c: { title: string; description: string }) => void;
}) {
  const [title, setTitle] = useState(`CORRECTION: ${shock.title}`);
  const [description, setDescription] = useState(`The earlier report ("${shock.title}") has been retracted. `);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Issue correction</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            This marks the original as a false alarm and releases a correction notice to the same audience.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Correction title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Correction text</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ title, description })}>Release correction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReplayDialog({
  shock, reaction, onClose,
}: {
  shock: ShockEvent;
  reaction?: ReturnType<typeof analyzeShockReactions>[number];
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />Replay: {shock.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-md border-l-4 border-warning bg-warning/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px]">{SHOCK_LABELS[shock.kind]}</Badge>
              <span className="text-[11px] text-muted-foreground">
                {shock.releasedAt && new Date(shock.releasedAt).toLocaleString()}
              </span>
            </div>
            <p className="font-medium">{shock.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{shock.description}</p>
          </div>
          {reaction && (
            <div className="space-y-2 text-xs">
              <p className="font-semibold">Class reaction (first 5 min)</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border p-2">
                  <p className="text-[10px] text-muted-foreground">Volume surge</p>
                  <p className="font-mono font-medium">{reaction.volumeSurge.toFixed(2)}×</p>
                </div>
                <div className="rounded border p-2">
                  <p className="text-[10px] text-muted-foreground">Reactors</p>
                  <p className="font-mono font-medium">{reaction.reactorCount}</p>
                </div>
                <div className="rounded border p-2">
                  <p className="text-[10px] text-muted-foreground">Trades after</p>
                  <p className="font-mono font-medium">{reaction.perMarket.reduce((s, m) => s + m.postTrades, 0)}</p>
                </div>
              </div>
              {reaction.firstReactors.length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">First reactors</p>
                  <ul className="space-y-0.5">
                    {reaction.firstReactors.map((f) => (
                      <li key={f.userId} className="flex justify-between">
                        <span>{f.displayName}</span>
                        <span className="font-mono text-muted-foreground">+{f.secondsAfter}s</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reaction.perMarket.filter((m) => m.priceMove > 0).map((m) => (
                <div key={m.marketId} className="rounded border p-2">
                  <p className="font-medium">{m.marketTitle}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(m.priceMove * 100).toFixed(1)}¢ {m.direction > 0 ? "↑" : "↓"} on {m.movedOutcomeName}
                    {m.reversed && " · partially reversed"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
