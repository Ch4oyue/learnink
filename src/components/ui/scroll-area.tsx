import * as React from "react";
import { ScrollShadow } from "@heroui/react";
import { cn } from "@/lib/utils";
const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ScrollShadow>
>(({ className, children, ...props }, ref) => (
  <ScrollShadow
    {...props}
    ref={ref}
    className={cn(
      "relative min-h-0 overflow-auto rounded-[inherit]",
      className,
    )}
  >
    {children}
  </ScrollShadow>
));
ScrollArea.displayName = "ScrollArea";
export { ScrollArea };
