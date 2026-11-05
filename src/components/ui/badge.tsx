import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-border/80 bg-muted/60 text-foreground",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "border-border/80 text-foreground bg-background/50",
        emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono",
        amber: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
