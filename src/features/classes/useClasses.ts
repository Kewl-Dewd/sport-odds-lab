// Hooks for instructor class management and student membership.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  db,
  unwrap,
  type ClassRow,
  type ClassMemberRow,
  type JoinClassResult,
  type ProfileRow,
} from "@/features/db";

// ── Instructor: my classes ────────────────────────────────────────

export function useMyClasses() {
  const { user, isInstructorAccount } = useAuth();
  return useQuery({
    queryKey: ["classes", "mine", user?.id],
    enabled: !!user && isInstructorAccount,
    queryFn: async () =>
      unwrap<ClassRow[]>(
        await db
          .from("classes")
          .select("*")
          .eq("owner_id", user!.id)
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useClass(classId: string | undefined) {
  return useQuery({
    queryKey: ["classes", classId],
    enabled: !!classId,
    queryFn: async () =>
      unwrap<ClassRow>(
        await db.from("classes").select("*").eq("id", classId!).single(),
      ),
  });
}

export interface RosterEntry extends ClassMemberRow {
  profile: ProfileRow | null;
}

export function useRoster(classId: string | undefined) {
  return useQuery({
    queryKey: ["roster", classId],
    enabled: !!classId,
    queryFn: async (): Promise<RosterEntry[]> => {
      const members = unwrap<ClassMemberRow[]>(
        await db
          .from("class_members")
          .select("*")
          .eq("class_id", classId!)
          .order("joined_at", { ascending: true }),
      );
      if (members.length === 0) return [];
      const profiles = unwrap<ProfileRow[]>(
        await db
          .from("profiles")
          .select("*")
          .in("user_id", members.map((m) => m.user_id)),
      );
      const byUser = new Map(profiles.map((p) => [p.user_id, p]));
      return members.map((m) => ({ ...m, profile: byUser.get(m.user_id) ?? null }));
    },
  });
}

export function useCreateClass() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      term?: string;
      description?: string;
      starting_bankroll: number;
      semester_start?: string;
      semester_end?: string;
    }) =>
      unwrap<ClassRow>(
        await db
          .from("classes")
          .insert({ ...input, owner_id: user!.id })
          .select("*")
          .single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<ClassRow>) =>
      unwrap<ClassRow>(
        await db.from("classes").update(updates).eq("id", classId).select("*").single(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useRegenerateJoinCode(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Same unambiguous alphabet the DB default uses.
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = Array.from(
          { length: 6 },
          () => alphabet[Math.floor(Math.random() * alphabet.length)],
        ).join("");
        const { data, error } = await db
          .from("classes")
          .update({ join_code: code })
          .eq("id", classId)
          .select("*")
          .single();
        if (!error) return data as ClassRow;
        if (!error.message.includes("duplicate")) throw new Error(error.message);
      }
      throw new Error("Could not generate a unique join code");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useRemoveMember(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await db.from("class_members").delete().eq("id", memberId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roster", classId] }),
  });
}

/** Reset a class: delete all persisted bets (journal entries cascade). */
export function useResetClassBets(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await db.from("bets").delete().eq("class_id", classId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bets"] });
      qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

// ── Student: membership + joining ─────────────────────────────────

export interface ActiveMembership {
  membership: ClassMemberRow;
  klass: ClassRow;
}

/** The student's most recent active-class membership (null if none). */
export function useActiveMembership() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["membership", "active", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ActiveMembership | null> => {
      const memberships = unwrap<ClassMemberRow[]>(
        await db
          .from("class_members")
          .select("*")
          .eq("user_id", user!.id)
          .order("joined_at", { ascending: false }),
      );
      if (memberships.length === 0) return null;
      const classes = unwrap<ClassRow[]>(
        await db
          .from("classes")
          .select("*")
          .in("id", memberships.map((m) => m.class_id)),
      );
      const active = memberships.find((m) =>
        classes.some((c) => c.id === m.class_id && !c.is_archived),
      );
      if (!active) return null;
      return {
        membership: active,
        klass: classes.find((c) => c.id === active.class_id)!,
      };
    },
  });
}

export function useJoinClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<JoinClassResult> => {
      const { data, error } = await db.rpc("join_class_by_code", { _code: code });
      if (error) throw new Error(error.message);
      return data as JoinClassResult;
    },
    onSuccess: (result) => {
      if (result.ok) {
        qc.invalidateQueries({ queryKey: ["membership"] });
        qc.invalidateQueries({ queryKey: ["classes"] });
      }
    },
  });
}
