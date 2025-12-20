import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StickyProgressBarProps {
  title: string;
  progress: number;
  isVisible: boolean;
}

export function StickyProgressBar({ title, progress, isVisible }: StickyProgressBarProps) {
  return (
    <div
      className={cn(
        "fixed top-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-sm truncate max-w-[200px] md:max-w-md">
            {title}
          </span>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-1.5 w-24 md:w-32" />
            <span className="text-xs text-muted-foreground font-medium min-w-[40px] text-right">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
