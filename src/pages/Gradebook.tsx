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
import { DEFAULT_WEIGHTS, finalGrade, componentScores, gradebookCsv, type GradeWeights, type GradebookInput } from "@/lib/gradebook";

function download(csv: string, name: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const LABELS: Record<keyof GradeWeights, string> = {
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
      const [lessons, progress, lb] = await Promise.all([
        supabase.from("class_lessons").select("id").eq("class_id", classId!).eq("is_published", true),
        supabase.from("class_lesson_progress").select("user_id, lesson_id").eq("class_id", classId!),
        supabase.rpc("class_analysis_leaderboard", { _class_id: classId!, _round_id: null as never }),
      ]);
      const ids = new Set((lessons.data ?? []).map((l) => l.id));
      const done = new Map<string, number>();
      for (const p of progress.data ?? []) if (ids.has(p.lesson_id)) done.set(p.user_id, (done.get(p.user_id) ?? 0) + 1);
      const stats = new Map((lb.data ?? []).map((r: any) => [r.user_id, r]));
      return { total: ids.size, done, stats };
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
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, metrics]);

  const total = w.lessons + w.journal + w.forecast + w.clv;
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
        <CardContent className="grid gap-4 sm:grid-cols-5">
          <div className="sm:col-span-5 sm:max-w-xs">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Pick a class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
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
              <tr>{["Student", "Lessons", "Journal", "Forecast", "CLV", "Grade"].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading && <tr><td className="p-3" colSpan={6}>Loading…</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={6}>No students in this class yet.</td></tr>}
              {rows.map((r) => {
                const s = componentScores(r);
                const f = (n: number | null) => (n == null ? "—" : Math.round(n));
                return (
                  <tr key={r.email + r.name} className="border-b last:border-0">
                    <td className="p-3"><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.email}</div></td>
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
