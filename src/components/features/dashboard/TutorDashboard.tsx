import { RequestReviewPanel } from "./RequestReviewPanel";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { useMyModules } from "@/hooks/useModules";
import { useAllRequests, useUpdateRequest, RequestStatus } from "@/hooks/useMaterialRequests";
import { useTotalStudents } from "@/hooks/useUserProgress";
import { useGenerateModule } from "@/hooks/useGenerateModule";
import { BookOpen, FileQuestion, Users, CheckCircle, Clock, Eye, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export function TutorDashboardContent() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const { data: myModules, isLoading: modulesLoading } = useMyModules(user?.id);
  const { data: requests, isLoading: requestsLoading } = useAllRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { data: totalStudents = 0 } = useTotalStudents();
  const updateRequest = useUpdateRequest();
  const generateModule = useGenerateModule();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Tutor";

  const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;


  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Tutor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage modules and review material requests from users.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{myModules?.length || 0}</p>
              <p className="text-sm text-muted-foreground">My Modules</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FileQuestion className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{pendingRequests}</p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {requests?.filter(r => r.status === 'completed').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Completed Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Review Request</TabsTrigger>
          <TabsTrigger value="modules">My Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <RequestReviewPanel
            requests={requests}
            requestsLoading={requestsLoading}
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
            onStatusChange={(id, status) => updateRequest.mutate({ id, status })}
            onGenerate={(id) => generateModule.mutate(id)}
            isGenerating={generateModule.isPending}
          />
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Modules I Created</h2>
            <Button size="sm" asChild>
              <Link to="/dashboard/modules/create">+ Create Module</Link>
            </Button>
          </div>

          {modulesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : myModules && myModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myModules.map((module) => (
                <div key={module.id} className="bg-card border border-border rounded-xl p-5 shadow-soft">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={module.is_published ? 'default' : 'secondary'}>
                      {module.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{module.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{module.summary}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link to={`/module/${module.id}`}>
                        <Eye className="h-4 w-4 mr-1" /> Preview
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link to={`/dashboard/modules/edit/${module.id}`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center shadow-soft">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">You have not created any modules yet</p>
              <Button asChild>
                <Link to="/dashboard/modules/create">Create Your First Module</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate Confirmation Dialog */}

    </>
  );
}

// ============================================
// MAIN COMPONENT (Backward Compatible)
// ============================================

export function TutorDashboard() {
  return (
    <DashboardLayout>
      <TutorDashboardContent />
    </DashboardLayout>
  );
}
