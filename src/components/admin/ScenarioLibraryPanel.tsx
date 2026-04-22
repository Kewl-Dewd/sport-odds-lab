import { useMemo, useState } from "react";
import {
  Library, Play, Plus, Search, Copy, Archive, ArchiveRestore, Trash2, Edit2,
  Save, Clock, Tag, BookOpen, Eye, EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarket, SCENARIO_TYPE_LABELS,
  type Scenario, type ScenarioType, type ScenarioDifficulty,
} from "@/context/MarketContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPES = Object.keys(SCENARIO_TYPE_LABELS) as ScenarioType[];
const DIFFICULTIES: ScenarioDifficulty[] = ["intro", "intermediate", "advanced"];

/**
 * Scenario Library — instructor library of reusable lesson scenarios.
 * Supports filtering, save-from-current, edit, duplicate, archive, and
 * one-click launch which creates the markets, optional experiment, and
 * applies preset scoring/leaderboard rules.
 */
export function ScenarioLibraryPanel() {
  const {
    scenarios, launchScenario, duplicateScenario, archiveScenario,
    deleteScenario, saveCurrentAsScenario, createScenario, updateScenario,
    markets, classroom,
  } = useMarket();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ScenarioType | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<ScenarioDifficulty | "all">("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  // All sports across scenario market templates for the sport filter.
  const allSports = useMemo(() => {
    const set = new Set<string>();
    for (const s of scenarios) for (const t of s.marketTemplates) set.add(t.sport);
    return Array.from(set).sort();
  }, [scenarios]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scenarios.filter((s) => {
      if (s.isArchived !== showArchived) return false;
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (difficultyFilter !== "all" && s.difficulty !== difficultyFilter) return false;
      if (sportFilter !== "all" && !s.marketTemplates.some((t) => t.sport === sportFilter)) return false;
      if (!q) return true;
      const hay = [s.title, s.description, s.learningObjective, ...s.tags].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [scenarios, search, typeFilter, difficultyFilter, sportFilter, showArchived]);

  const classMarketsCount = markets.filter((m) => m.classroomId === classroom.id).length;

  const handleLaunch = (scenario: Scenario) => {
    const result = launchScenario(scenario.id);
    if (!result) {
      toast.error("Failed to launch scenario");
      return;
    }
    toast.success(`Launched "${scenario.title}"`, {
      description: `${result.marketsCreated} market${result.marketsCreated !== 1 ? "s" : ""} created${result.experimentId ? " · experiment scaffold added" : ""}`,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <Library className="h-4 w-4 text-info" />
          Scenario library
          <Badge variant="outline" className="text-[10px] ml-1">
            {scenarios.filter((s) => !s.isArchived).length} active
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <ScenarioComposer
              mode="save-current"
              classMarketsCount={classMarketsCount}
              onSubmit={(payload) => {
                const created = saveCurrentAsScenario(payload);
                toast.success(`Saved scenario "${created.title}"`);
              }}
            />
            <ScenarioComposer
              mode="create"
              onSubmit={(payload) => {
                createScenario({
                  ...payload,
                  marketTemplates: [],
                  experimentScaffold: null,
                  presets: { leaderboardVisible: true, nameVisibility: "anonymized", activeRuleIds: [] },
                });
                toast.success(`Created scenario "${payload.title}"`);
              }}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, objective, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs pl-7"
            />
          </div>
          <FilterSelect
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as ScenarioType | "all")}
            options={[{ value: "all", label: "All types" }, ...TYPES.map((t) => ({ value: t, label: SCENARIO_TYPE_LABELS[t] }))]}
          />
          <FilterSelect
            value={difficultyFilter}
            onChange={(v) => setDifficultyFilter(v as ScenarioDifficulty | "all")}
            options={[{ value: "all", label: "Any difficulty" }, ...DIFFICULTIES.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))]}
          />
          {allSports.length > 0 && (
            <FilterSelect
              value={sportFilter}
              onChange={setSportFilter}
              options={[{ value: "all", label: "Any sport" }, ...allSports.map((s) => ({ value: s, label: s }))]}
            />
          )}
          <Button
            variant="outline" size="sm" className="h-8 text-xs"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived
              ? <><Eye className="h-3.5 w-3.5 mr-1.5" />Active</>
              : <><Archive className="h-3.5 w-3.5 mr-1.5" />Archived</>}
          </Button>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            {showArchived ? "No archived scenarios." : "No scenarios match these filters."}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                onLaunch={() => handleLaunch(s)}
                onDuplicate={() => {
                  const dup = duplicateScenario(s.id);
                  if (dup) toast.success(`Duplicated "${s.title}"`);
                }}
                onArchive={() => archiveScenario(s.id, !s.isArchived)}
                onDelete={() => {
                  if (confirm(`Delete scenario "${s.title}"? This cannot be undone.`)) {
                    deleteScenario(s.id);
                    toast.info("Scenario deleted");
                  }
                }}
                onEdit={(updates) => {
                  updateScenario(s.id, updates);
                  toast.success("Scenario updated");
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ScenarioCard({
  scenario, onLaunch, onDuplicate, onArchive, onDelete, onEdit,
}: {
  scenario: Scenario;
  onLaunch: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onEdit: (updates: Partial<Scenario>) => void;
}) {
  const lastLaunched = scenario.lastLaunchedAt
    ? new Date(scenario.lastLaunchedAt).toLocaleDateString()
    : "Never";

  return (
    <div className={cn(
      "rounded-md border p-3 space-y-2 flex flex-col",
      scenario.isArchived && "opacity-60 bg-muted/20",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{scenario.title}</p>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <Badge variant="outline" className="text-[9px]">{SCENARIO_TYPE_LABELS[scenario.type]}</Badge>
            <Badge variant="outline" className="text-[9px] capitalize">{scenario.difficulty}</Badge>
            <Badge variant="outline" className="text-[9px]">
              <Clock className="h-2.5 w-2.5 mr-0.5" />{scenario.recommendedMinutes}m
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">{scenario.description}</p>

      {scenario.learningObjective && (
        <div className="rounded-sm border bg-muted/10 p-1.5">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide flex items-center gap-1">
            <BookOpen className="h-2.5 w-2.5" />Objective
          </p>
          <p className="text-[11px] line-clamp-2">{scenario.learningObjective}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Tag className="h-2.5 w-2.5" />
          {scenario.marketTemplates.length} market{scenario.marketTemplates.length !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>Launched {scenario.launchCount}× · last {lastLaunched}</span>
      </div>

      {scenario.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {scenario.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-1 mt-auto">
        <Button
          size="sm" className="h-7 text-xs flex-1"
          onClick={onLaunch}
          disabled={scenario.isArchived || scenario.marketTemplates.length === 0}
          title={scenario.marketTemplates.length === 0 ? "Add market templates first" : "One-click launch"}
        >
          <Play className="h-3 w-3 mr-1" />Launch
        </Button>
        <ScenarioComposer
          mode="edit"
          existing={scenario}
          onSubmit={(payload) => onEdit(payload)}
        />
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onDuplicate} title="Duplicate">
          <Copy className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onArchive}
          title={scenario.isArchived ? "Unarchive" : "Archive"}>
          {scenario.isArchived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={onDelete} title="Delete">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface ComposerPayload {
  title: string;
  type: ScenarioType;
  description: string;
  learningObjective: string;
  studentInstructions: string;
  instructorNotes: string;
  recommendedMinutes: number;
  recommendedDebriefPoints: string[];
  tags: string[];
  difficulty: ScenarioDifficulty;
}

function ScenarioComposer({
  mode, existing, classMarketsCount, onSubmit,
}: {
  mode: "create" | "edit" | "save-current";
  existing?: Scenario;
  classMarketsCount?: number;
  onSubmit: (payload: ComposerPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [type, setType] = useState<ScenarioType>(existing?.type ?? "efficient-market");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [learningObjective, setLearningObjective] = useState(existing?.learningObjective ?? "");
  const [studentInstructions, setStudentInstructions] = useState(existing?.studentInstructions ?? "");
  const [instructorNotes, setInstructorNotes] = useState(existing?.instructorNotes ?? "");
  const [recommendedMinutes, setRecommendedMinutes] = useState(existing?.recommendedMinutes ?? 15);
  const [debriefText, setDebriefText] = useState((existing?.recommendedDebriefPoints ?? []).join("\n"));
  const [tagsText, setTagsText] = useState((existing?.tags ?? []).join(", "));
  const [difficulty, setDifficulty] = useState<ScenarioDifficulty>(existing?.difficulty ?? "intro");

  const triggerLabel = mode === "create" ? "New scenario"
    : mode === "save-current" ? "Save current as scenario"
    : "Edit";

  const triggerIcon = mode === "create" ? <Plus className="h-3.5 w-3.5 mr-1.5" />
    : mode === "save-current" ? <Save className="h-3.5 w-3.5 mr-1.5" />
    : <Edit2 className="h-3 w-3" />;

  const dialogTitle = mode === "create" ? "New scenario"
    : mode === "save-current" ? "Save current setup as scenario"
    : "Edit scenario";

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    onSubmit({
      title: title.trim(),
      type,
      description: description.trim(),
      learningObjective: learningObjective.trim(),
      studentInstructions: studentInstructions.trim(),
      instructorNotes: instructorNotes.trim(),
      recommendedMinutes,
      recommendedDebriefPoints: debriefText.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
      difficulty,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "edit" ? (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit">
            {triggerIcon}
          </Button>
        ) : (
          <Button size="sm" variant={mode === "save-current" ? "outline" : "default"} className="h-8 text-xs">
            {triggerIcon}{triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        {mode === "save-current" && (
          <div className="rounded-md border bg-info/5 border-info/30 p-2 text-xs">
            Will capture the current classroom's <strong>{classMarketsCount ?? 0}</strong> market{classMarketsCount === 1 ? "" : "s"} as templates.
          </div>
        )}

        <div className="space-y-3 text-sm">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Scenario type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ScenarioType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{SCENARIO_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as ScenarioDifficulty)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs capitalize">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ComposerField label="Description" value={description} onChange={setDescription} />
          <ComposerField label="Learning objective" value={learningObjective} onChange={setLearningObjective} />
          <ComposerField label="Student instructions" value={studentInstructions} onChange={setStudentInstructions} />
          <ComposerField label="Instructor notes" value={instructorNotes} onChange={setInstructorNotes} />

          <div className="grid sm:grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Recommended duration (minutes)</Label>
              <Input
                type="number" min={1} max={180}
                className="h-8 text-xs"
                value={recommendedMinutes}
                onChange={(e) => setRecommendedMinutes(Math.max(1, parseInt(e.target.value) || 15))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input
                placeholder="liquidity, intro, bracket"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Recommended debrief points (one per line)</Label>
            <Textarea
              rows={3}
              value={debriefText}
              onChange={(e) => setDebriefText(e.target.value)}
              className="text-xs"
              placeholder={"How quickly did prices stabilize?\nWhich trades moved prices the most?"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {mode === "edit" ? "Save changes" : mode === "save-current" ? "Save scenario" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComposerField({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea
        rows={2}
        className="text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
