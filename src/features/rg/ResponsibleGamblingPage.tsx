import { useState } from "react";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useActiveMembership } from "@/features/classes/useClasses";
import { useAcknowledgeLesson, useMyAcks, useRgLessons } from "@/features/rg/useRg";
import { HouseMoneyBanner } from "@/features/HouseMoneyBanner";
import type { RgLessonRow } from "@/features/db";

export default function ResponsibleGamblingPage() {
  const { data: lessons = [], isLoading } = useRgLessons();
  const { data: acks = new Map() } = useMyAcks();

  const published = lessons.filter((l) => l.is_published);
  const ackable = published.filter((l) => l.requires_ack);
  const completed = ackable.filter((l) => acks.has(l.id)).length;
  const progress = ackable.length > 0 ? (completed / ackable.length) * 100 : 100;

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Responsible Play
        </h1>
        <p className="text-sm text-muted-foreground">
          Short required readings on how gambling markets actually treat their
          customers — and how to notice when a game stops being a game.
        </p>
      </div>

      <HouseMoneyBanner />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your progress</CardTitle>
          <CardDescription>
            {completed} of {ackable.length} checkpoints acknowledged
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} />
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading lessons…</p>
      ) : (
        <div className="space-y-3">
          {published.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} acknowledged={acks.has(lesson.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonCard({ lesson, acknowledged }: { lesson: RgLessonRow; acknowledged: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { data: membership } = useActiveMembership();
  const ackLesson = useAcknowledgeLesson();

  const acknowledge = async () => {
    try {
      await ackLesson.mutateAsync({
        lesson_id: lesson.id,
        class_id: membership?.klass.id ?? null,
      });
      toast.success("Checkpoint recorded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record acknowledgment");
    }
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            {acknowledged
              ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
            {lesson.title}
          </span>
          {acknowledged && <Badge variant="outline">Acknowledged</Badge>}
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm leading-relaxed">
            {lesson.body_md.split(/\n{2,}/).map((block, i) =>
              block.trim().startsWith("-") ? (
                <ul key={i} className="list-disc space-y-1 pl-5">
                  {block.split("\n").map((line, j) => (
                    <li key={j}>{line.replace(/^-\s*/, "")}</li>
                  ))}
                </ul>
              ) : (
                <p key={i}>{block}</p>
              ),
            )}
          </div>
          {lesson.requires_ack && !acknowledged && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(v) => setConfirmed(v === true)}
                  className="mt-0.5"
                />
                <span>I have read and understood this lesson.</span>
              </label>
              <Button size="sm" disabled={!confirmed || ackLesson.isPending} onClick={acknowledge}>
                {ackLesson.isPending ? "Recording…" : "Acknowledge checkpoint"}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
