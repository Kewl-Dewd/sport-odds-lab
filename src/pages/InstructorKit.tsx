// Instructor course kit: printable 15-week syllabus, weekly lecture slide
// outlines, quiz/task answer keys and project rubrics.
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COURSE_OUTCOMES, COURSE_WEEKS, RUBRICS, RUBRIC_LEVELS, SYLLABUS_WEIGHTS } from "@/data/courseKit";
import { CURRICULUM, findCurriculumModule } from "@/data/curriculum";
import { LESSON_DESIGN, moduleQuiz } from "@/data/lessonDesign";

const L = ["A", "B", "C", "D"];
const lessonTitle = (k: string) => findCurriculumModule(k)?.title ?? k;
const topicTitle = (k: string) => CURRICULUM.find((t) => t.key === k)?.title ?? k;

function PrintBar({ label }: { label: string }) {
  return (
    <div className="flex justify-end print:hidden">
      <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print {label}</Button>
    </div>
  );
}

export default function InstructorKit() {
  return (
    <div className="container space-y-6 py-6">
      <header className="print:hidden">
        <h1 className="text-2xl font-bold">Course kit</h1>
        <p className="text-sm text-muted-foreground">
          Everything for a 15-week course: syllabus, weekly slide outlines, answer keys and rubrics. Assign it in one step with
          Quick setup → "Full 15-week course".
        </p>
      </header>
      <Tabs defaultValue="syllabus">
        <TabsList className="flex w-full flex-wrap justify-start print:hidden">
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="slides">Slide outlines</TabsTrigger>
          <TabsTrigger value="keys">Answer keys</TabsTrigger>
          <TabsTrigger value="rubrics">Rubrics</TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="space-y-4">
          <PrintBar label="syllabus" />
          <Card>
            <CardHeader>
              <CardTitle>Sport Betting Markets: Pricing, Risk and Analysis</CardTitle>
              <CardDescription>15-week course · Delivered with Sports Market Lab (simulated funds only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <section>
                <h3 className="mb-1 font-semibold">Course description</h3>
                <p>Students run positions against a classroom sportsbook that uses live market prices, learning how odds are set, how a book earns its margin, how the Canadian and Alberta markets are regulated, and how to evaluate forecasts against the market. Grades reward analysis (forecast accuracy, closing line value, journals, projects), never winnings.</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">Course learning outcomes</h3>
                <ol className="list-decimal space-y-1 pl-5">{COURSE_OUTCOMES.map((o) => <li key={o.code}><b>{o.code}:</b> {o.text} <span className="text-muted-foreground">(Modules {o.modules.join(", ")})</span></li>)}</ol>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">Assessment</h3>
                <table className="w-full max-w-md"><tbody>{SYLLABUS_WEIGHTS.map((w) => <tr key={w.item} className="border-b last:border-0"><td className="py-1">{w.item}</td><td className="py-1 text-right font-medium">{w.weight}</td></tr>)}</tbody></table>
                <p className="mt-1 text-xs text-muted-foreground">Quizzes, lessons, journal and forecast accuracy are calculated in the Gradebook; project marks are entered in your LMS.</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">Weekly schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b text-left text-muted-foreground"><tr><th className="p-2">Wk</th><th className="p-2">Topic</th><th className="p-2">Lessons</th><th className="p-2">Due</th></tr></thead>
                    <tbody>{COURSE_WEEKS.map((w) => (
                      <tr key={w.week} className="border-b align-top last:border-0">
                        <td className="p-2 font-medium">{w.week}</td>
                        <td className="p-2"><div className="font-medium">{w.title}</div><div className="text-xs text-muted-foreground">{topicTitle(w.topicKey)}</div></td>
                        <td className="p-2 text-xs">{w.lessons.map(lessonTitle).join(" · ")}</td>
                        <td className="p-2 text-xs">{w.assessment ?? "—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">Responsible play statement</h3>
                <p>All money in this course is simulated. The two "Before you start" lessons must be completed before a student can place a first position. Students who are concerned about their own or a friend's gambling can call the Alberta Addiction Helpline (1-866-332-2322, free, 24/7) or contact campus counselling. No part of the grade depends on winning.</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">Academic integrity</h3>
                <p>Forecasts, journal entries and projects must be your own work. Discussing markets is encouraged; copying another student's forecasts or reflections is not.</p>
              </section>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slides" className="space-y-4">
          <PrintBar label="slide outlines" />
          {COURSE_WEEKS.map((w) => (
            <Card key={w.week} className="break-inside-avoid">
              <CardHeader className="pb-2"><CardTitle className="text-base">Week {w.week}: {w.title}</CardTitle><CardDescription>In-class activity: {w.activity}</CardDescription></CardHeader>
              <CardContent><ol className="list-decimal space-y-0.5 pl-5 text-sm">{w.slides.map((s) => <li key={s}>{s}</li>)}</ol></CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <PrintBar label="answer keys" />
          {CURRICULUM.map((t) => (
            <Card key={t.key} className="break-inside-avoid">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t.title}</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                {t.modules.map((m) => {
                  const d = LESSON_DESIGN[m.key];
                  if (!d) return null;
                  return (
                    <div key={m.key} className="space-y-1 border-b pb-3 last:border-0">
                      <p className="font-semibold">{m.title}</p>
                      <p><span className="font-medium">App task answer:</span> {d.taskAnswer}</p>
                      <ol className="list-decimal space-y-0.5 pl-5">
                        {d.quiz.map((qq) => <li key={qq.q}>{qq.q} <b>{L[qq.answer]}. {qq.options[qq.answer]}</b> <span className="text-muted-foreground">— {qq.why}</span></li>)}
                      </ol>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">Module quiz: {moduleQuiz(t.key).length} questions drawn from the lesson quizzes above.</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rubrics" className="space-y-4">
          <PrintBar label="rubrics" />
          {RUBRICS.map((r) => (
            <Card key={r.key} className="break-inside-avoid">
              <CardHeader className="pb-2"><CardTitle className="text-base">{r.title}</CardTitle><CardDescription>Weight: {r.weight}</CardDescription></CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-xs">
                  <thead className="border-b text-left text-muted-foreground"><tr><th className="p-2">Criterion</th>{RUBRIC_LEVELS.map((l) => <th key={l} className="p-2">{l}</th>)}</tr></thead>
                  <tbody>{r.criteria.map((c) => <tr key={c.name} className="border-b align-top last:border-0"><td className="p-2 font-medium">{c.name}</td>{c.levels.map((l, i) => <td key={i} className="p-2">{l}</td>)}</tr>)}</tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
