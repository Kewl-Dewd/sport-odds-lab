import { Clock } from "lucide-react";
import { useAccess } from "@/hooks/useAccess";

/**
 * Read-only preview banner. PILOT: payment CTAs are hidden while access is free.
 * Signed-in people can browse and trade during the pilot.
 */
export function AccessBanner() {
  const { inTrial, trialDaysLeft, loading } = useAccess();
  if (loading) return null;

  // Trial countdown so students know their free window is active.
  if (inTrial) {
    return (
      <div className="border-b bg-primary/5">
        <div className="container flex flex-wrap items-center gap-3 py-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            Pilot access — {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left in your free trial.
          </span>
        </div>
      </div>
    );
  }

  return null;
}

/** Inline notice used in place of an action button during the pilot. */
export function AccessRequired({ action = "do this" }: { action?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-4 text-center">
      <p className="text-sm text-muted-foreground">
        Full access is included during the pilot to {action}.
      </p>
    </div>
  );
}
