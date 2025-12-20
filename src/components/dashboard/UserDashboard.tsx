import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProgressStats, useUserProgress } from "@/hooks/useUserProgress";
import { useMyRequests } from "@/hooks/useMaterialRequests";
import { BookOpen, Target, TrendingUp, FileQuestion, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const statusLabels = {
  pending: 'Menunggu',
  reviewing: 'Ditinjau',
  completed: 'Selesai',
  rejected: 'Ditolak',
};

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-600',
  reviewing: 'bg-primary/10 text-primary',
  completed: 'bg-green-500/10 text-green-600',
  rejected: 'bg-destructive/10 text-destructive',
};

export function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { totalModules, completedModules, averageProgress } = useProgressStats(user?.id);
  const { data: progress, isLoading: progressLoading } = useUserProgress(user?.id);
  const { data: requests, isLoading: requestsLoading } = useMyRequests(user?.id);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Selamat datang, {displayName}!
        </h1>
        <p className="text-muted-foreground">
          Lanjutkan perjalanan belajar AI automation Anda.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalModules}</p>
              <p className="text-sm text-muted-foreground">Modul Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{averageProgress}%</p>
              <p className="text-sm text-muted-foreground">Progress Total</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{completedModules}</p>
              <p className="text-sm text-muted-foreground">Modul Selesai</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Progress Belajar</h2>
          {progressLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : progress && progress.length > 0 ? (
            <div className="space-y-4">
              {progress.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.modules?.title || 'Modul'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={item.progress_percent || 0} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-10">
                        {item.progress_percent || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Belum ada modul yang diikuti
              </p>
              <Button size="sm" onClick={() => navigate("/#modul")}>
                Jelajahi Modul
              </Button>
            </div>
          )}
        </div>

        {/* Requests Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Request Materi</h2>
            <Button size="sm" variant="outline" onClick={() => navigate("/#request")}>
              + Request Baru
            </Button>
          </div>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FileQuestion className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{request.topic}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {request.created_at ? new Date(request.created_at).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                  </div>
                  <Badge className={statusColors[request.status || 'pending']}>
                    {statusLabels[request.status || 'pending']}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileQuestion className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Belum ada request materi
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
