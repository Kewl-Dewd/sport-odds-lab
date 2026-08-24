import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { AccessBanner } from "@/components/access/AccessGate";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { useActivityTracker } from "@/hooks/useActivityTracker";

export function AppLayout() {
  useActivityTracker();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AccessBanner />
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 Avason Systems · Classroom Sportsbook Simulator
        </div>
      </footer>

      <FeedbackButton />
    </div>
  );
}
