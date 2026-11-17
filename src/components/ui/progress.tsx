import * as React from "react";
import { ProgressBar } from "@heroui/react";

import { cn } from "@/lib/utils";

type ProgressProps = Omit<React.ComponentPropsWithoutRef<typeof ProgressBar>, "maxValue"> & { max?: number };
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, ...props }, ref) => (
    <ProgressBar ref={ref} aria-label="Progress" {...props} value={value ?? 0} maxValue={max}
      className={cn("h-4 w-full", className)}>
      <ProgressBar.Track className="h-full bg-secondary">
        <ProgressBar.Fill className="bg-primary motion-reduce:transition-none" />
      </ProgressBar.Track>
    </ProgressBar>
  ),
);
Progress.displayName = "Progress";

export { Progress };
