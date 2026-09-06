import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
        <div className="container text-center text-xs sm:text-sm text-muted-foreground">
          © 2026 Avason Systems · Classroom Sportsbook Simulator
        </div>
      </footer>

      {/* Room for the mobile tab bar */}
      <div className="h-16 md:hidden" aria-hidden />

      <FeedbackButton />
      <MobileTabBar />
    </div>
  );
}
