import { Link } from "react-router-dom";
import { Printer, Rocket, FileSpreadsheet, ShieldCheck, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COURSE_PLANS } from "@/data/coursePlans";
import { findCurriculumModule } from "@/data/curriculum";

const features = [
  { icon: Rocket, title: "Set up in 5 minutes", text: "Pick a course plan and a length. Lessons, due dates and a contest are created for you." },
  { icon: BookOpen, title: "Ready-made lessons", text: "Over 40 short lessons on odds, the house edge, Canadian regulation, analytics and responsible play." },
  { icon: FileSpreadsheet, title: "Grades in one click", text: "Download a gradebook file for Moodle, Canvas or D2L, weighted the way you choose." },
  { icon: ShieldCheck, title: "Safe for the classroom", text: "Simulated money only, required risk lessons first, and grading on analysis instead of winnings." },
];

export default function ForInstructors() {
  const plan = COURSE_PLANS[0];
  return (
    <div className="container py-6 max-w-4xl mx-auto space-y-10">
      <section className="text-center space-y-4 pt-4">
        <h1 className="text-3xl md:text-4xl font-bold">Teach how sports markets really work</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">A ready-to-run classroom sportsbook for sport management and business courses. Free for instructors; students pay $10 for a year.</p>
        <div className="flex flex-wrap justify-center gap-3 print:hidden">
          <Button asChild size="lg"><Link to="/auth">Create a free instructor account</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/for-administrators">Info for your chair</Link></Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Card key={f.title}><CardContent className="p-5 flex gap-3">
            <f.icon className="h-6 w-6 text-primary shrink-0" />
            <div><div className="font-semibold">{f.title}</div><p className="text-sm text-muted-foreground mt-1">{f.text}</p></div>
          </CardContent></Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">How pricing works</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Instructors and teaching assistants never pay.</li>
          <li>Each student pays $10 for one year inside the app — no purchase order needed from your institution.</li>
          <li>New students get a 10-day free trial, so the first week of class is never held up.</li>
          <li>Want to cover your students? Ask us for a course code good for any number of seats.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Sample syllabus: {plan.title}</h2>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden"><Printer className="h-4 w-4 mr-2" />Print</Button>
        </div>
        <p className="text-sm text-muted-foreground">Suggested assessment: lessons 40%, bet journal 30%, forecast accuracy 20%, closing line value 10%.</p>
        <div className="grid gap-3">
          {plan.weeks.map((w, i) => (
            <Card key={w.title} className="break-inside-avoid"><CardHeader className="pb-2"><CardTitle className="text-base">Week {i + 1}: {w.title}</CardTitle></CardHeader>
              <CardContent><ul className="text-sm list-disc pl-5 space-y-0.5">
                {w.modules.map((k) => <li key={k}>{findCurriculumModule(k)?.title ?? k}</li>)}
              </ul></CardContent></Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Also available: Sport Analytics and Responsible Gambling plans, each as a weekend, 6-week or full-semester version.</p>
      </section>
    </div>
  );
}
