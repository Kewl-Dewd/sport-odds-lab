// Student-facing assigned learning: instructor-assigned modules grouped into
// topics with progress, due dates and completion tracking.
import { useMemo, useState } from "react";
import { BookOpen, Check, Clock, ExternalLink, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useActiveClass } from "@/context/ClassContext";
import { LessonMarkdown } from "@/components/learn/LessonMarkdown";
import { useAssignedLessons, topicTitle, type AssignedLesson } from "@/hooks/useCurriculum";
import { useCompleteLesson, useMyCourseworkProgress } from "@/features/coursework/useCoursework";

function dueLabel(due: string | null) {
  if (!due) return null;
  const d = new Date(due);
  const overdue = d.getTime() < Date.now();
  return { text: `Due ${d.toLocaleDateString()}`, overdue };
}

export function AssignedLearning({ compact = false }: { compact?: boolean }) {
  const { activeEnrollment } = useActiveClass();
  const classId = activeEnrollment?.klass.id;
  const { data: lessons = [], isLoading } = useAssignedLessons(classId, { publishedOnly: true });
  const { data: progress = new Map() } = useMyCourseworkProgress(classId);
  const complete = useCompleteLesson();
  const [busy, setBusy] = useState<string | null>(null);

  const topics = useMemo(() => {
    const map = new Map<string, AssignedLesson[]>();
    lessons.forEach((l) => {
      const key = l.topic || "General";
      map.set(key, [...(map.get(key) ?? []), l]);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [lessons]);

  const done = lessons.filter((l) => progress.has(l.id)).length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  const markDone = async (lesson: AssignedLesson) => {
    if (!classId) return;
    setBusy(lesson.id);
    try {
      await complete.mutateAsync({ lesson_id: lesson.id, class_id: classId });
      toast.success(lesson.requires_ack ? "Acknowledged" : "Module complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-primary" /> Assigned learning
            </CardTitle>
            <CardDescription>
              {activeEnrollment ? activeEnrollment.klass.name : "Join a class to see your modules"}
            </CardDescription>
          </div>
          {lessons.length > 0 && (
            <Badge variant="outline" className="shrink-0">{done}/{lessons.length} complete</Badge>
          )}
        </div>
        {lessons.length > 0 && <Progress value={pct} className="mt-3 h-2" />}
      </CardHeader>
      <CardContent className="space-y-3">
        {!activeEnrollment ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            You&apos;re not enrolled yet.{" "}
            <Link to="/join" className="text-primary underline">Enter your course code</Link>.
          </p>
        ) : isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading your modules…</p>
        ) : lessons.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Your instructor hasn&apos;t assigned any modules yet. In the meantime, read the{" "}
            <Link to="/responsible-play" className="text-primary underline">responsible play</Link>{" "}
            guide.
          </p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {topics.map(([topicKey, items]) => {
              const tDone = items.filter((l) => progress.has(l.id)).length;
              return (
                <AccordionItem key={topicKey} value={topicKey}>
                  <AccordionTrigger className="text-left">
                    <span className="flex flex-1 items-center gap-2 pr-3">
                      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium">{topicTitle(topicKey)}</span>
                      <Badge
                        variant={tDone === items.length ? "default" : "outline"}
                        className="ml-auto text-xs"
                      >
                        {tDone}/{items.length}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    {items.map((l) => {
                      const isDone = progress.has(l.id);
                      const due = dueLabel(l.due_at);
                      return (
                        <details key={l.id} className="rounded-lg border p-3" open={!compact && !isDone && items.indexOf(l) === 0}>
                          <summary className="cursor-pointer list-none">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{l.title}</span>
                              {isDone && <Check className="h-4 w-4 text-success" />}
                              {l.requires_ack && !isDone && (
                                <Badge variant="outline" className="text-xs">Required</Badge>
                              )}
                              {l.estimated_minutes ? (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" /> {l.estimated_minutes} min
                                </span>
                              ) : null}
                              {due && (
                                <span className={`text-xs ${due.overdue && !isDone ? "text-destructive" : "text-muted-foreground"}`}>
                                  {due.text}
                                </span>
                              )}
                            </span>
                          </summary>
                          <div className="mt-3 space-y-3 border-t pt-3">
                            {l.body_md && <LessonMarkdown body={l.body_md} />}
                            {l.url && (
                              <a
                                href={l.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1.5 text-sm text-primary underline"
                              >
                                Open resource <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant={isDone ? "outline" : "default"}
                              disabled={isDone || busy === l.id}
                              onClick={() => markDone(l)}
                            >
                              {isDone
                                ? "Completed"
                                : l.requires_ack
                                  ? "I read and acknowledge this"
                                  : "Mark complete"}
                            </Button>
                          </div>
                        </details>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
