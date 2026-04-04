import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Play, Pause, StopCircle, Archive, Copy, Trash2, Pencil,
  FlaskConical, Users, BarChart3, ChevronRight, X, Eye, EyeOff,
  Zap, ShieldAlert, Brain, Target, TrendingUp, Shuffle, AlertTriangle,
  CheckCircle2, Clock, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useMarket,
  type Experiment,
  type ExperimentType,
  type ExperimentStatus,
  type ExperimentScoringMode,
  type ExperimentNameVisibility,
  type ExperimentRule,
  EXPERIMENT_RULE_PRESETS,
} from "@/context/MarketContext";
import { calculateMarketAnalytics } from "@/lib/marketAnalytics";

const EXPERIMENT_TYPE_META: { id: ExperimentType; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "open-simulation", label: "Open Simulation", icon: <TrendingUp className="h-4 w-4" />, description: "Free market trading with no special constraints" },
  { id: "information-asymmetry", label: "Information Asymmetry", icon: <Eye className="h-4 w-4" />, description: "Some traders get information before others" },
  { id: "behavioral-bias", label: "Behavioral Bias", icon: <Brain className="h-4 w-4" />, description: "Test anchoring, herding, or overconfidence effects" },
  { id: "market-manipulation", label: "Market Manipulation", icon: <ShieldAlert className="h-4 w-4" />, description: "Demonstrate how large trades can distort prices" },
  { id: "shock-event", label: "Shock Event", icon: <Zap className="h-4 w-4" />, description: "Inject sudden news to observe market reaction" },
  { id: "prediction-accuracy", label: "Prediction Accuracy", icon: <Target className="h-4 w-4" />, description: "Score students by how accurate their forecasts are" },
  { id: "risk-management", label: "Risk Management", icon: <AlertTriangle className="h-4 w-4" />, description: "Challenge students to manage downside risk" },
  { id: "diversification-challenge", label: "Diversification", icon: <Shuffle className="h-4 w-4" />, description: "Require trading across multiple markets" },
];

const STATUS_STYLE: Record<ExperimentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success/15 text-success",
  paused: "bg-warning/15 text-warning",
  ended: "bg-accent/15 text-accent",
  archived: "bg-muted text-muted-foreground",
};

