import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProgressStats, useUserProgress } from "@/hooks/useUserProgress";
import { useModules } from "@/hooks/useModules";
import { useMyRequests } from "@/hooks/useMaterialRequests";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Target,
  Flame,
  Trophy,
  Clock,
  Plus,
  ArrowRight,
  ChevronRight,
  Play,
  Check,
  MessageSquare,
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
  lessonCount?: number;
  completedLessons?: number;
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
  lessonCount = 0,
  completedLessons = 0,
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
      onClick={() => navigate(`/module/${id}/learn`)}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-soft cursor-pointer"
    >
      {/* Card Header with Gradient */}
      <div className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="absolute bottom-3 left-4 bg-zinc-900/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase tracking-wide">
          {category || "General"}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description || "No description available"}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {level || "Beginner"}
          </span>
          <span>
            {completedLessons}/{lessonCount} Lessons
          </span>
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

function DailyGoalCard({ progress = 60 }: { progress?: number }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h3 className="font-bold text-sm mb-4 text-foreground uppercase tracking-wider flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        Daily Goal
      </h3>
      <div className="flex justify-center mb-4 relative">
        <div className="relative w-32 h-32">
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
              className="text-primary drop-shadow-[0_0_4px_rgba(14,165,233,0.5)]"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${progress}, 100`}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{progress}%</span>
            <span className="text-[10px] text-muted-foreground">COMPLETE</span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        45 mins / 75 mins learned today
      </p>
    </div>
  );
}

function ActivityItem({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  time,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  time: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1">
        <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { totalModules, completedModules, averageProgress } = useProgressStats(user?.id);
  const { data: progress, isLoading: progressLoading } = useUserProgress(user?.id);
  const { data: modules, isLoading: modulesLoading } = useModules(true);
  const { data: requests } = useMyRequests(user?.id);

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

  return (
    <DashboardLayout>
      {/* Header Section */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{formattedDate}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {greeting}, {displayName}
          </h1>
        </div>
        <div className="flex gap-3">
          <Badge
            variant="outline"
            className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50"
          >
            <Flame className="h-4 w-4 mr-1" />
            12 Day Streak
          </Badge>
          <Badge
            variant="outline"
            className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Level 4
          </Badge>
        </div>
      </header>

      {/* Current Module Hero Card */}
      {currentModule && (
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-soft group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-50" />
            <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    Current Module
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {currentModule.category || "General"}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{currentModule.title}</h2>
                <p className="text-muted-foreground mb-6 max-w-xl">
                  {currentModule.description ||
                    `You're ${currentProgress?.progress_percent || 0}% through this section.`}
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-primary rounded-full shadow-glow"
                      style={{ width: `${currentProgress?.progress_percent || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {currentProgress?.progress_percent || 0}%
                  </span>
                </div>
                <Button
                  onClick={() => navigate(`/module/${currentModule.id}/learn`)}
                  className="shadow-lg hover:shadow-primary/25"
                >
                  Continue Learning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Code Preview (Desktop Only) */}
              <div className="hidden md:block w-96">
                <div className="bg-zinc-900 rounded-xl p-4 shadow-2xl border border-zinc-800 font-mono text-xs text-zinc-300 transform rotate-1 group-hover:rotate-0 transition-transform duration-500">
                  <div className="flex gap-1.5 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="space-y-1 opacity-90">
                    <p>
                      <span className="text-purple-400">const</span>{" "}
                      <span className="text-blue-400">LearnInkProvider</span> = ({"{"}{" "}
                      <span className="text-orange-300">children</span> {"}"}) =&gt; {"{"}
                    </p>
                    <p className="pl-4">
                      <span className="text-purple-400">const</span> [state, dispatch] ={" "}
                      <span className="text-yellow-300">useReducer</span>(reducer, initialState);
                    </p>
                    <p className="pl-4 text-zinc-500">// Providing global context...</p>
                    <p className="pl-4">
                      <span className="text-purple-400">return</span> (
                    </p>
                    <p className="pl-8">
                      &lt;<span className="text-blue-400">Context.Provider</span> value={"{{}"} state,
                      dispatch {"}}"}
                      &gt;
                    </p>
                    <p className="pl-12">{"{children}"}</p>
                    <p className="pl-8">
                      &lt;/<span className="text-blue-400">Context.Provider</span>&gt;
                    </p>
                    <p className="pl-4">);</p>
                    <p>{"}"};</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Courses Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">My Courses</h3>
            <Link
              to="/modules"
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {modulesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modulesWithProgress?.slice(0, 3).map((mod) => (
                <CourseCard
                  key={mod.id}
                  id={mod.id}
                  title={mod.title}
                  description={mod.description || ""}
                  category={mod.category || "General"}
                  level={mod.level || "Beginner"}
                  progress={mod.progress}
                  lessonCount={10}
                  completedLessons={Math.round(mod.progress / 10)}
                />
              ))}

              {/* Browse New Courses Card */}
              <button
                onClick={() => navigate("/modules")}
                className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-muted-foreground hover:border-primary hover:text-primary transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="font-medium">Browse New Courses</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <DailyGoalCard progress={averageProgress || 60} />

          {/* Recent Activity */}
          <div>
            <h3 className="font-bold text-sm mb-4 uppercase tracking-wider">Recent Activity</h3>
            <div className="space-y-4">
              <ActivityItem
                icon={Check}
                iconBg="bg-green-100 dark:bg-green-900/30"
                iconColor="text-green-600 dark:text-green-400"
                title="Completed Quiz: React Basics"
                time="2 hours ago"
              />
              <ActivityItem
                icon={Play}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
                title='Watched "Intro to JSX"'
                time="5 hours ago"
              />
              <ActivityItem
                icon={MessageSquare}
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600 dark:text-purple-400"
                title="Commented in Community"
                time="Yesterday"
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
