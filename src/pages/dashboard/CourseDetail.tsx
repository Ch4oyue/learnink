import { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTrack } from "@/hooks/useTracks";
import { useModules } from "@/hooks/useModules";
import { useUserProgress } from "@/hooks/useUserProgress";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  Lightbulb
} from "lucide-react";

export default function CourseDetail() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { user, enrolledTrackIds, isAdmin, isTutor } = useAuth();

  const { data: track, isLoading: trackLoading } = useTrack(trackId);
  const { data: modules, isLoading: modulesLoading } = useModules({ trackId, publishedOnly: true });
  const { data: userProgress } = useUserProgress(user?.id);

  // Optimization: Create a Map for O(1) lookup
  const userProgressMap = useMemo(() => {
    if (!userProgress) return new Map();
    return new Map(userProgress.map(p => [p.module_id, p]));
  }, [userProgress]);

  const isEnrolled = trackId && enrolledTrackIds.includes(trackId);
  const canAccess = isEnrolled || isAdmin || isTutor;

  // Calculate course progress
  const totalModules = modules?.length || 0;
  const completedModules = modules?.filter(m => {
    const p = userProgressMap.get(m.id);
    return p?.is_completed;
  }).length || 0;

  const courseProgress = totalModules > 0
    ? Math.round((completedModules / totalModules) * 100)
    : 0;

  if (trackLoading || modulesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
           <div className="h-8 w-64 bg-muted rounded" />
           <div className="h-4 w-96 bg-muted rounded" />
           <div className="h-32 w-full bg-muted rounded-xl" />
           <div className="space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-24 w-full bg-muted rounded-xl" />)}
           </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!track) {
    return (
      <DashboardLayout>
         <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
            <Button onClick={() => navigate('/dashboard/courses')}>Back to Catalog</Button>
         </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Navigation & Header */}
        <div>
           <Button
             variant="ghost"
             className="mb-4 pl-0 gap-2 hover:bg-transparent hover:text-primary"
             onClick={() => navigate('/dashboard')}
           >
             <ArrowLeft className="h-4 w-4" />
             Back to Dashboard
           </Button>

           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
             <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{track.name}</h1>
                <p className="text-lg text-muted-foreground">{track.description}</p>
             </div>
             {canAccess ? (
                <div className="min-w-[200px] bg-card border border-border p-4 rounded-xl shadow-sm">
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-muted-foreground">Course Progress</span>
                     <span className="font-bold">{courseProgress}%</span>
                   </div>
                   <Progress value={courseProgress} className="h-2" />
                </div>
             ) : (
                <Button
                   size="lg"
                   onClick={() => navigate('/dashboard/courses')}
                   className="shadow-soft"
                >
                   Enroll Now
                </Button>
             )}
           </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Module List</h2>
              <Badge variant="secondary" className="ml-2">{totalModules} Modules</Badge>
           </div>

           {!canAccess && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                 <Lock className="h-5 w-5" />
                 <p>You are not enrolled in this course. Please take the course to access the material.</p>
              </div>
           )}

           <div className="grid gap-4">
              {modules?.map((module, index) => {
                 const progress = userProgressMap.get(module.id);
                 const isCompleted = progress?.is_completed;
                 const isLocked = !canAccess;

                 return (
                   <div
                     key={module.id}
                     className={`
                       group relative bg-card border border-border rounded-xl p-6 shadow-sm transition-all
                       ${isLocked ? 'opacity-70 grayscale-[0.5]' : 'hover:shadow-md hover:border-primary/30'}
                     `}
                   >
                     <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Module Info */}
                        <div className="flex gap-4 flex-1">
                           <div className={`
                             h-12 w-12 shrink-0 rounded-xl flex items-center justify-center
                             ${isCompleted ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}
                           `}>
                              {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Lightbulb className="h-6 w-6" />}
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-muted-foreground">MODULE {index + 1}</span>
                                <Badge variant="outline" className="text-[13px] h-5">{module.level || 'Umum'}</Badge>
                              </div>
                              <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                                {module.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">{module.summary}</p>
                           </div>
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                           {isLocked ? (
                              <Button variant="ghost" disabled className="gap-2 w-full md:w-auto">
                                <Lock className="h-4 w-4" />
                                Locked
                              </Button>
                           ) : (
                              <Button
                                asChild
                                className="gap-2 w-full md:w-auto"
                                variant={isCompleted ? "outline" : "default"}
                              >
                                <Link to={`/learn/${module.id}`}>
                                  {isCompleted ? 'Retry' : 'Start'}
                                  <Play className="h-4 w-4 ml-1" />
                                </Link>
                              </Button>
                           )}
                        </div>
                     </div>
                   </div>
                 );
              })}

              {modules?.length === 0 && (
                 <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">No modules in this course yet.</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