export default function Experiments() {
  const {
    experiments, markets, trades, students, classroom,
    createExperiment, updateExperiment, deleteExperiment,
    duplicateExperiment, activateExperiment, pauseExperiment,
    endExperiment, archiveExperiment,
  } = useMarket();

  const [showCreator, setShowCreator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const classExperiments = experiments.filter((e) => e.classroomId === classroom.id);
  const activeExps = classExperiments.filter((e) => e.status === "active");
  const draftExps = classExperiments.filter((e) => e.status === "draft");
  const pastExps = classExperiments.filter((e) => e.status === "ended" || e.status === "archived" || e.status === "paused");

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Experiments
          </h1>
          <p className="text-sm text-muted-foreground">{classroom.name} — Structured classroom simulations</p>
        </div>
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="mr-1 h-4 w-4" />New Experiment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold">{activeExps.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Draft</p>
          <p className="text-2xl font-bold">{draftExps.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Total Markets</p>
          <p className="text-2xl font-bold">{classExperiments.reduce((s, e) => s + e.linkedMarketIds.length, 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Students</p>
          <p className="text-2xl font-bold">{students.length}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeExps.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftExps.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastExps.length})</TabsTrigger>
          <TabsTrigger value="all">All ({classExperiments.length})</TabsTrigger>
        </TabsList>

        {(["active", "draft", "past", "all"] as const).map((tab) => {
          const list = tab === "active" ? activeExps : tab === "draft" ? draftExps : tab === "past" ? pastExps : classExperiments;
          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {list.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">
                  No {tab} experiments. Create one to get started.
                </CardContent></Card>
              ) : list.map((exp) => (
                <ExperimentCard
                  key={exp.id}
                  experiment={exp}
                  markets={markets}
                  trades={trades}
                  students={students}
                  onEdit={() => setEditingId(exp.id)}
                  onActivate={() => { activateExperiment(exp.id); toast.success("Experiment activated"); }}
                  onPause={() => { pauseExperiment(exp.id); toast.success("Experiment paused"); }}
                  onEnd={() => { endExperiment(exp.id); toast.success("Experiment ended"); }}
                  onArchive={() => { archiveExperiment(exp.id); toast.success("Experiment archived"); }}
                  onDuplicate={() => { duplicateExperiment(exp.id); toast.success("Experiment duplicated"); }}
                  onDelete={() => { deleteExperiment(exp.id); toast.success("Experiment deleted"); }}
                />
              ))}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Creator / Editor modal */}
      {(showCreator || editingId) && (
        <ExperimentEditor
          experiment={editingId ? experiments.find((e) => e.id === editingId) : undefined}
          classroomId={classroom.id}
          markets={markets.filter((m) => m.classroomId === classroom.id)}
          onSave={(data) => {
            if (editingId) {
              updateExperiment(editingId, data);
              toast.success("Experiment updated");
            } else {
              createExperiment(data as any);
              toast.success("Experiment created");
            }
            setShowCreator(false);
            setEditingId(null);
          }}
          onClose={() => { setShowCreator(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}

// ── Experiment Card ──────────────────────────────────────────────

function ExperimentCard({
  experiment: exp, markets, trades, students,
  onEdit, onActivate, onPause, onEnd, onArchive, onDuplicate, onDelete,
}: {
  experiment: Experiment;
  markets: any[];
  trades: any[];
  students: any[];
  onEdit: () => void;
  onActivate: () => void;
  onPause: () => void;
  onEnd: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const linkedMarkets = markets.filter((m) => exp.linkedMarketIds.includes(m.id));
  const expTrades = trades.filter((t: any) => exp.linkedMarketIds.includes(t.marketId));
  const totalVolume = expTrades.reduce((s: number, t: any) => s + (t.totalCost ?? 0), 0);
  const typeMeta = EXPERIMENT_TYPE_META.find((t) => t.id === exp.type);
  const activeRules = exp.rules.filter((r) => r.enabled);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold">{exp.title}</h3>
              <Badge className={cn("text-[10px]", STATUS_STYLE[exp.status])}>{exp.status}</Badge>
              {typeMeta && <Badge variant="outline" className="text-[10px] gap-1">{typeMeta.icon}{typeMeta.label}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{exp.objective}</p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{linkedMarkets.length} markets</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{students.length} students</span>
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{expTrades.length} trades</span>
              <span>${totalVolume.toFixed(0)} volume</span>
              {activeRules.length > 0 && <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" />{activeRules.length} rules</span>}
            </div>

            {/* Linked markets preview */}
            {linkedMarkets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {linkedMarkets.slice(0, 4).map((m: any) => (
                  <Badge key={m.id} variant="secondary" className="text-[10px]">{m.title}</Badge>
                ))}
                {linkedMarkets.length > 4 && <Badge variant="secondary" className="text-[10px]">+{linkedMarkets.length - 4} more</Badge>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 shrink-0">
            {exp.status === "draft" && (
              <Button size="sm" onClick={onActivate} className="gap-1"><Play className="h-3.5 w-3.5" />Activate</Button>
            )}
            {exp.status === "active" && (
              <>
                <Button size="sm" variant="outline" onClick={onPause} className="gap-1"><Pause className="h-3.5 w-3.5" />Pause</Button>
                <Button size="sm" variant="destructive" onClick={onEnd} className="gap-1"><StopCircle className="h-3.5 w-3.5" />End</Button>
              </>
            )}
            {exp.status === "paused" && (
              <>
                <Button size="sm" onClick={onActivate} className="gap-1"><Play className="h-3.5 w-3.5" />Resume</Button>
                <Button size="sm" variant="destructive" onClick={onEnd} className="gap-1"><StopCircle className="h-3.5 w-3.5" />End</Button>
              </>
            )}
            {exp.status === "ended" && (
              <Button size="sm" variant="outline" onClick={onArchive} className="gap-1"><Archive className="h-3.5 w-3.5" />Archive</Button>
            )}
            <Button size="sm" variant="ghost" onClick={onEdit} className="gap-1"><Pencil className="h-3.5 w-3.5" />Edit</Button>
            <Button size="sm" variant="ghost" onClick={onDuplicate} className="gap-1"><Copy className="h-3.5 w-3.5" />Duplicate</Button>
            {(exp.status === "draft" || exp.status === "archived") && (
              <Button size="sm" variant="ghost" onClick={onDelete} className="gap-1 text-destructive"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Experiment Editor ────────────────────────────────────────────

function ExperimentEditor({
  experiment, classroomId, markets, onSave, onClose,
}: {
  experiment?: Experiment;
  classroomId: string;
  markets: any[];
  onSave: (data: Partial<Experiment>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(experiment?.title ?? "");
  const [type, setType] = useState<ExperimentType>(experiment?.type ?? "open-simulation");
  const [objective, setObjective] = useState(experiment?.objective ?? "");
  const [instructorNotes, setInstructorNotes] = useState(experiment?.instructorNotes ?? "");
  const [studentInstructions, setStudentInstructions] = useState(experiment?.studentInstructions ?? "");
  const [scoringMode, setScoringMode] = useState<ExperimentScoringMode>(experiment?.scoringMode ?? "portfolio-return");
  const [leaderboardVisible, setLeaderboardVisible] = useState(experiment?.leaderboardVisible ?? true);
  const [nameVisibility, setNameVisibility] = useState<ExperimentNameVisibility>(experiment?.nameVisibility ?? "public");
  const [linkedMarketIds, setLinkedMarketIds] = useState<string[]>(experiment?.linkedMarketIds ?? []);
  const [rules, setRules] = useState<ExperimentRule[]>(
    experiment?.rules ?? EXPERIMENT_RULE_PRESETS.map((r) => ({ ...r, enabled: false }))
  );
  const [startDate, setStartDate] = useState(experiment?.startDate ?? "");
  const [endDate, setEndDate] = useState(experiment?.endDate ?? "");

  const toggleMarket = (id: string) => {
    setLinkedMarketIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleRule = (ruleId: string) => {
    setRules((prev) => prev.map((r) => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    onSave({
      classroomId, title: title.trim(), type, objective: objective.trim(),
      instructorNotes: instructorNotes.trim(), studentInstructions: studentInstructions.trim(),
      scoringMode, leaderboardVisible, nameVisibility, linkedMarketIds, rules,
      startDate: startDate || null, endDate: endDate || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            {experiment ? "Edit Experiment" : "New Experiment"}
          </CardTitle>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic info */}
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Experiment title" className="text-lg font-semibold" />
            <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Objective — what should students learn?" rows={2} />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Experiment Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EXPERIMENT_TYPE_META.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left text-xs transition-all",
                    type === t.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-semibold mb-1">{t.icon}{t.label}</div>
                  <p className="text-muted-foreground leading-tight">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scoring & visibility */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Scoring Mode</label>
              <Select value={scoringMode} onValueChange={(v) => setScoringMode(v as ExperimentScoringMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="portfolio-return">Portfolio Return</SelectItem>
                  <SelectItem value="prediction-accuracy">Prediction Accuracy</SelectItem>
                  <SelectItem value="decision-quality">Decision Quality</SelectItem>
                  <SelectItem value="risk-adjusted">Risk-Adjusted</SelectItem>
                  <SelectItem value="participation">Participation</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Name Display</label>
              <Select value={nameVisibility} onValueChange={(v) => setNameVisibility(v as ExperimentNameVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public (real names)</SelectItem>
                  <SelectItem value="anonymized">Anonymized</SelectItem>
                  <SelectItem value="alias">Alias-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Leaderboard</label>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={leaderboardVisible} onCheckedChange={setLeaderboardVisible} />
                <span className="text-sm">{leaderboardVisible ? "Visible" : "Hidden"}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">End Date</label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Link markets */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Link Markets ({linkedMarketIds.length} selected)</label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border p-3">
              {markets.length === 0 ? (
                <p className="text-xs text-muted-foreground">No markets in this class yet.</p>
              ) : markets.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                  <Checkbox checked={linkedMarketIds.includes(m.id)} onCheckedChange={() => toggleMarket(m.id)} />
                  <span className="flex-1">{m.title}</span>
                  <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                </label>
              ))}
            </div>
          </div>

          {/* Special rules */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Special Rules</label>
            <div className="space-y-2">
              {rules.map((rule) => (
                <label key={rule.id} className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                  rule.enabled ? "border-primary bg-primary/5" : "hover:bg-muted"
                )}>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{rule.label}</p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Student Instructions</label>
              <Textarea value={studentInstructions} onChange={(e) => setStudentInstructions(e.target.value)} placeholder="Instructions shown to students when the experiment is active" rows={3} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Instructor Notes (private)</label>
              <Textarea value={instructorNotes} onChange={(e) => setInstructorNotes(e.target.value)} placeholder="Private notes for debrief planning" rows={2} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave}>
              {experiment ? "Save Changes" : "Create Experiment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
