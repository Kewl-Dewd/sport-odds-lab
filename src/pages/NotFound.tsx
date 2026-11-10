import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Terminal, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background technical grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />
      <div className="absolute h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-8 text-center shadow-terminal-card space-y-6">
        <div className="h-14 w-14 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-glow-emerald">
          <Terminal className="h-7 w-7" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-border/60 bg-muted/30 font-mono text-xs text-muted-foreground mb-2">
            <span>STATUS: 404_NOT_FOUND</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-mono text-foreground">
            404
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            The requested market route or resource does not exist in the order registry.
          </p>
          <div className="mt-3 p-2 rounded bg-muted/40 border border-border/40 font-mono text-xs text-muted-foreground truncate">
            {location.pathname}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <Link to="/">
            <Button variant="terminal" size="sm" className="w-full sm:w-auto h-9 font-mono text-xs">
              <Home className="h-3.5 w-3.5 mr-1.5" /> Return to Terminal
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto h-9 font-mono text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Previous View
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
