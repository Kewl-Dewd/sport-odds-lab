import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/** Seconds of no input before we stop counting the user as active. */
const IDLE_TIMEOUT_MS = 60_000;
/** How often we tick the local active-time counter. */
const TICK_MS = 5_000;
/** How often we flush accumulated active time to the database. */
const FLUSH_EVERY_TICKS = 6; // 30s

/**
 * Tracks user sessions and *active* time in the app.
 * - Creates a session row on sign-in.
 * - Counts a second as "active" only while the tab is visible and the user has
 *   interacted (mouse, key, touch, scroll) within the last minute — so an idle
 *   or background tab stops accruing time.
 * - Flushes active_seconds + last_seen_at every 30s and on unload.
 * - Logs each route change to user_activity.
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSecondsRef = useRef(0);
  const lastInteractionRef = useRef(Date.now());

  // Session lifecycle
  useEffect(() => {
    if (!user) {
      sessionIdRef.current = null;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      return;
    }
    let cancelled = false;
    activeSecondsRef.current = 0;
    lastInteractionRef.current = Date.now();

    const markInteraction = () => { lastInteractionRef.current = Date.now(); };
    const interactionEvents = ["pointerdown", "keydown", "wheel", "touchstart", "mousemove", "scroll"] as const;
    for (const ev of interactionEvents) {
      window.addEventListener(ev, markInteraction, { passive: true });
    }
    const onVisibility = () => { if (!document.hidden) markInteraction(); };
    document.addEventListener("visibilitychange", onVisibility);

    const flush = (ended: boolean) => {
      const id = sessionIdRef.current;
      if (!id) return;
      const ts = new Date().toISOString();
      void supabase
        .from("user_sessions")
        .update({
          active_seconds: Math.round(activeSecondsRef.current),
          last_seen_at: ts,
          ...(ended ? { ended_at: ts } : {}),
        })
        .eq("id", id);
    };

    (async () => {
      const { data, error } = await supabase
        .from("user_sessions")
        .insert({ user_id: user.id, user_agent: navigator.userAgent })
        .select("id")
        .single();
      if (cancelled || error || !data) return;
      sessionIdRef.current = data.id;

      let ticks = 0;
      heartbeatRef.current = setInterval(() => {
        const isActive =
          !document.hidden && Date.now() - lastInteractionRef.current < IDLE_TIMEOUT_MS;
        if (isActive) activeSecondsRef.current += TICK_MS / 1000;
        ticks += 1;
        if (ticks % FLUSH_EVERY_TICKS === 0 && isActive) flush(false);
      }, TICK_MS);
    })();

    const endSession = () => flush(true);
    window.addEventListener("beforeunload", endSession);

    return () => {
      cancelled = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      for (const ev of interactionEvents) window.removeEventListener(ev, markInteraction);
      document.removeEventListener("visibilitychange", onVisibility);
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
