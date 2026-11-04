// Quiz attempts for lesson and module quizzes. Students save attempts;
// instructors read every attempt in their class for the gradebook.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useMyQuizBest(classId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quiz", "mine", classId, user?.id],
    enabled: !!classId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_quiz_attempts")
        .select("quiz_key, score")
        .eq("class_id", classId!)
        .eq("user_id", user!.id);
      if (error) throw new Error(error.message);
      const best = new Map<string, number>();
      for (const r of data ?? []) best.set(r.quiz_key, Math.max(best.get(r.quiz_key) ?? 0, Number(r.score)));
      return best;
    },
  });
}

export function useSubmitQuiz() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { classId: string; quizKey: string; score: number; correct: number; total: number; answers: (number | null)[] }) => {
      const { error } = await supabase.from("class_quiz_attempts").insert({
        class_id: input.classId, user_id: user!.id, quiz_key: input.quizKey,
        score: input.score, correct: input.correct, total: input.total, answers: input.answers,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quiz"] }),
  });
}
