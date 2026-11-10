import { Link } from "react-router-dom";
import { Printer, Rocket, FileSpreadsheet, ShieldCheck, BookOpen, ArrowRight, Check, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COURSE_PLANS } from "@/data/coursePlans";
import { findCurriculumModule } from "@/data/curriculum";

const features = [
  { number: "01", icon: Rocket, title: "Set up in 5 minutes", text: "Pick a course plan and a length. Lessons, due dates and a contest are created for you." },
  { number: "02", icon: BookOpen, title: "Ready-made lessons", text: "Over 40 short lessons on odds, the house edge, Canadian regulation, analytics and responsible play." },
  { number: "03", icon: FileSpreadsheet, title: "Grades in one click", text: "Download a gradebook file for Moodle, Canvas or D2L, weighted the way you choose." },
  { number: "04", icon: ShieldCheck, title: "Safe for the classroom", text: "Simulated money only, required risk lessons first, and grading on analysis instead of winnings." },
];

export default function ForInstructors() {
  const plan = COURSE_PLANS[0];
  return (
    <div className="overflow-hidden">
      <section className="paper-grain relative border-b border-foreground/15">
        <div className="container relative grid max-w-6xl items-center gap-14 px-5 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <div className="section-kicker mb-7">For instructors · Course-in-a-box</div>
            <h1 className="max-w-3xl font-display text-[clamp(3.25rem,7vw,6.8rem)] font-semibold leading-[0.95] tracking-[-0.06em]">
              Teach how sports markets <span className="font-editorial font-normal italic text-primary">really work.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              A ready-to-run classroom sportsbook for sport management and business courses. Real prices, virtual funds, and a full term of teaching material.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row print:hidden">
              <Button asChild size="lg" variant="hero"><Link to="/auth?tab=signup">Create a free instructor account<ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/for-administrators">Info for your chair</Link></Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-foreground/15 pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-accent" />Free for instructors</span>
              <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-accent" />$10 per student / year</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
            <div className="absolute -left-3 -top-5 z-20 -rotate-6 border border-primary bg-accent px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-accent-foreground shadow-[3px_4px_0_hsl(var(--primary))]">
              Ready to assign
            </div>
            <div className="rotate-[1.5deg] border border-foreground/25 bg-card p-6 shadow-paper-card sm:p-7">
              <div className="flex items-start justify-between border-b border-foreground/15 pb-5">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Course plan / No. 001</p>
                  <h2 className="mt-2 font-display text-2xl tracking-[-0.04em]">{plan.title}</h2>
                </div>
                <FlaskConical className="h-6 w-6 text-accent" strokeWidth={1.5} />
              </div>
              <div className="divide-y divide-border">
                {plan.weeks.slice(0, 4).map((week, index) => (
                  <div key={week.title} className="flex items-center gap-4 py-4">
                    <span className="font-editorial text-3xl italic text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-sm font-semibold">{week.title}</p>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Lessons · app task · reflection</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="border-t border-foreground/15 pt-4 font-editorial text-lg italic text-muted-foreground">A full course, not another prep project.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl space-y-16 px-5 py-12 sm:py-16">
        <section>
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="section-kicker mb-3">Everything in the box</div>
              <h2 className="font-display text-3xl tracking-[-0.045em] sm:text-4xl">Less setup. Better questions.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">Built for the weeks when you need a complete, thoughtful lab—not another platform to configure.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={feature.title} className={index % 2 === 0 ? "sm:translate-y-3" : ""}>
                <CardContent className="flex gap-4 p-5 sm:p-6">
                  <div className="flex h-11 w-11 shrink-0 -rotate-3 items-center justify-center border border-primary/20 bg-background shadow-[2px_2px_0_hsl(var(--accent))]">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Field note {feature.number}</span>
                    <h3 className="mt-1 font-display text-xl tracking-[-0.035em]">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid overflow-hidden border border-foreground/20 bg-primary text-primary-foreground shadow-paper-card md:grid-cols-[0.65fr_1.35fr]">
          <div className="border-b border-primary-foreground/20 p-7 md:border-b-0 md:border-r sm:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary-foreground/65">Simple course pricing</p>
            <p className="mt-4 font-display text-6xl tracking-[-0.06em]">$10</p>
            <p className="mt-1 font-editorial text-xl italic text-accent">per student, per year</p>
          </div>
          <div className="p-7 sm:p-9">
            <h2 className="font-display text-2xl text-primary-foreground">No purchasing maze.</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-primary-foreground/80">
              <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />Instructors and teaching assistants never pay.</li>
              <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />Students purchase access inside the app—no institutional purchase order needed.</li>
              <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />A 10-day free trial keeps the first week of class moving.</li>
              <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />Course codes are available when you want to cover your students.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="section-kicker mb-3">Sample syllabus</div>
              <h2 className="font-display text-3xl tracking-[-0.045em]">{plan.title}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden"><Printer className="mr-2 h-4 w-4" />Print course plan</Button>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Suggested assessment: lessons 40%, bet journal 30%, forecast accuracy 20%, closing line value 10%.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {plan.weeks.map((week, index) => (
              <Card key={week.title} className="break-inside-avoid">
                <CardHeader className="pb-2">
                  <div className="flex items-baseline gap-3">
                    <span className="font-editorial text-3xl italic text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <CardTitle className="text-base">{week.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {week.modules.map((key) => <li key={key} className="flex gap-2"><span className="text-accent">—</span>{findCurriculumModule(key)?.title ?? key}</li>)}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Also available: Sport Analytics and Responsible Gambling plans, each as a weekend, 6-week or full-semester version.</p>
        </section>
      </div>
    </div>
  );
}
