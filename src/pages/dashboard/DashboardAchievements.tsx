import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { useAnalytics } from "@/hooks/useAnalytics";
import { computeMilestones, type Milestone } from "@/lib/achievements";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Trophy } from "lucide-react";

const CARD = "rounded-[24px] bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]";

function MilestoneCard({ m }: { m: Milestone }) {
  const percent = Math.round((m.current / m.target) * 100);
  return (
    <li className={CARD}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            m.unlocked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          {m.unlocked ? <Check className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-tight">{m.title}</p>
          <p className="text-[13px] text-muted-foreground">{m.description}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${m.title} progress`}
        />
      </div>
      <p className="mt-1.5 text-[12px] text-muted-foreground">
        {m.unlocked ? "Unlocked" : `${m.current} / ${m.target}`}
      </p>
    </li>
  );
}

export default function DashboardAchievements() {
  const { user, profile } = useAuth();
  const { data, isLoading, isError } = useAnalytics(user?.id);

  const milestones = data
    ? computeMilestones({
        modulesCompleted: data.summary.modulesCompleted,
        passedQuizzes: data.quiz.distinctQuizzesPassed,
        bestQuizPercentage: data.quiz.bestPercentage,
        currentStreak: profile?.current_streak ?? 0,
        points: profile?.points ?? 0,
      })
    : [];
  const unlocked = milestones.filter((m) => m.unlocked).length;

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Achievements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${unlocked} of ${milestones.length} unlocked` : "Milestones from your learning"}
          </p>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-[24px]" />
            ))}
          </div>
        ) : isError ? (
          <div className={`${CARD} text-center text-sm text-muted-foreground`}>
            Your achievements could not be loaded right now. Please try again in a moment.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {milestones.map((m) => (
              <MilestoneCard key={m.id} m={m} />
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
