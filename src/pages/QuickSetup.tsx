import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateClass } from "@/features/classes/useClasses";
import { useAssignCurriculum } from "@/hooks/useCurriculum";
import { COURSE_PLANS, COURSE_LENGTHS, buildSchedule, type CourseLength } from "@/data/coursePlans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function QuickSetup() {
  const nav = useNavigate();
  const create = useCreateClass();
  const assign = useAssignCurriculum();
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [plan, setPlan] = useState(COURSE_PLANS[0].key);
  const [length, setLength] = useState<CourseLength>("semester");
  const [busy, setBusy] = useState(false);

  const chosen = COURSE_PLANS.find((p) => p.key === plan)!;
  const len = COURSE_LENGTHS.find((l) => l.key === length)!;
  const startDate = new Date(start + "T09:00:00");
  const schedule = buildSchedule(chosen, length, startDate);

  const submit = async () => {
    if (!name.trim()) return toast.error("Give your class a name.");
    setBusy(true);
    try {
      const end = new Date(startDate.getTime() + len.days * 864e5);
      const klass = await create.mutateAsync({
        name: name.trim(), term: term.trim() || undefined, starting_bankroll: 1000,
        description: `${chosen.title} plan · ${len.label}`,
        semester_start: start, semester_end: end.toISOString().slice(0, 10),
      });
      // Assign lessons one due-date group at a time so each keeps its own due date.
      const groups = new Map<number, typeof schedule>();
      for (const l of schedule) groups.set(l.dueAt.getTime(), [...(groups.get(l.dueAt.getTime()) ?? []), l]);
      let order = 0;
      for (const [due, items] of groups) {
        await assign.mutateAsync({ classId: klass.id, modules: items, dueAt: new Date(due).toISOString(), startSortOrder: order });
        order += items.length;
      }
      const contestStart = length === "weekend" ? startDate : new Date(end.getTime() - 14 * 864e5);
      await supabase.from("class_rounds").insert({
        class_id: klass.id, name: length === "weekend" ? "Weekend contest" : "Final contest",
        kind: length === "weekend" ? "weekend" : "semester", description: "Scored on forecast accuracy, not winnings.",
        starts_at: contestStart.toISOString(), ends_at: end.toISOString(), starting_bankroll: 1000,
        is_contest: true, scoring: "brier",
      } as never);
      toast.success(`${klass.name} is ready. Share join code ${klass.join_code}.`);
      nav(`/instructor/classes/${klass.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set up the class");
    } finally { setBusy(false); }
  };

  return (
    <div className="container py-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Quick class setup</h1>
        <p className="text-muted-foreground text-sm">Pick a course plan and length. Lessons, due dates, a contest and all six leagues are set up for you — change anything later.</p>
      </div>

      <Card><CardHeader><CardTitle className="text-base">1. Your class</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div><Label>Class name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="SPM 2210" /></div>
          <div><Label>Term (optional)</Label><Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Winter 2027" /></div>
          <div><Label>Start date</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">2. Course plan</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {COURSE_PLANS.map((p) => (
            <button key={p.key} onClick={() => setPlan(p.key)}
              className={cn("text-left rounded-lg border p-4 transition-colors", plan === p.key ? "border-primary bg-primary/5" : "hover:bg-muted")}>
              <div className="font-semibold flex items-center gap-2">{plan === p.key && <Check className="h-4 w-4 text-primary" />}{p.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.audience}</div>
              <div className="text-sm mt-2">{p.summary}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">3. Length</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {COURSE_LENGTHS.map((l) => (
            <button key={l.key} onClick={() => setLength(l.key)}
              className={cn("text-left rounded-lg border p-4", length === l.key ? "border-primary bg-primary/5" : "hover:bg-muted")}>
              <div className="font-semibold">{l.label}</div><div className="text-xs text-muted-foreground mt-1">{l.detail}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">What students will get</CardTitle>
        <CardDescription>{schedule.length} lessons · the two risk lessons must be finished before a first bet · contest scored on forecast accuracy · $1,000 simulated bankroll</CardDescription></CardHeader>
        <CardContent>
          <ol className="text-sm space-y-1 list-decimal pl-5 max-h-64 overflow-y-auto">
            {schedule.map((l) => <li key={l.module.key}>{l.module.title} <span className="text-muted-foreground">— due {l.dueAt.toLocaleDateString()}</span></li>)}
          </ol>
        </CardContent>
      </Card>

      <Button size="lg" onClick={submit} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create my class</Button>
    </div>
  );
}
