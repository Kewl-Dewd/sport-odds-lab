// Instructor-side curriculum library: assign whole topics or individual
// modules from the built-in sports-betting course, with an optional due date.
import { useMemo, useState } from "react";
import { BookOpen, Check, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { CURRICULUM } from "@/data/curriculum";
import { LessonMarkdown } from "@/components/learn/LessonMarkdown";
import { useAssignCurriculum, useAssignedLessons } from "@/hooks/useCurriculum";

export function CurriculumLibrary({ classId }: { classId: string }) {
  const { data: assigned = [] } = useAssignedLessons(classId);
  const assign = useAssignCurriculum();
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const assignedKeys = useMemo(
    () => new Set(assigned.map((l) => l.curriculum_key).filter(Boolean) as string[]),
    [assigned],
  );

  const nextSort = assigned.length;

  const assignModules = async (
    label: string,
    modules: { module: (typeof CURRICULUM)[number]["modules"][number]; topicKey: string }[],
  ) => {
    const fresh = modules.filter((m) => !assignedKeys.has(m.module.key));
    if (!fresh.length) {
      toast.info("Already assigned");
      return;
    }
    setBusy(label);
    try {
      await assign.mutateAsync({
        classId,
        modules: fresh,
        dueAt: dueAt || null,
        startSortOrder: nextSort,
      });
      toast.success(`Assigned ${fresh.length} module${fresh.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not assign");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" /> Curriculum library
            </CardTitle>
            <CardDescription>
              Assign a whole topic or single modules. Students see them grouped by topic in
              Assigned learning.
            </CardDescription>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="curriculum-due" className="text-xs">Due date for what you assign next</Label>
            <Input
              id="curriculum-due"
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-44"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {CURRICULUM.map((topic) => {
            const total = topic.modules.length;
            const done = topic.modules.filter((m) => assignedKeys.has(m.key)).length;
            const minutes = topic.modules.reduce((s, m) => s + m.minutes, 0);
            return (
              <AccordionItem key={topic.key} value={topic.key}>
                <AccordionTrigger className="text-left">
                  <span className="flex flex-1 items-center gap-2 pr-3">
                    <span className="text-sm font-medium">{topic.title}</span>
                    <Badge variant={done === total ? "default" : "outline"} className="text-xs">
                      {done}/{total} assigned
                    </Badge>
                    <span className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                      <Clock className="h-3 w-3" /> {minutes} min
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-xl text-sm text-muted-foreground">{topic.summary}</p>
                    <Button
                      size="sm"
                      disabled={done === total || busy === topic.key}
                      onClick={() =>
                        assignModules(
                          topic.key,
                          topic.modules.map((m) => ({ module: m, topicKey: topic.key })),
                        )
                      }
                    >
                      {done === total ? "All assigned" : "Assign topic"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {topic.modules.map((m) => {
                      const isAssigned = assignedKeys.has(m.key);
                      return (
                        <div key={m.key} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{m.title}</span>
                                {m.kind === "assignment" && (
                                  <Badge variant="secondary" className="text-xs">Assignment</Badge>
                                )}
                                {m.requiresAck && (
                                  <Badge variant="outline" className="text-xs">Acknowledgment</Badge>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">{m.minutes} min read</p>
                            </div>
                            <Button
                              size="sm"
                              variant={isAssigned ? "outline" : "secondary"}
                              disabled={isAssigned || busy === m.key}
                              onClick={() => assignModules(m.key, [{ module: m, topicKey: topic.key }])}
                            >
                              {isAssigned ? (
                                <><Check className="mr-1.5 h-3.5 w-3.5" /> Assigned</>
                              ) : (
                                <><Plus className="mr-1.5 h-3.5 w-3.5" /> Assign</>
                              )}
                            </Button>
                          </div>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-primary">Preview content</summary>
                            <div className="mt-2 border-t pt-2">
                              <LessonMarkdown body={m.body} />
                            </div>
                          </details>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
