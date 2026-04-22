import { useMemo, useState } from "react";
import {
  Brain,
  Plus,
  Trash2,
  Pencil,
  Megaphone,
  Newspaper,
  Anchor,
  History,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarket,
  SUMMARY_STYLE_LABELS,
  type BiasExperiment,
  type BiasFraming,
  type SummaryStyle,
} from "@/context/MarketContext";
import {
  BIAS_LABELS,
  BIAS_DESCRIPTIONS,
  type BiasKind,
} from "@/lib/behavioralAnalytics";
import { BehavioralDebrief } from "@/components/student/BehavioralDebrief";
import { toast } from "sonner";

const BIAS_KINDS: BiasKind[] = [
  "overconfidence",
  "herd-behavior",
  "loss-aversion",
  "anchoring",
  "recency-bias",
  "confirmation-bias",
  "overreaction",
  "underreaction",
  "disposition-effect",
  "gamblers-fallacy",
];

export function BehavioralExperimentPanel() {
  const {
    markets,
    classroom,
    biasExperiments,
    createBiasExperiment,
    updateBiasExperiment,
    deleteBiasExperiment,
    setBiasExperimentMarkets,
    setBiasFraming,
  } = useMarket();

  const classMarkets = markets.filter((m) => m.classroomId === classroom.id);
  const classExperiments = biasExperiments.filter((e) => e.classroomId === classroom.id);

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBias, setNewBias] = useState<BiasKind>("anchoring");
  const [newObjective, setNewObjective] = useState("");
  const [newNotice, setNewNotice] = useState(false);

  const [framingExp, setFramingExp] = useState<BiasExperiment | null>(null);
  const [framingMarketId, setFramingMarketId] = useState<string>("");

  const handleCreate = () => {
    if (!newTitle.trim()) {
      toast.error("Add a title");
      return;
    }
    createBiasExperiment({
      title: newTitle.trim(),
      bias: newBias,
      objective: newObjective.trim(),
      studentNoticeEnabled: newNotice,
    });
    setNewTitle("");
    setNewObjective("");
    setNewNotice(false);
    setCreating(false);
    toast.success("Experiment created");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-info" />
            Behavioral Finance Experiments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Set up structured trading exercises that demonstrate decision-making biases.
            Attach markets, add framing cues (anchors, headlines, news blurbs), and
            review aggregated patterns in the debrief.
          </p>
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />New experiment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New behavioral experiment</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Anchoring around opening line"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bias to demonstrate</Label>
                  <Select value={newBias} onValueChange={(v) => setNewBias(v as BiasKind)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BIAS_KINDS.map((b) => (
                        <SelectItem key={b} value={b}>{BIAS_LABELS[b]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {BIAS_DESCRIPTIONS[newBias]}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Instructor objective (private)</Label>
                  <Textarea
                    rows={2}
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="What you want students to discover after the debrief"
                  />
                </div>
                <label className="flex items-center justify-between rounded-md border p-2 text-xs cursor-pointer">
                  <span>Show students an "experiment in progress" notice</span>
                  <Switch checked={newNotice} onCheckedChange={setNewNotice} />
                </label>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Tabs defaultValue="experiments">
        <TabsList>
          <TabsTrigger value="experiments">
            <Brain className="h-3.5 w-3.5 mr-1.5" />Experiments ({classExperiments.length})
          </TabsTrigger>
          <TabsTrigger value="debrief">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />Debrief
          </TabsTrigger>
        </TabsList>

        <TabsContent value="experiments">
          {classExperiments.length === 0 ? (
            <Card>
              <CardContent className="text-xs text-muted-foreground text-center py-8">
                No behavioral experiments yet. Click "New experiment" to set one up.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {classExperiments.map((exp) => (
                <Card key={exp.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                          <span className="truncate">{exp.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {BIAS_LABELS[exp.bias]}
                          </Badge>
                          {exp.active ? (
                            <Badge variant="outline" className="text-[10px] border-success text-success">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Paused</Badge>
                          )}
                        </CardTitle>
                        {exp.objective && (
                          <p className="text-[11px] text-muted-foreground mt-1">{exp.objective}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateBiasExperiment(exp.id, { active: !exp.active })}
                          title={exp.active ? "Pause" : "Activate"}
                        >
                          <Switch checked={exp.active} className="pointer-events-none" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            if (confirm(`Delete experiment "${exp.title}"?`)) {
                              deleteBiasExperiment(exp.id);
                              toast.success("Experiment deleted");
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <label className="flex items-center justify-between rounded-md border p-2 text-xs cursor-pointer">
                      <span>Show students "experiment in progress" notice</span>
                      <Switch
                        checked={exp.studentNoticeEnabled}
                        onCheckedChange={(v) => updateBiasExperiment(exp.id, { studentNoticeEnabled: v })}
                      />
                    </label>

                    {/* Market attachment */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Attached markets</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                        {classMarkets.map((m) => {
                          const checked = exp.marketIds.includes(m.id);
                          return (
                            <label
                              key={m.id}
                              className="flex items-center gap-2 rounded-md border p-2 text-xs cursor-pointer hover:bg-muted/30"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  const next = v
                                    ? [...exp.marketIds, m.id]
                                    : exp.marketIds.filter((x) => x !== m.id);
                                  setBiasExperimentMarkets(exp.id, next);
                                }}
                              />
                              <span className="truncate">{m.title}</span>
                            </label>
                          );
                        })}
                        {classMarkets.length === 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            No markets in this classroom yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Per-market framing list */}
                    {exp.marketIds.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Framing cues per market</Label>
                        <div className="space-y-1.5">
                          {exp.marketIds.map((mid) => {
                            const m = classMarkets.find((x) => x.id === mid);
                            if (!m) return null;
                            const fr = exp.framing[mid];
                            const cues: string[] = [];
                            if (fr?.prompt) cues.push("prompt");
                            if (fr?.headline) cues.push("headline");
                            if (fr?.anchorPrice != null) cues.push(`anchor ${(fr.anchorPrice * 100).toFixed(0)}¢`);
                            if (fr?.newsBlurb) cues.push("news blurb");
                            if (fr?.emphasizeHistory) cues.push("history emphasis");
                            if (fr?.showStreak) cues.push("streak");
                            if (fr?.summaryStyle && fr.summaryStyle !== "none") cues.push(SUMMARY_STYLE_LABELS[fr.summaryStyle]);
                            return (
                              <div
                                key={mid}
                                className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{m.title}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {cues.length > 0 ? cues.join(" · ") : "No framing set"}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setFramingExp(exp);
                                    setFramingMarketId(mid);
                                  }}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />Edit
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="debrief">
          <BehavioralDebrief />
        </TabsContent>
      </Tabs>

      {framingExp && framingMarketId && (
        <FramingDialog
          experiment={framingExp}
          marketId={framingMarketId}
          marketTitle={classMarkets.find((m) => m.id === framingMarketId)?.title ?? ""}
          onClose={() => { setFramingExp(null); setFramingMarketId(""); }}
          onSave={(framing) => {
            setBiasFraming(framingExp.id, framingMarketId, framing);
            toast.success("Framing saved");
            setFramingExp(null);
            setFramingMarketId("");
          }}
        />
      )}
    </div>
  );
}

function FramingDialog({
  experiment,
  marketId,
  marketTitle,
  onClose,
  onSave,
}: {
  experiment: BiasExperiment;
  marketId: string;
  marketTitle: string;
  onClose: () => void;
  onSave: (framing: BiasFraming) => void;
}) {
  const existing = experiment.framing[marketId] ?? {};
  const [prompt, setPrompt] = useState(existing.prompt ?? "");
  const [headline, setHeadline] = useState(existing.headline ?? "");
  const [anchorPrice, setAnchorPrice] = useState<string>(
    existing.anchorPrice != null ? String(existing.anchorPrice) : "",
  );
  const [anchorLabel, setAnchorLabel] = useState(existing.anchorLabel ?? "");
  const [emphasizeHistory, setEmphasizeHistory] = useState(existing.emphasizeHistory ?? false);
  const [showStreak, setShowStreak] = useState(existing.showStreak ?? false);
  const [newsBlurb, setNewsBlurb] = useState(existing.newsBlurb ?? "");
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>(existing.summaryStyle ?? "none");
  const [summaryText, setSummaryText] = useState(existing.summaryText ?? "");

  const handleSave = () => {
    const ap = anchorPrice ? Number(anchorPrice) : NaN;
    const framing: BiasFraming = {
      prompt: prompt.trim() || undefined,
      headline: headline.trim() || undefined,
      anchorPrice: !isNaN(ap) && ap > 0 && ap < 1 ? ap : undefined,
      anchorLabel: anchorLabel.trim() || undefined,
      emphasizeHistory,
      showStreak,
      newsBlurb: newsBlurb.trim() || undefined,
      summaryStyle,
      summaryText: summaryStyle !== "none" ? summaryText.trim() || undefined : undefined,
    };
    onSave(framing);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Framing for "{marketTitle}"
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-xs text-muted-foreground">
            Bias under test: <strong>{BIAS_LABELS[experiment.bias]}</strong>. {BIAS_DESCRIPTIONS[experiment.bias]}
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Megaphone className="h-3 w-3" />Prompt / instructions
            </Label>
            <Textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Free-form instructions shown above the market"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Newspaper className="h-3 w-3" />Headline (framing cue)
            </Label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder='e.g. "Lakers on a 5-game win streak"'
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Anchor className="h-3 w-3" />Anchor price (0.01–0.99)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="0.99"
                value={anchorPrice}
                onChange={(e) => setAnchorPrice(e.target.value)}
                placeholder="0.65"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Anchor label</Label>
              <Input
                value={anchorLabel}
                onChange={(e) => setAnchorLabel(e.target.value)}
                placeholder='e.g. "Opening line"'
              />
            </div>
          </div>

          <label className="flex items-center justify-between rounded-md border p-2 text-xs cursor-pointer">
            <span className="flex items-center gap-1.5">
              <History className="h-3 w-3" />Emphasize price history visually
            </span>
            <Switch checked={emphasizeHistory} onCheckedChange={setEmphasizeHistory} />
          </label>

          <label className="flex items-center justify-between rounded-md border p-2 text-xs cursor-pointer">
            <span>Show recent streak indicator</span>
            <Switch checked={showStreak} onCheckedChange={setShowStreak} />
          </label>

          <div className="space-y-1.5">
            <Label className="text-xs">News blurb (selective info)</Label>
            <Textarea
              rows={2}
              value={newsBlurb}
              onChange={(e) => setNewsBlurb(e.target.value)}
              placeholder='e.g. "Coach quoted as saying team is 100% healthy"'
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Summary style shown to students</Label>
            <Select value={summaryStyle} onValueChange={(v) => setSummaryStyle(v as SummaryStyle)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No summary</SelectItem>
                <SelectItem value="expert">Expert-style summary</SelectItem>
                <SelectItem value="noisy">Noisy / unreliable summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {summaryStyle !== "none" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Summary text</Label>
              <Textarea
                rows={3}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder={summaryStyle === "expert"
                  ? "Polished, confident-sounding analysis"
                  : "Vague, contradictory, or low-quality blurbs"}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save framing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
