import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUsers, useUserStats } from "@/hooks/useUsers";
import { useModules, usePopularModules } from "@/hooks/useModules";
import { useAllRequests, useUpdateRequest, RequestStatus } from "@/hooks/useMaterialRequests";
import { useUpdateUserRole } from "@/hooks/useUserRole";
import { useGenerateModule } from "@/hooks/useGenerateModule";
import { filterUsers } from "@/lib/userUtils";
import { AppRole } from "@/contexts/AuthContext";
import {
  Users,
  BookOpen,
  FileQuestion,
  Shield,
  GraduationCap,
  UserCircle,
  Search,
  Sparkles,
  Loader2,
  Clock,
  Eye,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const roleLabels: Record<AppRole, string> = {
  user: 'Pelajar',
  tutor: 'Tutor',
  admin: 'Admin',
  superadmin: 'Super Admin',
};

const roleColors: Record<AppRole, string> = {
  user: 'bg-muted text-muted-foreground',
  tutor: 'bg-primary/10 text-primary',
  admin: 'bg-destructive/10 text-destructive',
  superadmin: 'bg-amber-500/10 text-amber-500',
};

const roleIcons: Record<AppRole, typeof UserCircle> = {
  user: UserCircle,
  tutor: GraduationCap,
  admin: Shield,
  superadmin: Crown,
};

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
  rejected: 'bg-destructive/10 text-destructive',
};

export function AdminDashboardContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  // URL-based tab persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    userId: string;
    newRole: AppRole;
    userName: string;
  }>({ open: false, userId: '', newRole: 'user', userName: '' });
  const [generateDialog, setGenerateDialog] = useState<{
    open: boolean;
    requestId: string;
    topic: string;
  }>({ open: false, requestId: '', topic: '' });

  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: modules } = useModules();
  const { data: popularModules } = usePopularModules();
  const { data: requests, isLoading: requestsLoading } = useAllRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { totalUsers, adminCount, tutorCount, userCount } = useUserStats();
  const updateUserRole = useUpdateUserRole();
  const updateRequest = useUpdateRequest();
  const generateModule = useGenerateModule();

  const filteredUsers = useMemo(
    () => filterUsers(users, searchQuery),
    [users, searchQuery]
  );

  const handleRoleChange = (userId: string, newRole: AppRole, userName: string) => {
    if (userId === user?.id) {
      return; // Prevent self-demotion
    }
    setRoleChangeDialog({ open: true, userId, newRole, userName });
  };

  const confirmRoleChange = () => {
    updateUserRole.mutate({
      userId: roleChangeDialog.userId,
      newRole: roleChangeDialog.newRole
    });
    setRoleChangeDialog({ open: false, userId: '', newRole: 'user', userName: '' });
  };

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
          Dashboard Admin
        </h1>
        <p className="text-muted-foreground">
          Kelola pengguna, modul, dan request materi.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalUsers}</p>
              <p className="text-sm text-muted-foreground">Total Pengguna</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{tutorCount}</p>
              <p className="text-sm text-muted-foreground">Tutor</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{modules?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Modul</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FileQuestion className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {requests?.filter(r => r.status === 'pending').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Request Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Users and Requests - URL Persisted */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Manajemen Pengguna</TabsTrigger>
          <TabsTrigger value="requests">Request Materi</TabsTrigger>
          <TabsTrigger value="modules">Modul</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Daftar Pengguna</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari pengguna..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Memuat...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((userItem) => {
                    const RoleIcon = roleIcons[userItem.role];
                    const isSelf = userItem.id === user?.id;

                    return (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {(userItem.display_name || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {userItem.display_name || 'Tanpa nama'}
                                {isSelf && (
                                  <span className="text-xs text-muted-foreground ml-2">(Anda)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{userItem.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[userItem.role]}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleLabels[userItem.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {userItem.created_at
                            ? new Date(userItem.created_at).toLocaleDateString('id-ID')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isSelf && (
                            <Select
                              value={userItem.role}
                              onValueChange={(value) =>
                                handleRoleChange(userItem.id, value as AppRole, userItem.display_name || 'Pengguna')
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Pelajar</SelectItem>
                                <SelectItem value="tutor">Tutor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Tidak ada pengguna ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Request Materi</h2>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="reviewing">Ditinjau</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topik</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
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
                      <TableCell>
                        <Badge variant="outline">{request.category || 'Umum'}</Badge>
                      </TableCell>
                      <TableCell>{request.user_display_name || 'Anonim'}</TableCell>
                      <TableCell>
                        {request.created_at
                          ? new Date(request.created_at).toLocaleDateString('id-ID')
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
                              <SelectItem value="pending">Menunggu</SelectItem>
                              <SelectItem value="reviewing">Ditinjau</SelectItem>
                              <SelectItem value="completed">Selesai</SelectItem>
                              <SelectItem value="rejected">Ditolak</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada request
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Modul Populer</h2>
            <Button size="sm" asChild>
              <Link to="/dashboard/modules">Lihat Semua</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularModules?.map((module) => (
              <div key={module.id} className="bg-card border border-border rounded-xl p-5 shadow-soft">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    <Users className="h-3 w-3" />
                    {module.student_count || 0} Siswa
                  </div>
                </div>
                <h3 className="font-medium text-foreground mb-1">{module.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{module.summary}</p>
                <div className="flex items-center gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link to={`/module/${module.id}`}>
                      <Eye className="h-4 w-4 mr-1" /> Preview
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog
        open={roleChangeDialog.open}
        onOpenChange={(open) => setRoleChangeDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Role</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengubah role <strong>{roleChangeDialog.userName}</strong> menjadi{' '}
              <strong>{roleLabels[roleChangeDialog.newRole]}</strong>.
              {roleChangeDialog.newRole === 'admin' && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Perhatian: User dengan role Admin memiliki akses penuh ke sistem.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Konfirmasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogCancel>Batal</AlertDialogCancel>
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

export function AdminDashboard() {
  return (
    <DashboardLayout>
      <AdminDashboardContent />
    </DashboardLayout>
  );
}
