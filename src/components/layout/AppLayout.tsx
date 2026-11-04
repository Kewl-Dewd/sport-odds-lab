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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AccessBanner />
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-xs sm:text-sm text-muted-foreground space-y-2">
          <p className="max-w-3xl mx-auto">
            Educational simulation for post-secondary coursework. Virtual funds only, with no
            cash value. Not affiliated with any sportsbook. If gambling is affecting you or
            someone you know, see{" "}
            <Link to="/support" className="underline text-primary">Support Resources</Link>.
          </p>
          <p className="space-x-3"><Link to="/instructors" className="underline">For instructors</Link><Link to="/for-administrators" className="underline">For administrators</Link></p>
          <p>© 2026 Avason Systems · Sports Market Lab</p>
        </div>
      </footer>

      {/* Room for the mobile tab bar */}
      <div className="h-16 md:hidden" aria-hidden />

      <FeedbackButton />
      <MobileTabBar />
    </div>
  );
}
