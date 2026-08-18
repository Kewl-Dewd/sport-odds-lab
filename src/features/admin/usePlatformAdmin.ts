// Platform-administrator hooks: the cross-tenant view of every
// instructor, class, and student. All queries go through security-definer
// RPCs that return empty sets for non-admins.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { db, unwrap } from "@/features/db";

export interface DirectoryRow {
  user_id: string;
  email: string;
  display_name: string | null;
  role: "instructor" | "student" | null;
  is_admin: boolean;
  joined_at: string;
  classes_owned: number;
  classes_joined: number;
  bets_placed: number;
}

export interface PlatformClassRow {
  class_id: string;
  name: string;
  term: string | null;
  owner_id: string;
  owner_email: string | null;
  owner_name: string | null;
  join_code: string;
  is_archived: boolean;
  student_count: number;
  bet_count: number;
  created_at: string;
}

export function usePlatformDirectory() {
  const { isPlatformAdmin } = useAuth();
  return useQuery({
    queryKey: ["platform", "directory"],
    enabled: isPlatformAdmin,
    queryFn: async () => unwrap<DirectoryRow[]>(await db.rpc("platform_directory")),
  });
}

export function usePlatformClasses() {
  const { isPlatformAdmin } = useAuth();
  return useQuery({
    queryKey: ["platform", "classes"],
    enabled: isPlatformAdmin,
    queryFn: async () => unwrap<PlatformClassRow[]>(await db.rpc("platform_classes")),
  });
}

export function useSetUserAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      role: "instructor" | "student";
      platformAdmin: boolean;
    }) => {
      const { data, error } = await db.rpc("set_user_access", {
        _user_id: input.userId,
        _role: input.role,
        _platform_admin: input.platformAdmin,
      });
      if (error) throw new Error(error.message);
      const result = data as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? "Could not update access");
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["platform"] }),
  });
}
