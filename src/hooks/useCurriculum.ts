// Assigned-learning hooks: read class lessons with their topic grouping and
// assign modules from the built-in curriculum.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { CURRICULUM, type CurriculumModule } from "@/data/curriculum";

export interface AssignedLesson {
  id: string;
  class_id: string;
  kind: string;
  title: string;
  body_md: string;
  url: string | null;
  topic: string;
  estimated_minutes: number | null;
  curriculum_key: string | null;
  requires_ack: boolean;
  due_at: string | null;
  sort_order: number;
  is_published: boolean;
}

const SELECT =
  "id, class_id, kind, title, body_md, url, topic, estimated_minutes, curriculum_key, requires_ack, due_at, sort_order, is_published";

export function useAssignedLessons(classId?: string, opts?: { publishedOnly?: boolean }) {
  return useQuery({
    queryKey: ["coursework", "assigned", classId, opts?.publishedOnly ?? false],
    enabled: !!classId,
    queryFn: async (): Promise<AssignedLesson[]> => {
      let q = supabase.from("class_lessons").select(SELECT).eq("class_id", classId!);
      if (opts?.publishedOnly) q = q.eq("is_published", true);
      const { data, error } = await q
        .order("topic", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as AssignedLesson[];
    },
  });
}

export interface AssignInput {
  classId: string;
  modules: { module: CurriculumModule; topicKey: string }[];
  dueAt?: string | null;
  startSortOrder?: number;
}

export function useAssignCurriculum() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, modules, dueAt, startSortOrder = 0 }: AssignInput) => {
      const rows = modules.map((m, i) => ({
        class_id: classId,
        kind: m.module.kind,
        title: m.module.title,
        body_md: m.module.body,
        topic: m.topicKey,
        curriculum_key: m.module.key,
        estimated_minutes: m.module.minutes,
        requires_ack: !!m.module.requiresAck,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        sort_order: startSortOrder + i,
        is_published: true,
        created_by: user?.id ?? null,
      }));
      const { error } = await supabase.from("class_lessons").insert(rows as never);
      if (error) throw new Error(error.message);
      return rows.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coursework"] }),
  });
}

export function useUpdateAssignedLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AssignedLesson>) => {
      const { error } = await supabase.from("class_lessons").update(updates as never).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coursework"] }),
  });
}

export function useRemoveAssignedLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("class_lessons").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coursework"] }),
  });
}

/** Topic display title for a stored topic key (falls back to the raw value). */
export function topicTitle(key: string) {
  return CURRICULUM.find((t) => t.key === key)?.title ?? (key === "General" ? "Other coursework" : key);
}
