import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { MobileTabBar } from "./MobileTabBar";
import { AccessBanner } from "@/components/access/AccessGate";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { useActivityTracker } from "@/hooks/useActivityTracker";

export function AppLayout() {
  useActivityTracker();
  const location = useLocation();

  // A dropdown that unmounts mid-navigation can leave the page scroll-locked
  // and unresponsive to the mouse wheel. Clear the leftovers on every route
  // change when nothing is actually open.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stillOpen = document.querySelector(
        "[data-radix-popper-content-wrapper],[role='dialog'],[data-state='open'][role='menu']",
      );
      if (stillOpen) return;
      document.body.removeAttribute("data-scroll-locked");
      document.body.style.removeProperty("pointer-events");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("margin-right");
      window.scrollTo({ left: 0 });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const isLanding = location.pathname === "/";

  return (
    <div className={`studio-shell min-h-screen flex flex-col ${isLanding ? "landing-shell" : ""}`}>
      <Navbar />
      <AccessBanner />
      <main className="studio-main flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border/70 py-8 bg-muted/20">
        <div className="container max-w-6xl text-center text-xs text-muted-foreground space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
              Classroom Simulator · Virtual Funds Only · No Real Money Wagered
            </span>
          </div>
          <p className="max-w-2xl mx-auto leading-relaxed text-muted-foreground/90">
            Educational market simulation for economics, finance, and sports analytics coursework.
            If gambling affects you or someone you know, visit{" "}
            <Link to="/support" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Support Resources
            </Link>.
          </p>
          <div className="flex items-center justify-center gap-4 pt-1 font-medium">
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <span className="text-border">·</span>
            <Link to="/instructors" className="hover:text-foreground transition-colors">For Instructors</Link>
            <span className="text-border">·</span>
            <Link to="/for-administrators" className="hover:text-foreground transition-colors">For Administrators</Link>
            <span className="text-border">·</span>
            <Link to="/support" className="hover:text-foreground transition-colors">Support & Ethics</Link>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground/60 pt-2">
            © 2026 Sports Market Lab · {isLanding ? "Read the market. Reward the reasoning." : "High-Performance Analytics Terminal"}
          </p>
        </div>
      </footer>

      {/* Room for the mobile tab bar */}
      <div className="h-16 md:hidden" aria-hidden />

      <FeedbackButton />
      <MobileTabBar />
    </div>
  );
}
