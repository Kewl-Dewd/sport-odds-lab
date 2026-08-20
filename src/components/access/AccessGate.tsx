import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";

/**
 * Read-only preview banner. Signed-in people without an entitlement can browse
 * the app but cannot trade or join a class.
 */
export function AccessBanner() {
  const { isPaywalled, loading } = useAccess();
  if (loading || !isPaywalled) return null;

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
