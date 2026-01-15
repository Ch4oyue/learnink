import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProgressStats, useUserProgress } from "@/hooks/useUserProgress";
import { useModules } from "@/hooks/useModules";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Target,
  Flame,
  Trophy,
  Clock,
  ArrowRight,
  Play,
} from "lucide-react";
import { format } from "date-fns";

// ============================================
// TYPES
// ============================================

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  progress: number;
}

// ============================================
// SUB-COMPONENTS
// ============================================

function CourseCard({
  id,
  title,
  description,
  category,
  level,
  progress,
}: CourseCardProps) {
  const navigate = useNavigate();

  // Generate gradient based on category
  const gradientMap: Record<string, string> = {
    Frontend: "from-indigo-500 to-purple-600",
    Backend: "from-emerald-500 to-teal-600",
    DevOps: "from-slate-600 to-slate-800",
    AI: "from-pink-500 to-rose-600",
    Database: "from-amber-500 to-orange-600",
    default: "from-primary to-blue-600",
  };

  const gradient = gradientMap[category] || gradientMap.default;

  return (
    <div
      onClick={() => navigate(`/learn/${id}`)}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
    >
      {/* Card Header with Gradient */}
      <div className={`h-28 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent)]" />
        <div className="absolute bottom-3 left-4 bg-zinc-900/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase tracking-wide">
          {category || "General"}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h4 className="font-bold text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {title}
        </h4>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description || "No description available"}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {level || "Beginner"}
          </span>
          <span className="font-medium text-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="h-28 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-1.5 w-full" />
      </div>
    </div>
  );
}

function DailyGoalCard({ progress = 0 }: { progress?: number }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h3 className="font-bold text-sm mb-4 text-foreground uppercase tracking-wider flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        Progress Overview
      </h3>
      <div className="flex justify-center mb-4 relative">
        <div className="relative w-28 h-28">
          {/* SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-muted"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-primary"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${progress}, 100`}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(progress)}%</span>
            <span className="text-[10px] text-muted-foreground">AVG PROGRESS</span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Keep learning to increase your progress!
      </p>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { averageProgress } = useProgressStats(user?.id);
  const { data: progress, isLoading: progressLoading } = useUserProgress(user?.id);
  const { data: modules, isLoading: modulesLoading } = useModules(true);

  const displayName =
    profile?.full_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  // Get current date
  const today = new Date();
  const formattedDate = format(today, "EEEE, MMM d");
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  // Find the current/last active module
  const currentModule =
    progress && progress.length > 0
      ? modules?.find((m) => m.id === progress[0]?.module_id)
      : modules?.[0];

  const currentProgress = progress?.find((p) => p.module_id === currentModule?.id);

  // Combine modules with progress data
  const modulesWithProgress = modules?.map((mod) => {
    const moduleProgress = progress?.find((p) => p.module_id === mod.id);
    return {
      ...mod,
      progress: moduleProgress?.progress_percent || 0,
    };
  });

  const isLoading = modulesLoading || progressLoading;

  return (
    <DashboardLayout>
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{formattedDate}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {greeting}, {displayName}
          </h1>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-400 border-green-500/20"
          >
            <Flame className="h-3.5 w-3.5 mr-1" />
            Active Learner
          </Badge>
        </div>
      </header>

      {/* Continue Learning Hero Card */}
      {!isLoading && currentModule && (
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-xl bg-card border border-border">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-50" />
            <div className="relative p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    Continue Learning
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">{currentModule.title}</h2>
                <p className="text-muted-foreground text-sm mb-4 max-w-xl line-clamp-2">
                  {currentModule.summary || currentModule.content?.slice(0, 100) + "..." || "Start your learning journey!"}
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${currentProgress?.progress_percent || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {currentProgress?.progress_percent || 0}%
                  </span>
                </div>
                <Button
                  onClick={() => navigate(`/learn/${currentModule.id}`)}
                  size="sm"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Courses Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Available Modules
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modulesWithProgress?.map((mod) => (
                <CourseCard
                  key={mod.id}
                  id={mod.id}
                  title={mod.title}
                  description={mod.summary || ""}
                  category={mod.category || "General"}
                  level={mod.level || "Beginner"}
                  progress={mod.progress}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-semibold mb-2">No Modules Available</h4>
              <p className="text-sm text-muted-foreground">
                Check back later for new learning modules!
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          <DailyGoalCard progress={averageProgress || 0} />
        </div>
      </div>
    </DashboardLayout>
  );
}
