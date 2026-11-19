// Instructor visibility library for the unchanged built-in 15-week course.
// Hidden lessons remain stored and can be restored without losing progress.
import { useMemo, useState } from "react";
import { BookOpen, Clock, EyeOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRICULUM } from "@/data/curriculum";
import { LessonMarkdown } from "@/components/learn/LessonMarkdown";
import { useAssignedLessons, useSetCurriculumVisibility } from "@/hooks/useCurriculum";
import { courseWeekForLesson, FULL_COURSE_ENTRIES, isCourseLessonVisible } from "@/lib/defaultCourse";

type LibraryView = "course" | "library";

export function CurriculumLibrary({ classId }: { classId: string }) {
  const { data: assigned = [] } = useAssignedLessons(classId);
  const setCourseVisibility = useSetCurriculumVisibility();
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<LibraryView>("course");

  const assignedByKey = useMemo(
    () => new Map(assigned.filter((lesson) => lesson.curriculum_key).map((lesson) => [lesson.curriculum_key!, lesson])),
    [assigned],
  );
  const nextSort = Math.max(-1, ...assigned.map((lesson) => lesson.sort_order)) + 1;
  const visibleCount = FULL_COURSE_ENTRIES.filter(({ module }) => isCourseLessonVisible(assignedByKey.get(module.key))).length;
  const libraryCount = FULL_COURSE_ENTRIES.length - visibleCount;

  const setVisibility = async (
    label: string,
    entries: { module: (typeof CURRICULUM)[number]["modules"][number]; topicKey: string }[],
    visible: boolean,
  ) => {
    if (!entries.length) {
      toast.info("Nothing to change");
      return;
    }
    setBusy(label);
    try {
      await setCourseVisibility.mutateAsync({
        classId,
        modules: entries,
        visible,
        dueAt: visible ? dueAt || null : null,
        startSortOrder: nextSort,
      });
      toast.success(visible
        ? `Restored ${entries.length} lesson${entries.length === 1 ? "" : "s"} to the student course`
        : `Moved ${entries.length} lesson${entries.length === 1 ? "" : "s"} to the library`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update course visibility");
    } finally {
      setBusy(null);
    }
  };

  const renderView = (which: LibraryView) => {
    const topics = CURRICULUM.map((topic) => ({
      topic,
      entries: topic.modules
        .map((module) => ({ module, topicKey: topic.key }))
        .filter(({ module }) => isCourseLessonVisible(assignedByKey.get(module.key)) === (which === "course")),
    })).filter(({ entries }) => entries.length > 0);

    if (!topics.length) {
      return (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {which === "library" ? "No hidden lessons. Anything you remove from the student course will appear here." : "No visible lessons. Restore them from the library."}
        </p>
      );
    }

    return (
      <Accordion type="multiple" className="w-full">
        {topics.map(({ topic, entries }) => (
          <AccordionItem key={`${which}-${topic.key}`} value={topic.key}>
            <AccordionTrigger className="text-left">
              <span className="flex flex-1 items-center gap-2 pr-3">
                <span className="text-sm font-medium">{topic.title}</span>
                <Badge variant="outline" className="text-xs">{entries.length} {which === "course" ? "visible" : "hidden"}</Badge>
                <span className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                  <Clock className="h-3 w-3" /> {entries.reduce((sum, entry) => sum + entry.module.minutes, 0)} min
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-sm text-muted-foreground">{topic.summary}</p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => setVisibility(`${which}-${topic.key}`, entries, which === "library")}
                >
                  {which === "course" ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" /> Move topic to library</> : <><RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore topic</>}
                </Button>
              </div>
              <div className="space-y-2">
                {entries.map(({ module, topicKey }) => {
                  const week = courseWeekForLesson(module.key);
                  return (
                    <div key={module.key} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{module.title}</span>
                            {week && <Badge variant="secondary" className="text-xs">Week {week}</Badge>}
                            {module.kind === "assignment" && <Badge variant="outline" className="text-xs">Assignment</Badge>}
                            {module.requiresAck && <Badge variant="outline" className="text-xs">Acknowledgment</Badge>}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">~{module.minutes} min {module.kind === "assignment" ? "to complete" : "read"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={which === "course" ? "outline" : "secondary"}
                          disabled={busy !== null}
                          onClick={() => setVisibility(module.key, [{ module, topicKey }], which === "library")}
                        >
                          {which === "course" ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" /> Move to library</> : <><RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore</>}
                        </Button>
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-primary">Preview unchanged content</summary>
                        <div className="mt-2 border-t pt-2"><LessonMarkdown body={module.body} /></div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" /> 15-week student course
            </CardTitle>
            <CardDescription>
              Every class starts with the full course visible. Move lessons to the library to hide them from students,
              then restore them later. Lesson text stays unchanged.
            </CardDescription>
            <div className="flex gap-2 pt-1">
              <Badge variant="secondary">{visibleCount} visible</Badge>
              <Badge variant="outline">{libraryCount} in library</Badge>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="curriculum-due" className="text-xs">Due date when restoring (optional)</Label>
            <Input id="curriculum-due" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="w-44" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(value) => setView(value as LibraryView)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="course">Student course ({visibleCount})</TabsTrigger>
            <TabsTrigger value="library">Library ({libraryCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="course" className="mt-4">{renderView("course")}</TabsContent>
          <TabsContent value="library" className="mt-4">{renderView("library")}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
