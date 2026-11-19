import { BookOpen, CalendarDays, ClipboardCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COURSE_OUTCOMES, COURSE_WEEKS, RUBRICS, RUBRIC_LEVELS, SYLLABUS_WEIGHTS } from "@/data/courseKit";
import { findCurriculumModule } from "@/data/curriculum";

export function StudentCourseOverview() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" /> Sport Betting Markets: Pricing, Risk and Analysis
          </CardTitle>
          <CardDescription>15 weeks · simulated funds only · grades reward analysis, never winnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Run positions against a classroom sportsbook using live market prices. Learn how odds are set,
            how a book earns its margin, how Canadian markets are regulated, and how to evaluate forecasts.
          </p>
          <div>
            <h3 className="mb-2 font-semibold">What you will learn</h3>
            <ol className="list-decimal space-y-1.5 pl-5">
              {COURSE_OUTCOMES.map((outcome) => <li key={outcome.code}>{outcome.text}</li>)}
            </ol>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl font-semibold">Weekly schedule</h2>
        </div>
        <Accordion type="multiple" className="w-full">
          {COURSE_WEEKS.map((week) => (
            <AccordionItem key={week.week} value={`week-${week.week}`}>
              <AccordionTrigger className="text-left">
                <span className="flex flex-1 flex-wrap items-center gap-2 pr-3">
                  <Badge variant="outline">Week {week.week}</Badge>
                  <span className="text-sm font-medium">{week.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lessons and assignments</p>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    {week.lessons.map((key) => <li key={key}>{findCurriculumModule(key)?.title ?? key}</li>)}
                  </ul>
                </div>
                <p className="text-sm"><span className="font-semibold">In-class activity:</span> {week.activity}</p>
                {week.assessment && <p className="text-sm"><span className="font-semibold">Assessment:</span> {week.assessment}</p>}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5 text-primary" /> Assessment
          </CardTitle>
          <CardDescription>Your grade measures the quality of your analysis and forecasting process.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {SYLLABUS_WEIGHTS.map((item) => (
                  <tr key={item.item} className="border-b last:border-0">
                    <td className="py-2 pr-4">{item.item}</td>
                    <td className="py-2 text-right font-medium">{item.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Project rubrics</h2>
        <Accordion type="multiple" className="w-full">
          {RUBRICS.map((rubric) => (
            <AccordionItem key={rubric.key} value={rubric.key}>
              <AccordionTrigger className="text-left">
                <span className="flex flex-1 flex-wrap items-center gap-2 pr-3">
                  <span className="text-sm font-medium">{rubric.title}</span>
                  <Badge variant="secondary">{rubric.weight}</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-xs">
                    <thead className="border-b text-left text-muted-foreground">
                      <tr><th className="p-2">Criterion</th>{RUBRIC_LEVELS.map((level) => <th key={level} className="p-2">{level}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rubric.criteria.map((criterion) => (
                        <tr key={criterion.name} className="border-b align-top last:border-0">
                          <td className="p-2 font-medium">{criterion.name}</td>
                          {criterion.levels.map((level, index) => <td key={`${criterion.name}-${index}`} className="p-2">{level}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
