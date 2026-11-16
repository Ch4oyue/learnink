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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusLabels: Record<RequestStatus, string> = {
  pending: 'Menunggu',
  reviewing: 'Ditinjau',
  completed: 'Selesai',
  rejected: 'Ditolak',
};

const statusColors: Record<RequestStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  reviewing: 'bg-primary/10 text-primary',
  completed: 'bg-green-500/10 text-green-600',
  rejected: 'bg-destructive/10 text-destructive-text',
};

export function TutorDashboardContent() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [generateDialog, setGenerateDialog] = useState<{
    open: boolean;
    requestId: string;
    topic: string;
  }>({ open: false, requestId: '', topic: '' });

  const { data: myModules, isLoading: modulesLoading } = useMyModules(user?.id);
  const { data: requests, isLoading: requestsLoading } = useAllRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { data: totalStudents = 0 } = useTotalStudents();
  const updateRequest = useUpdateRequest();
  const generateModule = useGenerateModule();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Tutor";

  const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;

  const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
    updateRequest.mutate({ id: requestId, status: newStatus });
  };

  const handleGenerateClick = (requestId: string, topic: string) => {
    setGenerateDialog({ open: true, requestId, topic });
  };

  const confirmGenerate = () => {
    generateModule.mutate(generateDialog.requestId);
    setGenerateDialog({ open: false, requestId: '', topic: '' });
  };

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Dashboard Tutor
        </h1>
        <p className="text-muted-foreground">
          Kelola modul dan review request materi dari pengguna.
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Material Requests</h2>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Under Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 animate-spin" />
                        Memuat...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : requests && requests.length > 0 ? (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {request.topic}
                      </TableCell>
                      <TableCell>{request.user_display_name || 'Anonim'}</TableCell>
                      <TableCell>
                        {request.created_at
                          ? new Date(request.created_at).toLocaleDateString('en-US')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status || 'pending']}>
                          {statusLabels[request.status || 'pending']}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(request.status === 'pending' || request.status === 'reviewing') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateClick(request.id, request.topic)}
                              disabled={generateModule.isPending}
                              className="gap-1"
                            >
                              {generateModule.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )}
                              Generate AI
                            </Button>
                          )}
                          <Select
                            value={request.status || 'pending'}
                            onValueChange={(value) => handleStatusChange(request.id, value as RequestStatus)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewing">Under Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Tidak ada request
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
      <AlertDialog
        open={generateDialog.open}
        onOpenChange={(open) => setGenerateDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Modul dengan AI
            </AlertDialogTitle>
            <AlertDialogDescription>
              AI akan membuat modul pembelajaran berdasarkan request "{generateDialog.topic}".
              Proses ini mungkin membutuhkan waktu beberapa detik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Modul
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
