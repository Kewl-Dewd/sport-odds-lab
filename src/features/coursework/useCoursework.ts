// Hooks for class coursework ("course in a box"), progress and invites.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  db,
  unwrap,
  type ClassInviteRow,
  type ClassLessonProgressRow,
  type ClassLessonRow,
} from "@/features/db";

export function useClassLessons(classId: string | undefined, opts?: { publishedOnly?: boolean }) {
  return useQuery({
    queryKey: ["coursework", classId, opts?.publishedOnly ?? false],
    enabled: !!classId,
    queryFn: async () => {
      let q = db.from("class_lessons").select("*").eq("class_id", classId!);
      if (opts?.publishedOnly) q = q.eq("is_published", true);
      return unwrap<ClassLessonRow[]>(
        await q.order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      );
    },
  });
}

export function useCreateLesson(classId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ClassLessonRow>) =>
      unwrap<ClassLessonRow>(
        await db
          .from("class_lessons")
          .insert({ ...input, class_id: classId, created_by: user?.id ?? null })
          .select("*")
          .single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coursework"] }),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClassLessonRow> & { id: string }) =>
      unwrap<ClassLessonRow>(
        await db.from("class_lessons").update(updates).eq("id", id).select("*").single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coursework"] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("class_lessons").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coursework"] }),
  });
}

/** The signed-in student's completions for a class, keyed by lesson id. */
export function useMyCourseworkProgress(classId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coursework", "progress", classId, user?.id],
    enabled: !!classId && !!user,
    queryFn: async () => {
      const rows = unwrap<ClassLessonProgressRow[]>(
        await db
          .from("class_lesson_progress")
          .select("*")
          .eq("class_id", classId!)
          .eq("user_id", user!.id),
      );
      return new Map(rows.map((r) => [r.lesson_id, r]));
    },
  });
}

/** Every student's completions for a class (instructor view). */
export function useClassCourseworkProgress(classId: string | undefined) {
  return useQuery({
    queryKey: ["coursework", "progress", "class", classId],
    enabled: !!classId,
    queryFn: async () =>
      unwrap<ClassLessonProgressRow[]>(
        await db.from("class_lesson_progress").select("*").eq("class_id", classId!),
      ),
  });
}

export function useCompleteLesson() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { lesson_id: string; class_id: string; response?: string }) => {
      const { error } = await db
        .from("class_lesson_progress")
        .upsert(
          {
            lesson_id: input.lesson_id,
            class_id: input.class_id,
            user_id: user!.id,
            response: input.response ?? null,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "lesson_id,user_id" },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coursework", "progress"] }),
  });
}

// ── Invites ───────────────────────────────────────────────────────

export function useClassInvites(classId: string | undefined) {
  return useQuery({
    queryKey: ["invites", classId],
    enabled: !!classId,
    queryFn: async () =>
      unwrap<ClassInviteRow[]>(
        await db
          .from("class_invites")
          .select("*")
          .eq("class_id", classId!)
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useSendInvites(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emails: string[]) => {
      const { data, error } = await db.functions.invoke("send-class-invite", {
        body: { class_id: classId, emails },
      });
      if (error) throw new Error(error.message);
      return data as { sent: number; failed: string[] };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites", classId] }),
  });
}

export function useRevokeInvite(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("class_invites").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites", classId] }),
  });
}
