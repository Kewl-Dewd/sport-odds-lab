import logoBeaker from "@/assets/logo-beaker.png";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, X, TrendingUp, LayoutDashboard, BarChart3,
  Briefcase, Trophy, BookOpen, GraduationCap, FlaskConical,
  Users, LogOut, LogIn, Eye, EyeOff, Repeat, Zap,
  NotebookPen, Target, ShieldCheck, School, Building2,
  Calculator,
  FileSpreadsheet,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClassSwitcher } from "@/components/student/ClassSwitcher";
import { ViewSwitcher } from "@/components/layout/ViewSwitcher";

import { useAuth } from "@/context/AuthContext";
import { useMode, MODE_LABELS, SINGLE_MODE } from "@/context/ModeContext";
import { cn } from "@/lib/utils";

const authedLinks = [
  { label: "Responsible Play", href: "/responsible-play", icon: ShieldCheck },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: BarChart3 },
  { label: "Class Board", href: "/class-board", icon: School },
  { label: "My Bets", href: "/portfolio", icon: Briefcase },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Learning", href: "/learn", icon: GraduationCap },
  { label: "Journal", href: "/journal", icon: NotebookPen },
  { label: "Calibration", href: "/calibration", icon: Target },
  { label: "Tools", href: "/tools", icon: Calculator },
  { label: "Glossary", href: "/glossary", icon: BookOpen },
];

const studentOnlyLinks = new Set([
  "/dashboard",
  "/portfolio",
  "/glossary",
  "/journal",
  "/calibration",
  "/responsible-play",
]);

function getAuthedLinks(viewAs?: string) {
  return authedLinks.filter((l) => !studentOnlyLinks.has(l.href) || viewAs === "student");
}

const publicLinks = [
  { label: "How It Works", href: "/how-it-works", icon: BookOpen },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isInstructor, isPlatformAdmin, signOut, viewAs } = useAuth();
  const { mode, clearMode } = useMode();

  const switchMode = () => {
    clearMode();
    setMobileOpen(false);
    navigate("/choose-mode");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };


  return (
    <header className="sticky top-0 z-50 border-b glass">
      <div className="container flex h-16 md:h-20 items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setMobileOpen(false)}>
          <img src={logoBeaker} alt="" className="h-8 w-8 md:h-9 md:w-9 object-contain" />
          <span className="hidden sm:inline">Sports Market Lab</span>
          <span className="sm:hidden">SML</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {(user ? [...getAuthedLinks(viewAs), ...publicLinks] : publicLinks).map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === link.href
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isInstructor && (
            <>
              <Link
                to="/instructor/classes"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname.startsWith("/instructor/classes")
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <School className="h-4 w-4" />
                Classes
              </Link>
              <Link
                to="/instructor/gradebook"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname.startsWith("/instructor/gradebook")
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Gradebook
              </Link>
              <Link
                to="/instructor/quick-setup"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname.startsWith("/instructor/quick-setup")
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Rocket className="h-4 w-4" />
                Quick setup
              </Link>
              {/* Legacy simulation consoles (Experiments / Control Center) retired —
                  Classes is the single instructor console. */}

              <Link
                to="/admin/users"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname.startsWith("/admin")
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Users className="h-4 w-4" />
                My Students
              </Link>
            </>
          )}
          {isPlatformAdmin && (
            <Link
              to="/admin/platform"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                location.pathname === "/admin/platform"
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Building2 className="h-4 w-4" />
              Platform
            </Link>
          )}
          {isPlatformAdmin && (
            <Link
              to="/admin/users"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                location.pathname === "/admin/users"
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user && mode && !SINGLE_MODE && (
            <button
              onClick={switchMode}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/20 transition-colors"
              title="Switch market mode"
            >
              <Zap className="h-3 w-3 text-primary" />
              {MODE_LABELS[mode]}
              <Repeat className="h-3 w-3 opacity-60" />
            </button>
          )}
          {user && viewAs === "student" && <ClassSwitcher />}
          <ViewSwitcher />

          {user ? (
            <>
              <span className="text-xs text-muted-foreground max-w-[140px] truncate">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1.5" /> Sign out
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth"><LogIn className="h-4 w-4 mr-1.5" /> Sign in</Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t animate-slide-up max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
          <nav className="container flex flex-col gap-1 py-3 pb-6">
            {(user ? [...getAuthedLinks(viewAs), ...publicLinks] : publicLinks).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {isInstructor && (
              <>
                <Link to="/instructor/classes" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                  <School className="h-4 w-4" /> Classes
                </Link>
                <Link to="/instructor/gradebook" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                  <FileSpreadsheet className="h-4 w-4" /> Gradebook
                </Link>
                <Link to="/instructor/quick-setup" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                  <Rocket className="h-4 w-4" /> Quick class setup
                </Link>
                <Link to="/admin/users" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                  <Users className="h-4 w-4" /> My Students
                </Link>
              </>
            )}
            {isPlatformAdmin && (
              <Link to="/admin/platform" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                <Building2 className="h-4 w-4" /> Platform
              </Link>
            )}
            {isPlatformAdmin && (
              <Link to="/admin/users" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                <Users className="h-4 w-4" /> Users
              </Link>
            )}
            {user && mode && !SINGLE_MODE && (
              <div className="px-3 py-2">
                <Button variant="outline" size="sm" onClick={switchMode} className="w-full justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-primary" /> Mode: {MODE_LABELS[mode]}
                  </span>
                  <Repeat className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </div>
            )}
            {user && viewAs === "student" && <ClassSwitcher />}
            <div className="px-3 py-2">
              <ViewSwitcher onNavigate={() => setMobileOpen(false)} />
            </div>

            <div className="px-3 py-2">
              {user ? (
                <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                  <LogOut className="h-4 w-4 mr-1.5" /> Sign out ({user.email})
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/auth"><LogIn className="h-4 w-4 mr-1.5" /> Sign in</Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
