import { useMemo, useState } from "react";
import { MessageSquareQuote, CheckCircle2, Lock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useMarket,
  REFLECTION_PROMPT_LABELS,
  type ReflectionAssignment,
  type ReflectionAnswer,
  type ReflectionPrompt,
} from "@/context/MarketContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Student-facing list of open reflection assignments.
 * Renders one card per open assignment with its prompt form.
 */
export function ReflectionForm() {
  const {
    portfolio, getReflectionsForUser, getReflectionResponse,
  } = useMarket();
  const assignments = useMemo(
    () => getReflectionsForUser(portfolio.userId).filter((a) => a.status === "open"),
    [getReflectionsForUser, portfolio.userId],
  );

  if (assignments.length === 0) return null;

  return (
    <div className="space-y-3">
      {assignments.map((a) => (
        <SingleReflection
          key={a.id}
          assignment={a}
          existing={getReflectionResponse(a.id, portfolio.userId)}
        />
      ))}
    </div>
  );
}

function SingleReflection({
  assignment, existing,
}: {
  assignment: ReflectionAssignment;
  existing?: { answers: ReflectionAnswer[]; submittedAt: string };
}) {
  const { submitReflectionResponse } = useMarket();
  const [answers, setAnswers] = useState<Record<string, string | number>>(() => {
    const m: Record<string, string | number> = {};
    for (const a of existing?.answers ?? []) m[a.promptId] = a.value;
    return m;
  });
  const [submitted, setSubmitted] = useState(!!existing);

  const setAnswer = (promptId: string, value: string | number) =>
    setAnswers((prev) => ({ ...prev, [promptId]: value }));

  const handleSubmit = () => {
    // Validate required prompts
    const missing = assignment.prompts.filter((p) =>
      p.required && (answers[p.id] === undefined || answers[p.id] === ""),
    );
    if (missing.length > 0) {
      toast.error(`Please answer all required prompts (${missing.length} remaining)`);
      return;
    }
    submitReflectionResponse(
      assignment.id,
      assignment.prompts.map((p) => ({
        promptId: p.id,
        value: answers[p.id] ?? "",
      })),
    );
    setSubmitted(true);
    toast.success("Reflection submitted");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <MessageSquareQuote className="h-4 w-4 text-info" />
          {assignment.title}
          <div className="flex items-center gap-1 ml-auto">
            {assignment.required && <Badge variant="outline" className="text-[10px]">required</Badge>}
            <Badge variant="outline" className="text-[10px]">
              {assignment.visibility === "instructor-only"
                ? <><Lock className="h-2.5 w-2.5 mr-0.5" />private</>
                : <><Eye className="h-2.5 w-2.5 mr-0.5" />anonymous shared</>}
            </Badge>
            {submitted && <Badge variant="outline" className="text-[10px] border-success text-success"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />submitted</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignment.description && (
          <p className="text-xs text-muted-foreground">{assignment.description}</p>
        )}
        {assignment.prompts.map((p) => (
          <PromptInput
            key={p.id}
            prompt={p}
            value={answers[p.id]}
            onChange={(v) => setAnswer(p.id, v)}
            disabled={submitted}
          />
        ))}
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSubmit}>
            {submitted ? "Update reflection" : "Submit reflection"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PromptInput({
  prompt, value, onChange, disabled,
}: {
  prompt: ReflectionPrompt;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
  disabled?: boolean;
}) {
  const helper = REFLECTION_PROMPT_LABELS[prompt.kind];

  if (prompt.kind === "rating-confidence" || prompt.kind === "rating-process") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          {prompt.question}
          {prompt.required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              className={cn(
                "h-9 w-9 rounded-md border text-xs font-mono transition-colors",
                value === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted",
                disabled && "opacity-60 cursor-not-allowed",
              )}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">{helper} · 1 = low, 5 = high</p>
      </div>
    );
  }

  if (prompt.kind === "strategy-vs-emotion") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          {prompt.question}
          {prompt.required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={value as string | undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="strategy">Mostly followed a strategy</SelectItem>
            <SelectItem value="mixed">A mix of strategy and emotion</SelectItem>
            <SelectItem value="emotion">Mostly reacted emotionally</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Open text and "what-different"
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1.5">
        {prompt.question}
        {prompt.required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea
        rows={3}
        className="text-sm"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your response…"
      />
    </div>
  );
}
