import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useMode } from "@/context/ModeContext";

export function ProtectedRoute({
  children,
  requireInstructor = false,
  requireMode = false,
}: {
  children: JSX.Element;
  requireInstructor?: boolean;
  requireMode?: boolean;
}) {
  const { user, isInstructor, isInstructorAccount, isPlatformAdmin, loading } = useAuth();
  const { mode } = useMode();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireInstructor && !isInstructor && !isPlatformAdmin) return <Navigate to="/dashboard" replace />;

  // Instructors aren't forced through the picker; they get a default mode set in the navbar.
  if (requireMode && !mode && !isInstructorAccount) {
    return <Navigate to="/choose-mode" replace />;
  }
  return children;
}
