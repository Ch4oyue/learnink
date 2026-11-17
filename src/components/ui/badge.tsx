import * as React from "react";
import { Chip } from "@heroui/react";

import { cn } from "@/lib/utils";

// Real HeroUI v3 Chip. The old variant names map to Chip color + variant.
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const CHIP: Record<BadgeVariant, { color: "accent" | "default" | "danger"; variant: "primary" | "soft" | "tertiary" }> = {
  default: { color: "accent", variant: "primary" },
  secondary: { color: "default", variant: "soft" },
  destructive: { color: "danger", variant: "primary" },
  outline: { color: "default", variant: "tertiary" },
};

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  variant?: BadgeVariant | null;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, children, ...props }, ref) => {
  const { color, variant: chipVariant } = CHIP[variant ?? "default"];
  return <Chip ref={ref} color={color} variant={chipVariant} size="sm" className={cn("w-fit", className)} {...props}>{children}</Chip>;
});
Badge.displayName = "Badge";

export { Badge };
