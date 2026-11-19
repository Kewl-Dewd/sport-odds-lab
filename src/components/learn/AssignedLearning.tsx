// Student-facing course: class-published modules, or the full default course
// before a student joins a class, with progress, quizzes and reflections.
import { useMemo, useState } from "react";
import { BookOpen, Check, Clock, ExternalLink, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useActiveClass } from "@/context/ClassContext";
import { LessonMarkdown } from "@/components/learn/LessonMarkdown";
import { getDefaultCourseLessons, useAssignedLessons, topicTitle, type AssignedLesson } from "@/hooks/useCurriculum";
import { useCompleteLesson, useMyCourseworkProgress } from "@/features/coursework/useCoursework";
import { lessonDesign, moduleQuiz, moduleQuizKey } from "@/data/lessonDesign";
import { CURRICULUM, LEGACY_TOPICS } from "@/data/curriculum";
import { useMyQuizBest } from "@/hooks/useQuizzes";
import { LessonActivities, LessonObjectives } from "@/components/learn/LessonDesignBlocks";
import { QuizCard } from "@/components/learn/QuizCard";
import { courseTopicForLesson, courseWeekForLesson } from "@/lib/defaultCourse";

function dueLabel(due: string | null) {
  if (!due) return null;
  const d = new Date(due);
  const overdue = d.getTime() < Date.now();
  return { text: `Due ${d.toLocaleDateString()}`, overdue };
}

