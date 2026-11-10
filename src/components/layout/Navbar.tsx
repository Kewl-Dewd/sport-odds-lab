import logoBeaker from "@/assets/logo-beaker.png";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpenCheck } from "lucide-react";
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
import { ThemeToggle } from "@/components/layout/ThemeToggle";

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
    <header className="glass sticky top-0 z-50 border-b border-foreground/15">
      <div className="container flex h-[4.5rem] items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2.5 text-base font-bold tracking-tight" onClick={() => setMobileOpen(false)}>
          <div className="relative flex h-10 w-10 -rotate-3 items-center justify-center border border-primary/20 bg-card shadow-[2px_2px_0_hsl(var(--accent))]">
            <img src={logoBeaker} alt="" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-display text-lg font-semibold tracking-[-0.035em] text-foreground">Sports Market Lab</span>
            <span className="hidden items-center rounded-sm border border-foreground/15 bg-card px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline-flex">
              Field Lab
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {(user ? [...getAuthedLinks(viewAs), ...publicLinks] : publicLinks).map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-150",
                  isActive
                    ? "border border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {isInstructor && (
            <>
              <Link
                to="/instructor/classes"
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
                  location.pathname.startsWith("/instructor/classes")
                    ? "border border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <School className="h-3.5 w-3.5" />
                Classes
              </Link>
              <Link
                to="/instructor/gradebook"
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
                  location.pathname.startsWith("/instructor/gradebook")
                    ? "border border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Gradebook
              </Link>
              <Link
                to="/instructor/kit"
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
                  location.pathname.startsWith("/instructor/kit")
                    ? "border border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <BookOpenCheck className="h-3.5 w-3.5" />
                Course kit
              </Link>
              <Link
                to="/instructor/quick-setup"
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
                  location.pathname.startsWith("/instructor/quick-setup")
                    ? "border border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Rocket className="h-3.5 w-3.5" />
                Quick setup
              </Link>

              <Link
                to="/admin/users"
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
                  location.pathname.startsWith("/admin")
                    ? "border border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Users className="h-3.5 w-3.5" />
                My Students
              </Link>
            </>
          )}
          {isPlatformAdmin && (
            <Link
              to="/admin/platform"
              className={cn(
                "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
                location.pathname === "/admin/platform"
                  ? "border border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              Platform
            </Link>
          )}
          {isPlatformAdmin && (
            <Link
              to="/admin/users"
              className={cn(
                "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
                location.pathname === "/admin/users"
                  ? "border border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Users
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user && mode && !SINGLE_MODE && (
            <button
              onClick={switchMode}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-mono font-medium text-foreground hover:bg-muted transition-colors"
              title="Switch market mode"
            >
              <Zap className="h-3 w-3 text-accent" />
              {MODE_LABELS[mode]}
              <Repeat className="h-3 w-3 opacity-60 ml-0.5" />
            </button>
          )}
          {user && viewAs === "student" && <ClassSwitcher />}
          <ViewSwitcher />

          <ThemeToggle />

          {user ? (
            <>
              <span className="text-xs font-mono text-muted-foreground max-w-[130px] truncate">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="h-9 text-xs">
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign out
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild className="h-9 text-xs font-medium">
              <Link to="/auth"><LogIn className="h-3.5 w-3.5 mr-1.5" /> Sign in</Link>
            </Button>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="p-2 rounded-sm border border-border/60 hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="max-h-[calc(100dvh-4.5rem)] animate-slide-up overflow-y-auto overscroll-contain border-t border-foreground/15 bg-background md:hidden">
          <nav className="container flex flex-col gap-1 py-3 pb-6">
            {(user ? [...getAuthedLinks(viewAs), ...publicLinks] : publicLinks).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "border border-primary bg-primary font-semibold text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {isInstructor && (
              <>
                <Link to="/instructor/classes" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-muted-foreground hover:bg-muted/50">
                  <School className="h-4 w-4" /> Classes
                </Link>
                <Link to="/instructor/gradebook" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-muted-foreground hover:bg-muted/50">
                  <FileSpreadsheet className="h-4 w-4" /> Gradebook
                </Link>
                <Link to="/instructor/kit" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-muted-foreground hover:bg-muted/50">
                  <BookOpenCheck className="h-4 w-4" /> Course kit
                </Link>
                <Link to="/instructor/quick-setup" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-muted-foreground hover:bg-muted/50">
                  <Rocket className="h-4 w-4" /> Quick class setup
                </Link>
                <Link to="/admin/users" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-muted-foreground hover:bg-muted/50">
                  <Users className="h-4 w-4" /> My Students
                </Link>
              </>
            )}
            {isPlatformAdmin && (
              <Link to="/admin/platform" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-muted-foreground hover:bg-muted/50">
                <Building2 className="h-4 w-4" /> Platform
              </Link>
            )}
            {isPlatformAdmin && (
              <Link to="/admin/users" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-muted-foreground hover:bg-muted/50">
                <Users className="h-4 w-4" /> Users
              </Link>
            )}
            {user && mode && !SINGLE_MODE && (
              <div className="px-3 py-2">
                <Button variant="outline" size="sm" onClick={switchMode} className="w-full justify-between font-mono text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-accent" /> Mode: {MODE_LABELS[mode]}
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
                <Button variant="default" size="sm" asChild className="w-full">
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
