// Hooks for the responsible-gambling module: lessons + acknowledgments.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { db, unwrap, type RgLessonRow, type RgAckRow } from "@/features/db";

export function useRgLessons() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rg", "lessons"],
    enabled: !!user,
    queryFn: async () =>
      unwrap<RgLessonRow[]>(
        await db
          .from("rg_lessons")
          .select("*")
          .order("sort_order", { ascending: true }),
      ),
  });
}

/** The current user's acknowledgments keyed by lesson id. */
export function useMyAcks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rg", "acks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const rows = unwrap<RgAckRow[]>(
        await db.from("rg_acknowledgments").select("*").eq("user_id", user!.id),
      );
      return new Map(rows.map((r) => [r.lesson_id, r]));
    },
  });
}

export function useAcknowledgeLesson() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { lesson_id: string; class_id: string | null }) => {
      const { error } = await db.from("rg_acknowledgments").insert({
        ...input,
        user_id: user!.id,
      });
      // Duplicate ack (unique constraint) is fine — treat as success.
      if (error && !error.message.includes("duplicate")) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rg", "acks"] }),
  });
}
