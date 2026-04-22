import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, X, TrendingUp, LayoutDashboard, BarChart3,
  Briefcase, Trophy, BookOpen, GraduationCap, FlaskConical,
  Users, LogOut, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EducationModeToggle } from "@/components/education/EducationToggle";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const baseLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: BarChart3 },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "How It Works", href: "/how-it-works", icon: BookOpen },
  { label: "Glossary", href: "/glossary", icon: BookOpen },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isInstructor, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b glass">
      <div className="container flex h-14 md:h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setMobileOpen(false)}>
          <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <span className="hidden sm:inline">Sports Market Lab</span>
          <span className="sm:hidden">SML</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {baseLinks.map((link) => (
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
                to="/experiments"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname.startsWith("/experiments")
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <FlaskConical className="h-4 w-4" />
                Experiments
              </Link>
              <Link
                to="/instructor"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname === "/instructor" || location.pathname.startsWith("/instructor/")
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <GraduationCap className="h-4 w-4" />
                Instructor
              </Link>
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
                Users
              </Link>
            </>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <EducationModeToggle />
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
        <div className="md:hidden border-t animate-slide-up">
          <nav className="container flex flex-col gap-1 py-3">
            {baseLinks.map((link) => (
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
                <Link to="/experiments" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                  <FlaskConical className="h-4 w-4" /> Experiments
                </Link>
                <Link to="/instructor" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                  <GraduationCap className="h-4 w-4" /> Instructor
                </Link>
                <Link to="/admin/users" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">
                  <Users className="h-4 w-4" /> Users
                </Link>
              </>
            )}
            <div className="px-3 py-2">
              <EducationModeToggle />
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
