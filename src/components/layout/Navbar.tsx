import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, TrendingUp, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "How It Works", href: "/how-it-works" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLoggedIn = true; // demo mode
  const isAdmin = true; // demo mode

  return (
    <header className="sticky top-0 z-50 border-b glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span>Sports Market Lab</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "nav-link",
                location.pathname === link.href && "nav-link-active"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "nav-link",
                location.pathname.startsWith("/admin") && "nav-link-active"
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Button variant="outline" size="sm">Sign Out</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth"><LogIn className="mr-1.5 h-4 w-4" />Sign In</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth?tab=signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t animate-slide-up">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Admin
              </Link>
            )}
            <div className="flex gap-2 mt-3 px-3">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign In</Link>
              </Button>
              <Button variant="hero" size="sm" className="flex-1" asChild>
                <Link to="/auth?tab=signup" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
