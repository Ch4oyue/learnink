import { Control, useWatch } from "react-hook-form";
import {
  Bot,
  Cpu,
  Workflow,
  Zap,
  Brain,
  Cog,
  Code,
  BookOpen,
  Lightbulb,
  Sparkles,
} from "lucide-react";

const icons = [
  { name: "Bot", icon: Bot },
  { name: "Cpu", icon: Cpu },
  { name: "Workflow", icon: Workflow },
  { name: "Zap", icon: Zap },
  { name: "Brain", icon: Brain },
  { name: "Cog", icon: Cog },
  { name: "Code", icon: Code },
  { name: "BookOpen", icon: BookOpen },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Sparkles", icon: Sparkles },
] as const;

interface ModulePreviewCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

export function ModulePreviewCard({ control }: ModulePreviewCardProps) {
  const watchedValues = useWatch({
    control,
    name: ["title", "category", "level", "icon_name"],
  });

  const [title, category, level, icon_name] = watchedValues;
  const SelectedIcon = icons.find((i) => i.name === icon_name)?.icon || Bot;

  return (
    <div className="pt-4 border-t">
      <span className="text-muted-foreground text-xs">Preview Card</span>
      <div className="mt-2 p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <SelectedIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {title || "Module Title"}
            </p>
            <p className="text-xs text-muted-foreground">
              {category} • {level}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
