import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BarChart3, Briefcase, Trophy, GraduationCap,
  School, Users, Building2,
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
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85"
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
                  "relative flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[11px] font-medium transition-all duration-150",
                  active ? "text-emerald-500 font-semibold dark:text-emerald-400" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute top-0 w-8 h-0.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                )}
                <t.icon className={cn("h-4 w-4", active && "text-emerald-500 dark:text-emerald-400")} />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
