import { useAccess } from "@/hooks/useAccess";

/** Routes that need a paid or code-redeemed entitlement.
 *  PILOT: access is free for now, so the paywall redirect is disabled.
 */
export function RequireAccess({ children }: { children: JSX.Element }) {
  const { loading } = useAccess();
  if (loading) return null;
  // During the pilot everyone gets full access; restore the redirect when payments return.
  return children;
}
