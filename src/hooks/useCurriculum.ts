// Assigned-learning hooks: read class lessons with their topic grouping and
// assign modules from the built-in curriculum.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { CURRICULUM, LEGACY_TOPICS, type CurriculumModule } from "@/data/curriculum";
import { FULL_COURSE_ENTRIES } from "@/lib/defaultCourse";

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

/** Read-only default course for signed-in students before they join a class. */
export function getDefaultCourseLessons(): AssignedLesson[] {
  return FULL_COURSE_ENTRIES.map(({ module, topicKey }, index) => ({
    id: `default:${module.key}`,
    class_id: "",
    kind: module.kind,
    title: module.title,
    body_md: module.body,
    url: null,
    topic: topicKey,
    estimated_minutes: module.minutes,
    curriculum_key: module.key,
    requires_ack: !!module.requiresAck,
    due_at: null,
    sort_order: index,
    is_published: true,
  }));
}

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

export interface CurriculumVisibilityInput {
  classId: string;
  modules: { module: CurriculumModule; topicKey: string }[];
  visible: boolean;
  dueAt?: string | null;
  startSortOrder?: number;
}

/** Hide built-in lessons into the library or restore them without deleting progress. */
export function useSetCurriculumVisibility() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, modules, visible, dueAt, startSortOrder = 0 }: CurriculumVisibilityInput) => {
      const keys = modules.map(({ module }) => module.key);
      const { data: existing, error: readError } = await supabase
        .from("class_lessons")
        .select("id, curriculum_key")
        .eq("class_id", classId)
        .in("curriculum_key", keys);
      if (readError) throw new Error(readError.message);

      const existingKeys = new Set((existing ?? []).map((lesson) => lesson.curriculum_key));
      for (const lesson of existing ?? []) {
        const updates: { is_published: boolean; due_at?: string } = { is_published: visible };
        if (visible && dueAt) updates.due_at = new Date(dueAt).toISOString();
        const { error } = await supabase.from("class_lessons").update(updates).eq("id", lesson.id);
        if (error) throw new Error(error.message);
      }

      const fresh = modules.filter(({ module }) => !existingKeys.has(module.key));
      if (fresh.length) {
        const rows = fresh.map(({ module, topicKey }, index) => ({
          class_id: classId,
          kind: module.kind,
          title: module.title,
          body_md: module.body,
          topic: topicKey,
          curriculum_key: module.key,
          estimated_minutes: module.minutes,
          requires_ack: !!module.requiresAck,
          due_at: visible && dueAt ? new Date(dueAt).toISOString() : null,
          sort_order: startSortOrder + index,
          is_published: visible,
          created_by: user?.id ?? null,
        }));
        const { error } = await supabase.from("class_lessons").insert(rows as never);
        if (error) throw new Error(error.message);
      }
      return modules.length;
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
  const k = LEGACY_TOPICS[key] ?? key;
  return CURRICULUM.find((t) => t.key === k)?.title ?? (key === "General" ? "Other coursework" : key);
}