export function AssignedLearning({ compact = false }: { compact?: boolean }) {
  const { activeEnrollment } = useActiveClass();
  const classId = activeEnrollment?.klass.id;
  const { data: storedLessons = [], isLoading } = useAssignedLessons(classId, { publishedOnly: true });
  const isDefaultCourse = !classId && !compact;
  const lessons = useMemo(
    () => isDefaultCourse ? getDefaultCourseLessons() : storedLessons,
    [isDefaultCourse, storedLessons],
  );
  const { data: progress = new Map() } = useMyCourseworkProgress(classId);
  const complete = useCompleteLesson();
  const { data: best = new Map<string, number>() } = useMyQuizBest(classId);
  const [busy, setBusy] = useState<string | null>(null);

  const topics = useMemo(() => {
    const map = new Map<string, AssignedLesson[]>();
    lessons.forEach((lesson) => {
      const key = courseTopicForLesson(lesson.curriculum_key) ?? LEGACY_TOPICS[lesson.topic] ?? lesson.topic ?? "General";
      map.set(key, [...(map.get(key) ?? []), lesson]);
    });
    const topicRank = (key: string) => {
      const index = CURRICULUM.findIndex((topic) => topic.key === key);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    return [...map.entries()]
      .sort((a, b) => topicRank(a[0]) - topicRank(b[0]) || a[0].localeCompare(b[0]))
      .map(([key, items]) => {
        const authoredOrder = new Map(
          (CURRICULUM.find((topic) => topic.key === key)?.modules ?? []).map((module, index) => [module.key, index]),
        );
        const ordered = [...items].sort((a, b) =>
          (authoredOrder.get(a.curriculum_key ?? "") ?? Number.MAX_SAFE_INTEGER)
          - (authoredOrder.get(b.curriculum_key ?? "") ?? Number.MAX_SAFE_INTEGER)
          || a.sort_order - b.sort_order,
        );
        return [key, ordered] as [string, AssignedLesson[]];
      });
  }, [lessons]);

  const done = classId ? lessons.filter((lesson) => progress.has(lesson.id)).length : 0;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  const markDone = async (lesson: AssignedLesson) => {
    if (!classId) return;
    setBusy(lesson.id);
    try {
      await complete.mutateAsync({ lesson_id: lesson.id, class_id: classId });
      toast.success(lesson.requires_ack ? "Acknowledged" : "Lesson complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
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
              <GraduationCap className="h-5 w-5 text-primary" /> {compact ? "Assigned learning" : "15-week course"}
            </CardTitle>
            <CardDescription>
              {activeEnrollment
                ? `${activeEnrollment.klass.name} · lessons published by your instructor`
                : "The full default course · join a class to save your work"}
            </CardDescription>
          </div>
          {classId && lessons.length > 0 && (
            <Badge variant="outline" className="shrink-0">{done}/{lessons.length} complete</Badge>
          )}
          {isDefaultCourse && <Badge variant="secondary" className="shrink-0">15 weeks</Badge>}
        </div>
        {classId && lessons.length > 0 && <Progress value={pct} className="mt-3 h-2" />}
      </CardHeader>
      <CardContent className="space-y-3">
        {compact && !activeEnrollment ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            You&apos;re not enrolled yet. <Link to="/join" className="text-primary underline">Enter your course code</Link>.
          </p>
        ) : classId && isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading your modules…</p>
        ) : lessons.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Your instructor hasn&apos;t published any modules yet. In the meantime, read the{" "}
            <Link to="/responsible-play" className="text-primary underline">responsible play</Link> guide.
          </p>
        ) : (
          <>
            {isDefaultCourse && (
              <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                You can read every lesson and try every quiz now. <Link to="/join" className="text-primary underline">Join a class</Link>{" "}
                to save completions, quiz scores and reflections.
              </p>
            )}
            <Accordion type="multiple" className="w-full">
              {topics.map(([topicKey, items]) => {
                const tDone = classId ? items.filter((lesson) => progress.has(lesson.id)).length : 0;
                return (
                  <AccordionItem key={topicKey} value={topicKey}>
                    <AccordionTrigger className="text-left">
                      <span className="flex flex-1 items-center gap-2 pr-3">
                        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium">{topicTitle(topicKey)}</span>
                        <Badge variant={classId && tDone === items.length ? "default" : "outline"} className="ml-auto text-xs">
                          {classId ? `${tDone}/${items.length}` : `${items.length} lessons`}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {items.map((lesson, itemIndex) => {
                        const isDone = progress.has(lesson.id);
                        const due = dueLabel(lesson.due_at);
                        const week = courseWeekForLesson(lesson.curriculum_key);
                        return (
                          <details key={lesson.id} className="rounded-lg border p-3" open={!compact && !isDone && itemIndex === 0}>
                            <summary className="cursor-pointer list-none">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">{lesson.title}</span>
                                {!compact && week && <Badge variant="secondary" className="text-xs">Week {week}</Badge>}
                                {isDone && <Check className="h-4 w-4 text-success" />}
                                {lesson.requires_ack && !isDone && <Badge variant="outline" className="text-xs">Required</Badge>}
                                {lesson.estimated_minutes ? (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" /> {lesson.estimated_minutes} min
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
                              {(() => { const design = lessonDesign(lesson.curriculum_key); return design ? <LessonObjectives design={design} /> : null; })()}
                              {lesson.body_md && <LessonMarkdown body={lesson.body_md} />}
                              {lesson.url && (
                                <a href={lesson.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-sm text-primary underline">
                                  Open resource <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {(() => {
                                const design = lessonDesign(lesson.curriculum_key);
                                if (!design || compact) return null;
                                return (
                                  <LessonActivities
                                    design={design}
                                    classId={classId}
                                    quizKey={lesson.curriculum_key!}
                                    best={best.get(lesson.curriculum_key!)}
                                    savedReflection={progress.get(lesson.id)?.response}
                                    saveDisabled={!classId}
                                    onSaveReflection={async (text) => {
                                      if (!classId) return;
                                      await complete.mutateAsync({ lesson_id: lesson.id, class_id: classId, response: text });
                                    }}
                                  />
                                );
                              })()}
                              <Button size="sm" variant={isDone ? "outline" : "default"} disabled={!classId || isDone || busy === lesson.id} onClick={() => markDone(lesson)}>
                                {!classId ? "Join a class to save" : isDone ? "Completed" : lesson.requires_ack ? "I read and acknowledge this" : "Mark complete"}
                              </Button>
                            </div>
                          </details>
                        );
                      })}
                      {!compact && (() => {
                        const topic = LEGACY_TOPICS[topicKey] ?? topicKey;
                        const questions = moduleQuiz(topic);
                        if (!questions.length) return null;
                        const key = moduleQuizKey(topic);
                        return <QuizCard classId={classId} quizKey={key} title="Module quiz" questions={questions} best={best.get(key)} />;
                      })()}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );
}
