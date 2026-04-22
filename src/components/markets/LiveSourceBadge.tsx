import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketDataSource } from "@/lib/tradingEngine";

interface Props {
  source?: MarketDataSource;
  className?: string;
}

/**
 * Small badge that signals when a market was imported from odds-api.io
 * vs. created manually by the instructor.
 */
export function LiveSourceBadge({ source, className }: Props) {
  if (source !== "odds-api") return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-info/40 bg-info/10 text-info text-[10px] font-medium uppercase tracking-wide",
            className,
          )}
        >
          <Radio className="h-3 w-3" />
          Live data
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top">
        Imported from odds-api.io. Real fixture and reference odds available.
      </TooltipContent>
    </Tooltip>
  );
}
