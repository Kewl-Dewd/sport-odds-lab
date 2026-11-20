// LMS course shell: the 15 weeks are the course; syllabus details sit in a collapsible panel.
import { ChevronDown } from "lucide-react";
import { AssignedLearning } from "@/components/learn/AssignedLearning";
import { StudentCourseOverview } from "@/components/learn/StudentCourseOverview";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export default function Learn() {
  return (
    <div className="container max-w-6xl py-8 md:py-12">
      <header className="mb-8 border-b border-foreground/15 pb-7">
        <div className="section-kicker mb-3">Your complete course</div>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.05em] md:text-5xl">Learning</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          All 15 weeks, mapped out. Open a week to read its lessons, take quizzes, do the app tasks and see what is due.
        </p>
      </header>
      <div className="space-y-6">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="group w-full justify-between sm:w-auto">
              Syllabus: outcomes, grading and rubrics
              <ChevronDown className="ml-2 h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4"><StudentCourseOverview showSchedule={false} /></CollapsibleContent>
        </Collapsible>
        <AssignedLearning />
      </div>
    </div>
  );
}
