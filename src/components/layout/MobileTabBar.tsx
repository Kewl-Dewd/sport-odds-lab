import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BarChart3, Briefcase, Trophy, GraduationCap,
  School, Users, Activity, Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type Tab = { label: string; href: string; icon: typeof BarChart3 };

const STUDENT_TABS: Tab[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: BarChart3 },
  { label: "My Bets", href: "/portfolio", icon: Briefcase },
  { label: "Ranks", href: "/leaderboard", icon: Trophy },
  { label: "Learn", href: "/learn", icon: GraduationCap },
];

const INSTRUCTOR_TABS: Tab[] = [
  { label: "Classes", href: "/instructor/classes", icon: School },
  { label: "Markets", href: "/markets", icon: BarChart3 },
  { label: "Board", href: "/class-board", icon: Trophy },
  { label: "Students", href: "/admin/users", icon: Users },
  { label: "Insights", href: "/insights", icon: Activity },
];

const ADMIN_TABS: Tab[] = [
  { label: "Platform", href: "/admin/platform", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Markets", href: "/markets", icon: BarChart3 },
  { label: "Ranks", href: "/leaderboard", icon: Trophy },
];

export function MobileTabBar() {
  const { user, viewAs } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const tabs =
    viewAs === "admin" ? ADMIN_TABS : viewAs === "instructor" ? INSTRUCTOR_TABS : STUDENT_TABS;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t) => {
          const active =
            location.pathname === t.href || location.pathname.startsWith(t.href + "/");
          return (
            <li key={t.href}>
              <Link
                to={t.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <t.icon className={cn("h-5 w-5", active && "text-primary")} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
