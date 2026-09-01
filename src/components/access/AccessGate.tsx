import { Link } from "react-router-dom";
import { Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";

/**
 * Read-only preview banner. Signed-in people without an entitlement can browse
 * the app but cannot trade or join a class.
 */
export function AccessBanner() {
  const { isPaywalled, inTrial, trialDaysLeft, loading } = useAccess();
  if (loading) return null;

  // Trial countdown so students know when their free window closes.
  if (inTrial) {
    return (
      <div className="border-b bg-primary/5">
        <div className="container flex flex-wrap items-center gap-3 py-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            Free trial — {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left before you need full access.
          </span>
          <Button asChild size="sm" variant="hero" className="ml-auto">
            <Link to="/access">Get access — $10/year</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isPaywalled) return null;

  return (
    <div className="border-b bg-muted/60">
      <div className="container flex flex-wrap items-center gap-3 py-2 text-sm">
        <Lock className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">
          You're in read-only preview — trading and class enrollment need full access.
        </span>
        <Button asChild size="sm" variant="hero" className="ml-auto">
          <Link to="/access">Get access — $10/year</Link>
        </Button>
      </div>
    </div>
  );
}

/** Inline lock used in place of an action button. */
export function AccessRequired({ action = "do this" }: { action?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-4 text-center space-y-3">
      <p className="text-sm text-muted-foreground">
        You need full access to {action}.
      </p>
      <Button asChild variant="hero" size="sm">
        <Link to="/access">Get access — $10/year or redeem a code</Link>
      </Button>
    </div>
  );
}
