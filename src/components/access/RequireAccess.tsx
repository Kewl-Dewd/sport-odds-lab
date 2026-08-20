import { Navigate } from "react-router-dom";
import { useAccess } from "@/hooks/useAccess";

/** Routes that need a paid or code-redeemed entitlement. */
export function RequireAccess({ children }: { children: JSX.Element }) {
  const { isPaywalled, loading } = useAccess();
  if (loading) return null;
  if (isPaywalled) return <Navigate to="/access" replace />;
  return children;
}
