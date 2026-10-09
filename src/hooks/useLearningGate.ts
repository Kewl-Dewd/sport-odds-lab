// First-position gate: students must acknowledge the "Before you start"
// lessons assigned to their class before placing a position.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useActiveMembership } from "@/features/classes/useClasses";
import { GATE_LESSON_KEYS } from "@/data/curriculum";

export function useLearningGate() {
  const { user, isInstructor } = useAuth();
  const { data: membership } = useActiveMembership();
  const classId = membership?.klass.id;

  const q = useQuery({
    queryKey: ["coursework", "progress", "gate", classId, user?.id],
    enabled: !!user && !!classId && !isInstructor,
    queryFn: async () => {
      const { data: lessons, error } = await supabase
        .from("class_lessons")
        .select("id")
        .eq("class_id", classId!)
        .eq("is_published", true)
        .in("curriculum_key", GATE_LESSON_KEYS);
      if (error) throw new Error(error.message);
      const ids = (lessons ?? []).map((l) => l.id);
      if (ids.length === 0) return true;
      const { data: done, error: e2 } = await supabase
        .from("class_lesson_progress")
        .select("lesson_id")
        .eq("user_id", user!.id)
        .in("lesson_id", ids);
      if (e2) throw new Error(e2.message);
      return (done ?? []).length >= ids.length;
    },
  });

  // Instructors and students outside a class are not gated.
  const cleared = isInstructor || !classId ? true : q.data === true;
  return { cleared, loading: !!classId && !isInstructor && q.isLoading };
}
