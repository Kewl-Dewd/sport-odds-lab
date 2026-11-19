// Full student course: published lessons plus a student-safe 15-week overview.
import { AssignedLearning } from "@/components/learn/AssignedLearning";
import { StudentCourseOverview } from "@/components/learn/StudentCourseOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Learn() {
  return (
    <div className="container max-w-6xl py-8 md:py-12">
      <header className="mb-8 border-b border-foreground/15 pb-7">
        <div className="section-kicker mb-3">Your complete course</div>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.05em] md:text-5xl">Learning</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Work through the full 15-week course, including lessons, quizzes, assignments and project rubrics.
          Your instructor controls which lessons appear in your class.
        </p>
      </header>
      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="lessons">Course lessons</TabsTrigger>
          <TabsTrigger value="overview">15-week overview</TabsTrigger>
        </TabsList>
        <TabsContent value="lessons"><AssignedLearning /></TabsContent>
        <TabsContent value="overview"><StudentCourseOverview /></TabsContent>
      </Tabs>
    </div>
  );
}
