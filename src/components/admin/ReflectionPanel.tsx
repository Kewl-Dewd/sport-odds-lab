import { useState } from "react";
import {
  MessageSquareQuote, Plus, Trash2, Send, Lock, Eye,
  CheckCircle2, GraduationCap, FileEdit, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarket,
  REFLECTION_PROMPT_LABELS,
  type ReflectionAssignment,
  type ReflectionPrompt,
  type ReflectionPromptKind,
  type ReflectionVisibility,
} from "@/context/MarketContext";
import { toast } from "sonner";

const PROMPT_KINDS: ReflectionPromptKind[] = [
  "open-text", "rating-confidence", "rating-process",
  "strategy-vs-emotion", "what-different",
];

export function ReflectionPanel() {
  const {
    classroom, students, experiments,
    reflectionAssignments,
    createReflectionAssignment, updateReflectionAssignment,
    deleteReflectionAssignment, setReflectionStatus,
    getReflectionResponses, gradeReflectionResponse,
  } = useMarket();

  const classAssignments = reflectionAssignments.filter((a) => a.classroomId === classroom.id);
  const classExperiments = experiments.filter((e) => e.classroomId === classroom.id);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ReflectionAssignment | null>(null);
  const [reviewing, setReviewing] = useState<ReflectionAssignment | null>(null);

  const handleCreate = (form: AssignmentFormState) => {
    createReflectionAssignment({
      title: form.title.trim() || "Untitled reflection",
      description: form.description,
      experimentId: form.experimentId || null,
      prompts: form.prompts,
      required: form.required,
      graded: form.graded,
      visibility: form.visibility,
      openImmediately: form.openImmediately,
    });
    setCreating(false);
    toast.success("Reflection created");
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-info" />
            Reflection assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Create structured prompts students answer after a session. Choose whether
            answers are required, graded, and visible only to you or shared anonymously
            for class discussion.
          </p>

          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />New reflection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New reflection assignment</DialogTitle></DialogHeader>
              <AssignmentForm
                experiments={classExperiments}
                onSubmit={handleCreate}
                onCancel={() => setCreating(false)}
              />
            </DialogContent>
          </Dialog>

          {classAssignments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No reflections yet.
            </p>
          ) : (
            <div className="space-y-2">
              {classAssignments.map((a) => {
                const responses = getReflectionResponses(a.id);
                return (
                  <div key={a.id} className="rounded-md border p-2.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{a.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px]">{a.prompts.length} prompts</Badge>
                          <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                          {a.required && <Badge variant="outline" className="text-[10px]">required</Badge>}
                          {a.graded && <Badge variant="outline" className="text-[10px]"><GraduationCap className="h-2.5 w-2.5 mr-0.5" />graded</Badge>}
                          <Badge variant="outline" className="text-[10px]">
                            {a.visibility === "instructor-only" ? <><Lock className="h-2.5 w-2.5 mr-0.5" />instructor only</> : <><Eye className="h-2.5 w-2.5 mr-0.5" />anonymous shared</>}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            · {responses.length} response{responses.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Select value={a.status} onValueChange={(v) => setReflectionStatus(a.id, v as ReflectionAssignment["status"])}>
                        <SelectTrigger className="h-7 text-[11px] w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setReviewing(a)}>
                        <Eye className="h-3 w-3 mr-1" />Review ({responses.length})
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setEditing(a)}>
                        <FileEdit className="h-3 w-3 mr-1" />Edit
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="h-7 w-7 p-0 ml-auto"
                        onClick={() => { if (confirm("Delete this reflection and all responses?")) { deleteReflectionAssignment(a.id); toast.info("Deleted"); } }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit reflection</DialogTitle></DialogHeader>
            <AssignmentForm
              experiments={classExperiments}
              initial={editing}
              onSubmit={(form) => {
                updateReflectionAssignment(editing.id, {
                  title: form.title, description: form.description,
                  experimentId: form.experimentId || null,
                  prompts: form.prompts,
                  required: form.required, graded: form.graded,
                  visibility: form.visibility,
                });
                setEditing(null);
                toast.success("Updated");
              }}
              onCancel={() => setEditing(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Review responses */}
      {reviewing && (
        <ReviewDialog
          assignment={reviewing}
          students={students}
          responses={getReflectionResponses(reviewing.id)}
          onClose={() => setReviewing(null)}
          onGrade={gradeReflectionResponse}
        />
      )}
    </div>
  );
}

interface AssignmentFormState {
  title: string;
  description: string;
  experimentId: string;
  prompts: ReflectionPrompt[];
  required: boolean;
  graded: boolean;
  visibility: ReflectionVisibility;
  openImmediately: boolean;
}

function AssignmentForm({
  initial, experiments, onSubmit, onCancel,
}: {
  initial?: ReflectionAssignment;
  experiments: { id: string; title: string }[];
  onSubmit: (s: AssignmentFormState) => void;
  onCancel: () => void;
}) {
  const [state, setState] = useState<AssignmentFormState>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    experimentId: initial?.experimentId ?? "",
    prompts: initial?.prompts ?? defaultPrompts(),
    required: initial?.required ?? false,
    graded: initial?.graded ?? false,
    visibility: initial?.visibility ?? "instructor-only",
    openImmediately: !initial,
  });

  const update = (p: Partial<AssignmentFormState>) => setState((prev) => ({ ...prev, ...p }));
  const updatePrompt = (id: string, patch: Partial<ReflectionPrompt>) =>
    update({ prompts: state.prompts.map((p) => p.id === id ? { ...p, ...patch } : p) });
  const removePrompt = (id: string) =>
    update({ prompts: state.prompts.filter((p) => p.id !== id) });
  const addPrompt = () => update({
    prompts: [...state.prompts, {
      id: crypto.randomUUID(), kind: "open-text", question: "",
      required: false, order: state.prompts.length,
    }],
  });

  return (
    <div className="space-y-3 text-sm">
      <div className="space-y-1.5">
        <Label className="text-xs">Title</Label>
        <Input value={state.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. Week 1 trading session debrief" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Description (optional)</Label>
        <Textarea rows={2} value={state.description} onChange={(e) => update({ description: e.target.value })} placeholder="Context shown to students" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Linked experiment (optional)</Label>
        <Select value={state.experimentId || "_none"} onValueChange={(v) => update({ experimentId: v === "_none" ? "" : v })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">— None (general session) —</SelectItem>
            {experiments.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Prompts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Prompts ({state.prompts.length})</Label>
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={addPrompt}>
            <Plus className="h-3 w-3 mr-1" />Add prompt
          </Button>
        </div>
        <div className="space-y-2">
          {state.prompts.map((p, i) => (
            <div key={p.id} className="rounded-md border p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono">#{i + 1}</span>
                <Select value={p.kind} onValueChange={(v) => updatePrompt(p.id, { kind: v as ReflectionPromptKind })}>
                  <SelectTrigger className="h-7 text-[11px] flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROMPT_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>{REFLECTION_PROMPT_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1 text-[10px]">
                  <Switch checked={p.required} onCheckedChange={(v) => updatePrompt(p.id, { required: v })} />
                  required
                </label>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removePrompt(p.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Textarea
                rows={2}
                className="text-xs"
                value={p.question}
                onChange={(e) => updatePrompt(p.id, { question: e.target.value })}
                placeholder="Question shown to students"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center justify-between rounded-md border p-2">
          <span className="text-xs">Required submission</span>
          <Switch checked={state.required} onCheckedChange={(v) => update({ required: v })} />
        </label>
        <label className="flex items-center justify-between rounded-md border p-2">
          <span className="text-xs">Graded</span>
          <Switch checked={state.graded} onCheckedChange={(v) => update({ graded: v })} />
        </label>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Visibility</Label>
        <Select value={state.visibility} onValueChange={(v) => update({ visibility: v as ReflectionVisibility })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="instructor-only">Instructor only (private)</SelectItem>
            <SelectItem value="anonymous-shared">Anonymous — shared in discussion mode</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!initial && (
        <label className="flex items-center justify-between rounded-md border p-2">
          <span className="text-xs">Open immediately to students</span>
          <Switch checked={state.openImmediately} onCheckedChange={(v) => update({ openImmediately: v })} />
        </label>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(state)}>
          <Send className="h-3.5 w-3.5 mr-1.5" />{initial ? "Save changes" : "Create"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function defaultPrompts(): ReflectionPrompt[] {
  return [
    { id: crypto.randomUUID(), kind: "open-text", question: "Briefly describe what happened in your trades during this session.", required: true, order: 0 },
    { id: crypto.randomUUID(), kind: "rating-confidence", question: "How confident were you in your decisions overall?", required: false, order: 1 },
    { id: crypto.randomUUID(), kind: "rating-process", question: "How would you rate your decision-making process?", required: false, order: 2 },
    { id: crypto.randomUUID(), kind: "strategy-vs-emotion", question: "Did you mostly follow a strategy or react emotionally?", required: false, order: 3 },
    { id: crypto.randomUUID(), kind: "what-different", question: "What would you do differently next time?", required: false, order: 4 },
  ];
}

function ReviewDialog({
  assignment, students, responses, onClose, onGrade,
}: {
  assignment: ReflectionAssignment;
  students: { userId: string; displayName: string }[];
  responses: ReturnType<ReturnType<typeof useMarket>["getReflectionResponses"]>;
  onClose: () => void;
  onGrade: (id: string, grade: number | null, feedback: string | null) => void;
}) {
  const nameOf = (uid: string) =>
    assignment.visibility === "anonymous-shared"
      ? `Student ${uid.slice(-4)}`
      : (students.find((s) => s.userId === uid)?.displayName ?? uid);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Responses · {assignment.title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="responses">
          <TabsList>
            <TabsTrigger value="responses">By student ({responses.length})</TabsTrigger>
            <TabsTrigger value="prompts">By prompt</TabsTrigger>
          </TabsList>
          <TabsContent value="responses" className="space-y-2">
            {responses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No submissions yet.</p>
            ) : responses.map((r) => (
              <div key={r.id} className="rounded-md border p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{nameOf(r.userId)}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.submittedAt).toLocaleString()}
                  </span>
                </div>
                {assignment.prompts.map((p) => {
                  const ans = r.answers.find((a) => a.promptId === p.id);
                  return (
                    <div key={p.id} className="text-xs">
                      <p className="text-muted-foreground">{p.question}</p>
                      <p>{formatAnswer(p.kind, ans?.value)}</p>
                    </div>
                  );
                })}
                {assignment.graded && (
                  <GradeRow response={r} onGrade={onGrade} />
                )}
              </div>
            ))}
          </TabsContent>
          <TabsContent value="prompts" className="space-y-3">
            {assignment.prompts.map((p) => (
              <div key={p.id} className="rounded-md border p-3 space-y-1.5">
                <p className="text-sm font-medium">{p.question}</p>
                <p className="text-[10px] text-muted-foreground">{REFLECTION_PROMPT_LABELS[p.kind]}</p>
                <PromptAggregate prompt={p} responses={responses} nameOf={nameOf} />
              </div>
            ))}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GradeRow({
  response, onGrade,
}: {
  response: { id: string; grade: number | null; feedback: string | null };
  onGrade: (id: string, grade: number | null, feedback: string | null) => void;
}) {
  const [grade, setGrade] = useState<string>(response.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState<string>(response.feedback ?? "");
  return (
    <div className="rounded bg-muted/30 p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-[10px] w-12">Grade</Label>
        <Input
          type="number" min={0} max={100}
          className="h-7 text-xs w-20"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
        <span className="text-[10px] text-muted-foreground">/ 100</span>
        <Button
          size="sm" variant="outline" className="h-7 text-[11px] ml-auto"
          onClick={() => {
            const g = grade === "" ? null : Math.max(0, Math.min(100, Number(grade)));
            onGrade(response.id, g, feedback || null);
            toast.success("Saved");
          }}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />Save
        </Button>
      </div>
      <Textarea
        rows={2} className="text-xs"
        placeholder="Feedback (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
    </div>
  );
}

function PromptAggregate({
  prompt, responses, nameOf,
}: {
  prompt: ReflectionPrompt;
  responses: { userId: string; answers: { promptId: string; value: string | number }[] }[];
  nameOf: (uid: string) => string;
}) {
  const values = responses
    .map((r) => ({ uid: r.userId, v: r.answers.find((a) => a.promptId === prompt.id)?.value }))
    .filter((x) => x.v !== undefined && x.v !== "");

  if (values.length === 0) {
    return <p className="text-[11px] text-muted-foreground">No responses yet.</p>;
  }

  if (prompt.kind === "rating-confidence" || prompt.kind === "rating-process") {
    const nums = values.map((x) => Number(x.v)).filter((n) => !isNaN(n));
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const counts = [1, 2, 3, 4, 5].map((n) => ({ n, c: nums.filter((x) => x === n).length }));
    return (
      <div className="space-y-1">
        <p className="text-xs">Average: <strong className="font-mono">{avg.toFixed(2)}</strong> ({nums.length} rating{nums.length !== 1 ? "s" : ""})</p>
        <div className="grid grid-cols-5 gap-1 text-[10px]">
          {counts.map((c) => (
            <div key={c.n} className="rounded bg-muted/40 p-1 text-center">
              <p className="text-muted-foreground">{c.n}★</p>
              <p className="font-mono font-medium">{c.c}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (prompt.kind === "strategy-vs-emotion") {
    const counts = { strategy: 0, mixed: 0, emotion: 0 };
    for (const x of values) {
      const v = String(x.v);
      if (v in counts) counts[v as keyof typeof counts]++;
    }
    return (
      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <div className="rounded bg-muted/40 p-1.5 text-center">
          <p className="text-muted-foreground">Strategy</p>
          <p className="font-mono font-medium">{counts.strategy}</p>
        </div>
        <div className="rounded bg-muted/40 p-1.5 text-center">
          <p className="text-muted-foreground">Mixed</p>
          <p className="font-mono font-medium">{counts.mixed}</p>
        </div>
        <div className="rounded bg-muted/40 p-1.5 text-center">
          <p className="text-muted-foreground">Emotion</p>
          <p className="font-mono font-medium">{counts.emotion}</p>
        </div>
      </div>
    );
  }

  // Open text — list excerpts
  return (
    <div className="space-y-1">
      {values.slice(0, 8).map((x, i) => (
        <div key={i} className="text-xs rounded bg-muted/30 p-1.5">
          <p className="text-[10px] text-muted-foreground">{nameOf(x.uid)}</p>
          <p className="line-clamp-3">{String(x.v)}</p>
        </div>
      ))}
      {values.length > 8 && (
        <p className="text-[10px] text-muted-foreground">…and {values.length - 8} more</p>
      )}
    </div>
  );
}

function formatAnswer(kind: ReflectionPromptKind, value: string | number | undefined): string {
  if (value === undefined || value === "") return "—";
  if (kind === "rating-confidence" || kind === "rating-process") return `${value} / 5`;
  if (kind === "strategy-vs-emotion") {
    const v = String(value);
    return v === "strategy" ? "Mostly strategy" : v === "emotion" ? "Mostly emotion" : "Mix of both";
  }
  return String(value);
}
