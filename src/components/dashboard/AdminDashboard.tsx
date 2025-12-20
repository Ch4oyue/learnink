import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUsers, useUserStats } from "@/hooks/useUsers";
import { useModules } from "@/hooks/useModules";
import { useAllRequests, RequestStatus } from "@/hooks/useMaterialRequests";
import { useUpdateUserRole } from "@/hooks/useUserRole";
import { AppRole } from "@/contexts/AuthContext";
import { 
  Users, 
  BookOpen, 
  FileQuestion, 
  Shield, 
  GraduationCap, 
  UserCircle,
  Search,
  MoreVertical,
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
};

const roleColors: Record<AppRole, string> = {
  user: 'bg-muted text-muted-foreground',
  tutor: 'bg-primary/10 text-primary',
  admin: 'bg-destructive/10 text-destructive',
};

const roleIcons: Record<AppRole, typeof UserCircle> = {
  user: UserCircle,
  tutor: GraduationCap,
  admin: Shield,
};

export function AdminDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    userId: string;
    newRole: AppRole;
    userName: string;
  }>({ open: false, userId: '', newRole: 'user', userName: '' });

  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: modules } = useModules();
  const { data: requests } = useAllRequests();
  const { totalUsers, adminCount, tutorCount, userCount } = useUserStats();
  const updateUserRole = useUpdateUserRole();

  const filteredUsers = users?.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <DashboardLayout>
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

      {/* User Management */}
      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Manajemen Pengguna</h2>
            <div className="flex items-center gap-4">
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
    </DashboardLayout>
  );
}
