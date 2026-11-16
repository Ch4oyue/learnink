import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useModules } from "@/hooks/useModules";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Zap, MessageSquare, Settings, BarChart, FileText, Bot, 
  BookOpen, Sparkles, Brain, Cpu, Code, Lightbulb, Workflow, Cog
} from "lucide-react";
import { displayCategory, displayLevel } from "@/lib/categoryLabels";

// Icon mapping for AI & Automation focused modules
const iconMap: Record<string, React.ElementType> = {
  Zap,
  MessageSquare,
  Settings,
  BarChart,
  FileText,
  Bot,
  BookOpen,
  Sparkles,
  Brain,
  Cpu,
  Code,
  Lightbulb,
  Workflow,
  Cog,
};

const levelColors: Record<string, string> = {
  Pemula: "bg-success/10 text-success",
  Menengah: "bg-warning/10 text-warning",
  Lanjutan: "bg-destructive/10 text-destructive-text",
};

// Categories focused on AI & Automation
const categoryColors: Record<string, string> = {
  "AI Dasar": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Automation": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "AI Tools": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Advanced": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Prompt Engineering": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "No-Code AI": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "Umum": "bg-primary/10 text-primary",
};

export const ModulesSection = () => {
  const [visibleCount, setVisibleCount] = useState(6);
  const { user } = useAuth();
  const { data: modules, isLoading } = useModules(true);
  const { data: userProgress } = useUserProgress(user?.id);

  const visibleModules = modules?.slice(0, visibleCount) || [];
  const hasMore = (modules?.length || 0) > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 6, modules?.length || 0));
  };

  const progressMap = useMemo(() => {
    const map = new Map<string, number>();
    if (userProgress) {
      userProgress.forEach((p) => {
        map.set(p.module_id, p.progress_percent || 0);
      });
    }
    return map;
  }, [userProgress]);

  // Get progress for a module
  const getModuleProgress = (moduleId: string) => {
    return progressMap.get(moduleId) || 0;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section id="modul" className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <Skeleton className="h-8 w-32 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-apple p-8">
                <div className="flex items-start justify-between mb-5">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-6" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (!modules || modules.length === 0) {
    return (
      <section id="modul" className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Module Catalog
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
              Coming Soon
            </h2>
            <p className="text-muted-foreground text-lg">
              Learning modules are being prepared. Send a material request to help us prioritize the topics you need.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="modul" className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Module Catalog
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            Start Your Learning Journey
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose modules that match your level and needs. Learn step by step with structured materials.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {visibleModules.map((module, index) => {
            const IconComponent = iconMap[module.icon_name || "BookOpen"] || BookOpen;
            const progress = getModuleProgress(module.id);
            const level = module.level || "Pemula";
            const category = module.category || "Umum";

            return (
              <Link
                to={`/module/${module.id}`}
                key={module.id}
                className="group card-apple p-8 hover-lift cursor-pointer animate-fade-in block"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header with Icon and Level */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${levelColors[level] || levelColors.Pemula}`}
                    >
                      {displayLevel(level)}
                    </span>
                    {category && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[13px] font-medium ${categoryColors[category] || categoryColors["Umum"]}`}
                      >
                        {displayCategory(category)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                  {module.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-2">
                  {module.summary || "Structured, easy-to-understand AI & Automation learning material."}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground transition-all duration-300 press-effect"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
