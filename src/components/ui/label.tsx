import * as React from "react";
import { Label as HeroLabel } from "@heroui/react";
import { cn } from "@/lib/utils";
const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<typeof HeroLabel>
>(({ className, ...props }, ref) => (
  <HeroLabel
    {...props}
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
  />
));
Label.displayName = "Label";
export { Label };
