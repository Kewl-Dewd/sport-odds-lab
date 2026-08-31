// The "learning" half of the student dashboard: whatever the instructor
// assigned for the active class, plus progress tracking.
import { useState } from "react";
import { BookOpen, Check, ExternalLink, ShieldAlert, FileText, Notebook } from "lucide-react";
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
import { useClassLessons, useCompleteLesson, useMyCourseworkProgress } from "@/features/coursework/useCoursework";
import type { ClassLessonRow } from "@/features/db";

const KIND_ICON = {
  lesson: FileText,
  link: ExternalLink,
  rg: ShieldAlert,
  assignment: Notebook,
} as const;

export function StudentCourseworkPanel() {
  const { activeEnrollment } = useActiveClass();
  const classId = activeEnrollment?.klass.id;
  const { data: lessons = [], isLoading } = useClassLessons(classId, { publishedOnly: true });
  const { data: progress = new Map() } = useMyCourseworkProgress(classId);
  const complete = useCompleteLesson();
  const [busy, setBusy] = useState<string | null>(null);

  const done = lessons.filter((l) => progress.has(l.id)).length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  const markDone = async (lesson: ClassLessonRow) => {
    if (!classId) return;
    setBusy(lesson.id);
    try {
      await complete.mutateAsync({ lesson_id: lesson.id, class_id: classId });
      toast.success(lesson.requires_ack ? "Acknowledged" : "Marked complete");
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
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Coursework
            </CardTitle>
            <CardDescription>
              {activeEnrollment ? activeEnrollment.klass.name : "Join a class to see your lessons"}
            </CardDescription>
          </div>
          {lessons.length > 0 && (
            <Badge variant="outline" className="shrink-0">{done}/{lessons.length} done</Badge>
          )}
        </div>
        {lessons.length > 0 && <Progress value={pct} className="mt-3 h-2" />}
      </CardHeader>
      <CardContent className="space-y-3">
        {!activeEnrollment ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            You&apos;re not enrolled yet.{" "}
            <Link to="/join" className="text-primary underline">Enter your course code</Link>.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading coursework…</p>
        ) : lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Your instructor hasn&apos;t posted coursework yet. In the meantime, read the{" "}
            <Link to="/responsible-play" className="text-primary underline">responsible play</Link>{" "}
            module or review your <Link to="/journal" className="text-primary underline">bet journal</Link>.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {lessons.map((l) => {
              const Icon = KIND_ICON[l.kind] ?? FileText;
              const isDone = progress.has(l.id);
              return (
                <AccordionItem key={l.id} value={l.id}>
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-2 pr-2">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{l.title}</span>
                      {isDone && <Check className="h-4 w-4 text-success" />}
                      {l.requires_ack && !isDone && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    {l.due_at && (
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(l.due_at).toLocaleString()}
                      </p>
                    )}
                    {l.body_md && (
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">{l.body_md}</p>
                    )}
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
                    <div>
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
