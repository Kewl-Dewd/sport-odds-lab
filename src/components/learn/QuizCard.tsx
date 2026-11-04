// Auto-graded multiple-choice quiz with per-question feedback. Retakes are
// allowed; the gradebook keeps the best score.
import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { scoreQuiz, type QuizQuestion } from "@/data/lessonDesign";
import { useSubmitQuiz } from "@/hooks/useQuizzes";
import { cn } from "@/lib/utils";

export function QuizCard({ classId, quizKey, title, questions, best }: {
  classId?: string; quizKey: string; title: string; questions: QuizQuestion[]; best?: number;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const submit = useSubmitQuiz();
  const result = scoreQuiz(questions, answers);

  const onSubmit = async () => {
    setSubmitted(true);
    if (!classId) return;
    try {
      await submit.mutateAsync({ classId, quizKey, ...result, answers });
      toast.success(`Quiz saved: ${result.correct}/${result.total}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save quiz");
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        {best != null && <span className="text-xs text-muted-foreground">Best score: {best}%</span>}
      </div>
      {questions.map((qq, i) => (
        <fieldset key={i} className="space-y-1.5">
          <legend className="text-sm font-medium">{i + 1}. {qq.q}</legend>
          <div className="grid gap-1.5">
            {qq.options.map((opt, j) => {
              const picked = answers[i] === j;
              const right = submitted && j === qq.answer;
              const wrong = submitted && picked && j !== qq.answer;
              return (
                <button
                  key={j}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((a) => a.map((v, k) => (k === i ? j : v)))}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    picked && !submitted && "border-primary bg-primary/10",
                    right && "border-success bg-success/10",
                    wrong && "border-destructive bg-destructive/10",
                    !submitted && "hover:bg-muted",
                  )}
                >
                  {right ? <Check className="h-4 w-4 text-success" /> : wrong ? <X className="h-4 w-4 text-destructive" /> : <span className="h-4 w-4" />}
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted && <p className="text-xs text-muted-foreground">{qq.why}</p>}
        </fieldset>
      ))}
      {submitted ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">Score: {result.correct}/{result.total} ({result.score}%)</span>
          <Button size="sm" variant="outline" onClick={() => { setAnswers(questions.map(() => null)); setSubmitted(false); }}>Retake</Button>
        </div>
      ) : (
        <Button size="sm" disabled={answers.some((a) => a == null) || submit.isPending} onClick={onSubmit}>Submit quiz</Button>
      )}
    </div>
  );
}
