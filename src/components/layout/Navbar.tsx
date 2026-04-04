import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, TrendingUp, LayoutDashboard, BarChart3,
  Briefcase, Trophy, BookOpen, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: BarChart3 },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "How It Works", href: "/how-it-works", icon: BookOpen },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isAdmin = true; // demo mode

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
          {navLinks.map((link) => (
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
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname.startsWith("/admin")
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">Demo Mode</Link>
          </Button>
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
            {navLinks.map((link) => (
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
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.startsWith("/admin")
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
