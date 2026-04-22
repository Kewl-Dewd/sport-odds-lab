import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Tracks user sessions (sign-in window) and logs page views as activity.
 * - Creates a session row on sign-in, refreshes last_seen_at every 60s,
 *   marks ended_at on sign-out / tab close.
 * - Logs each route change to user_activity.
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session lifecycle
  useEffect(() => {
    if (!user) {
      sessionIdRef.current = null;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      return;
    }
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("user_sessions")
        .insert({ user_id: user.id, user_agent: navigator.userAgent })
        .select("id")
        .single();
      if (cancelled || error || !data) return;
      sessionIdRef.current = data.id;

      heartbeatRef.current = setInterval(async () => {
        if (!sessionIdRef.current) return;
        await supabase
          .from("user_sessions")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", sessionIdRef.current);
      }, 60_000);
    })();

    const endSession = () => {
      if (!sessionIdRef.current) return;
      const id = sessionIdRef.current;
      const ts = new Date().toISOString();
      // beacon-style update so it goes through on unload
      void supabase.from("user_sessions").update({ ended_at: ts, last_seen_at: ts }).eq("id", id);
    };
    window.addEventListener("beforeunload", endSession);

    return () => {
      cancelled = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      window.removeEventListener("beforeunload", endSession);
      endSession();
    };
  }, [user]);

  // Page-view activity logging
  useEffect(() => {
    if (!user) return;
    void supabase.from("user_activity").insert([{
      user_id: user.id,
      action: "page_view",
      details: { path: location.pathname },
    }]);
  }, [user, location.pathname]);
}

/** Call from anywhere to log a custom action. */
export async function logUserAction(action: string, details?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_activity").insert([{
    user_id: user.id,
    action,
    details: (details ?? null) as never,
  }]);
}
