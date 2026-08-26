import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, Briefcase, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = Search, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && (
        actionHref ? (
          <Button variant="hero" size="sm" asChild>
            <Link to={actionHref}>{actionLabel}</Link>
          </Button>
        ) : onAction ? (
          <Button variant="hero" size="sm" onClick={onAction}>{actionLabel}</Button>
        ) : null
      )}
    </div>
  );
}

// Pre-built empty states
export function NoHoldings() {
  return (
    <EmptyState
      icon={Briefcase}
      title="No open bets yet"
      description="You haven't placed a bet. Check the board and back a side to get started."
      actionLabel="See the Board"
      actionHref="/markets"
    />
  );
}

export function NoTrades() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No bets yet"
      description="Place your first bet to see it here. Every bet is logged with the line, stake and payout."
      actionLabel="Place a Bet"
      actionHref="/markets"
    />
  );
}

export function NoMarkets() {
  return (
    <EmptyState
      icon={BarChart3}
      title="Board is closed"
      description="There are no games on the board right now. Your instructor will post lines for upcoming events."
    />
  );
}
