import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px",
  {
    variants: {
      variant: {
        default: "border border-primary bg-primary text-primary-foreground shadow-[2px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 hover:bg-primary/90",
        destructive: "border border-destructive bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline: "border border-foreground/25 bg-card shadow-xs hover:-translate-y-0.5 hover:border-primary hover:bg-muted hover:text-foreground",
        secondary: "border border-foreground/10 bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/75",
        ghost: "hover:bg-muted/80 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "border border-success bg-success text-success-foreground shadow-xs hover:bg-success/90",
        hero: "border border-primary bg-primary text-primary-foreground font-semibold tracking-tight shadow-[3px_4px_0_hsl(var(--accent))] hover:-translate-y-0.5 hover:bg-primary/90",
        terminal: "border border-foreground/20 bg-card font-mono text-foreground shadow-xs hover:border-primary hover:bg-primary hover:text-primary-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-sm font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
