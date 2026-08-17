import { ShieldCheck } from "lucide-react";

/** Persistent house-money framing: fake money, educational only. */
export function HouseMoneyBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
      <span>
        All balances are simulated house money for coursework — nothing here is
        real-money gambling, and nothing can be deposited or withdrawn.
      </span>
    </div>
  );
}
