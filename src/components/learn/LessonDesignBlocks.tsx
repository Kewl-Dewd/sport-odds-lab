// Objectives (top), and task + quiz + reflection (bottom) for a lesson.
import { useState } from "react";
import { ClipboardList, MessageSquareText, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LessonDesign } from "@/data/lessonDesign";
import { QuizCard } from "./QuizCard";

export function LessonObjectives({ design }: { design: LessonDesign }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> By the end you can</p>
      <ul className="list-disc space-y-0.5 pl-5 text-sm">{design.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
    </div>
  );
}

export function LessonActivities({ design, classId, quizKey, best, savedReflection, onSaveReflection }: {
  design: LessonDesign; classId?: string; quizKey: string; best?: number;
  savedReflection?: string | null; onSaveReflection: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState(savedReflection ?? "");
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-accent/40 bg-accent/10 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><ClipboardList className="h-4 w-4" /> Try it in the app</p>
        <p className="text-sm">{design.task}</p>
      </div>
      <QuizCard classId={classId} quizKey={quizKey} title="Check your understanding" questions={design.quiz} best={best} />
      <div className="rounded-lg border p-3 space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><MessageSquareText className="h-4 w-4" /> Reflect</p>
        <p className="text-sm text-muted-foreground">{design.reflection}</p>
        <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer (your instructor can read this)" />
        <Button size="sm" variant="outline" disabled={!text.trim() || saving} onClick={async () => {
          setSaving(true);
          try { await onSaveReflection(text.trim()); toast.success("Reflection saved and lesson marked complete"); }
          catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
          finally { setSaving(false); }
        }}>Save reflection</Button>
      </div>
    </div>
  );
}
