import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface AccessRow {
  status: string;
  source: string;
  expires_at: string | null;
  last_payment_at: string | null;
  amount_cents: number | null;
}

/**
 * Student access entitlement. Instructors and platform admins are always
 * entitled; students need a paid purchase or a redeemed course code.
 */
export function useAccess() {
  const { user, isInstructorAccount, isPlatformAdminAccount, viewAs } = useAuth();

  const query = useQuery({
    queryKey: ["user-access", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AccessRow | null> => {
      const { data, error } = await supabase
        .from("user_access")
        .select("status, source, expires_at, last_payment_at, amount_cents")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as AccessRow | null;
    },
  });

  const row = query.data ?? null;
  const entitled =
    !!row &&
    row.status === "active" &&
    (!row.expires_at || new Date(row.expires_at) > new Date());

  // Staff accounts never hit the paywall — except while previewing as a student,
  // where the instructor should see exactly what a student sees.
  const staffBypass = (isInstructorAccount || isPlatformAdminAccount) && viewAs !== "student";

  return {
    access: row,
    loading: query.isLoading,
    hasAccess: staffBypass || entitled,
    isPaywalled: !staffBypass && !entitled,
    expiresAt: row?.expires_at ?? null,
    refetch: query.refetch,
  };
}

export function useRedeemCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("redeem_access_code", { _code: code });
      if (error) throw new Error(error.message);
      const result = data as unknown as { ok: boolean; error?: string; expires_at?: string };
      if (!result.ok) throw new Error(result.error ?? "Could not redeem this code");
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-access"] }),
  });
}
