import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { TrackProgress } from "@/lib/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Flame, Target, BookOpen, Award, BarChart3 } from "lucide-react";

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-[24px] bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Icon className="h-4 w-4" />
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[24px] bg-card p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">No learning activity yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your statistics appear here once you start a module or take a quiz.
      </p>
      <Link
        to="/dashboard/courses"
        className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Browse courses
      </Link>
    </div>
  );
}

function ActivityChart({ activity }: { activity: { day: string; completions: number; quizAttempts: number }[] }) {
  const max = Math.max(1, ...activity.map((d) => d.completions + d.quizAttempts));
  return (
    <div className="rounded-[24px] bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
      <h3 className="text-[15px] font-semibold tracking-tight">Last 14 days</h3>
      <p className="mt-0.5 text-[13px] text-muted-foreground">Completions and quiz attempts per day (UTC).</p>
      <div className="mt-5 flex h-28 gap-1.5" role="img"
        aria-label={`Activity over the last 14 days. Most active day has ${max} events.`}>
        {activity.map((d) => {
          const total = d.completions + d.quizAttempts;
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.completions} completions, ${d.quizAttempts} quiz attempts`}>
              <div
                className={`w-2.5 rounded-full transition-all ${total > 0 ? "bg-primary" : "bg-secondary"}`}
                style={{ height: `${Math.max(total > 0 ? 14 : 4, (total / max) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{activity[0]?.day.slice(5)}</span>
        <span>{activity[activity.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

function TrackProgressList({ perTrack }: { perTrack: TrackProgress[] }) {
  if (perTrack.length === 0) return null;
  return (
    <div className="rounded-[24px] bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
      <h3 className="text-[15px] font-semibold tracking-tight">Track progress</h3>
      <p className="mt-0.5 text-[13px] text-muted-foreground">Completed modules against published modules per enrolled track.</p>
      <ul className="mt-5 space-y-4">
        {perTrack.map((t) => (
          <li key={t.trackId}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">{t.name}</span>
              <span className="text-[13px] text-muted-foreground">
                {t.completedModules}/{t.publishedModules} modules
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${t.percent}%` }}
                role="progressbar"
                aria-valuenow={t.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t.name} progress`}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardAnalytics() {
  const { user, profile } = useAuth();
  const { data, isLoading, isError } = useAnalytics(user?.id);

  const hasAnyData =
    !!data &&
    (data.summary.modulesCompleted > 0 ||
      data.summary.modulesInProgress > 0 ||
      data.quiz.attempts > 0 ||
      data.perTrack.some((t) => t.publishedModules > 0) ||
      (profile?.points ?? 0) > 0 ||
      (profile?.current_streak ?? 0) > 0);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your learning, in numbers.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-[24px]" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-[24px] bg-card p-8 text-center text-sm text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
            Your statistics could not be loaded right now. Please try again in a moment.
          </div>
        ) : !hasAnyData ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={Target} value={profile?.points ?? 0} label="Points" />
              <StatCard icon={Flame} value={profile?.current_streak ?? 0} label="Day streak" />
              <StatCard icon={BookOpen} value={data.summary.modulesCompleted} label="Modules done" />
              <StatCard icon={Award} value={`${data.quiz.avgPercentage}%`} label="Avg quiz score" />
            </div>
            <ActivityChart activity={data.activity} />
            <TrackProgressList perTrack={data.perTrack} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
