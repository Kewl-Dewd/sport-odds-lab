import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children, requireInstructor = false }: { children: JSX.Element; requireInstructor?: boolean }) {
  const { user, isInstructor, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireInstructor && !isInstructor) return <Navigate to="/dashboard" replace />;
  return children;
}
