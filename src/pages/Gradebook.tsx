import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyClasses, useRoster } from "@/features/classes/useClasses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LESSON_DESIGN, moduleQuizKey } from "@/data/lessonDesign";
import { LEGACY_TOPICS } from "@/data/curriculum";
import { quizComponent, DEFAULT_WEIGHTS, finalGrade, componentScores, gradebookCsv, type GradeWeights, type GradebookInput } from "@/lib/gradebook";

function download(csv: string, name: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const LABELS: Record<keyof GradeWeights, string> = {
  quizzes: "Quizzes",
  lessons: "Lessons completed", journal: "Journal completion", forecast: "Forecast accuracy", clv: "Closing line value",
};

export default function Gradebook() {
  const { data: classes = [] } = useMyClasses();
  const [classId, setClassId] = useState<string>();
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes, classId]);
  const [w, setW] = useState<GradeWeights>(DEFAULT_WEIGHTS);
  const { data: roster = [] } = useRoster(classId);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["gradebook", classId],
    enabled: !!classId,
    queryFn: async () => {
      const [lessons, progress, lb, quizzes, cls] = await Promise.all([
        supabase.from("class_lessons").select("id, curriculum_key, topic").eq("class_id", classId!).eq("is_published", true),
        supabase.from("class_lesson_progress").select("user_id, lesson_id").eq("class_id", classId!),
        supabase.rpc("class_analysis_leaderboard", { _class_id: classId!, _round_id: null as never }),
        supabase.from("class_quiz_attempts").select("user_id, quiz_key, score").eq("class_id", classId!),
        supabase.from("classes").select("quiz_grading").eq("id", classId!).maybeSingle(),
      ]);
      const quizKeys = new Set<string>();
      for (const l of lessons.data ?? []) {
        if (l.curriculum_key && LESSON_DESIGN[l.curriculum_key]) quizKeys.add(l.curriculum_key);
        if (l.curriculum_key) quizKeys.add(moduleQuizKey(LEGACY_TOPICS[l.topic] ?? l.topic));
      }
      const bestByUser = new Map<string, Map<string, number>>();
      for (const a of quizzes.data ?? []) {
        const m = bestByUser.get(a.user_id) ?? new Map<string, number>();
        m.set(a.quiz_key, Math.max(m.get(a.quiz_key) ?? 0, Number(a.score)));
        bestByUser.set(a.user_id, m);
      }
      const mode = ((cls.data as any)?.quiz_grading ?? "scored") as "scored" | "completion";
      const ids = new Set((lessons.data ?? []).map((l) => l.id));
      const done = new Map<string, number>();
      for (const p of progress.data ?? []) if (ids.has(p.lesson_id)) done.set(p.user_id, (done.get(p.user_id) ?? 0) + 1);
      const stats = new Map((lb.data ?? []).map((r: any) => [r.user_id, r]));
      return { total: ids.size, done, stats, quizKeys: [...quizKeys], bestByUser, mode };
    },
  });

  const rows: GradebookInput[] = useMemo(() => {
    if (!metrics) return [];
    return roster.map((m) => {
      const s: any = metrics.stats.get(m.user_id);
      return {
        name: m.profile?.display_name || m.profile?.email || "Student",
        email: m.profile?.email ?? "",
        lessonsDone: metrics.done.get(m.user_id) ?? 0,
        lessonsTotal: metrics.total,
        journalPct: s?.journal_pct == null ? null : Number(s.journal_pct),
        brier: s?.brier == null ? null : Number(s.brier),
        avgClvPct: s?.avg_clv_pct == null ? null : Number(s.avg_clv_pct),
        forecasts: Number(s?.forecasts ?? 0),
        quizPct: quizComponent(metrics.bestByUser.get(m.user_id) ?? new Map(), metrics.quizKeys, metrics.mode),
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, metrics]);

  const total = w.quizzes + w.lessons + w.journal + w.forecast + w.clv;
  const qc = useQueryClient();
  const setMode = async (mode: "scored" | "completion") => {
    const { error } = await supabase.from("classes").update({ quiz_grading: mode } as never).eq("id", classId!);
    if (error) return toast.error(error.message);
    toast.success(mode === "scored" ? "Quiz scores now count" : "Quizzes now count for completion only");
    qc.invalidateQueries({ queryKey: ["gradebook", classId] });
  };
  const klass = classes.find((c) => c.id === classId);

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gradebook</h1>
        <p className="text-muted-foreground text-sm">Set what each part is worth, then download a file you can import into Moodle, Canvas or D2L.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Class and weights</CardTitle>
          <CardDescription>Missing work counts as zero. Weights don't have to add to 100 — they're scaled. Forecast accuracy: a coin-flip forecaster scores 50. Closing line value: 0% scores 50, +5% scores 100.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6 grid gap-4 sm:grid-cols-2 sm:max-w-xl">
          <div>
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Pick a class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quiz grading</Label>
            <Select value={metrics?.mode ?? "scored"} onValueChange={(v) => setMode(v as "scored" | "completion")} disabled={!classId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scored">Quiz scores count (best attempt)</SelectItem>
                <SelectItem value="completion">Completion only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
          {(Object.keys(LABELS) as (keyof GradeWeights)[]).map((k) => (
            <div key={k}>
              <Label>{LABELS[k]} (%)</Label>
              <Input type="number" min={0} max={100} value={w[k]} onChange={(e) => setW({ ...w, [k]: Math.max(0, Number(e.target.value) || 0) })} />
            </div>
          ))}
          <div className="flex items-end">
            <Button className="w-full" disabled={!rows.length || total <= 0}
              onClick={() => download(gradebookCsv(rows, w), `${(klass?.name ?? "class").replace(/\W+/g, "_")}_gradebook.csv`)}>
              <Download className="h-4 w-4 mr-2" /> Download file
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b">
              <tr>{["Student", "Quizzes", "Lessons", "Journal", "Forecast", "CLV", "Grade"].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading && <tr><td className="p-3" colSpan={7}>Loading…</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={7}>No students in this class yet.</td></tr>}
              {rows.map((r) => {
                const s = componentScores(r);
                const f = (n: number | null) => (n == null ? "—" : Math.round(n));
                return (
                  <tr key={r.email + r.name} className="border-b last:border-0">
                    <td className="p-3"><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.email}</div></td>
                    <td className="p-3">{f(s.quizzes)}</td>
                    <td className="p-3">{r.lessonsDone}/{r.lessonsTotal}</td>
                    <td className="p-3">{f(s.journal)}</td>
                    <td className="p-3">{f(s.forecast)}</td>
                    <td className="p-3">{f(s.clv)}</td>
                    <td className="p-3 font-semibold">{finalGrade(r, w)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
