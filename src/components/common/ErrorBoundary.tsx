import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-xl border border-rose-500/30 bg-card/80 backdrop-blur-md p-6 shadow-2xl text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-rose-500/30 text-rose-500 bg-rose-500/10">
                Application Exception
              </span>
              <h2 className="text-lg font-bold tracking-tight text-foreground mt-2">
                System Interface Fault
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                An unexpected exception interrupted the interface render cycle. The trading engine state has been preserved.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="text-left font-mono text-[11px] p-2.5 rounded bg-muted/40 border border-border/50 text-rose-400 break-words max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-2 justify-center pt-2">
              <Button variant="terminal" size="sm" onClick={this.handleReset} className="h-8 text-xs font-mono">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reload Session
              </Button>
              <Button variant="outline" size="sm" onClick={this.handleGoHome} className="h-8 text-xs font-mono">
                <Home className="h-3.5 w-3.5 mr-1.5" /> Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
