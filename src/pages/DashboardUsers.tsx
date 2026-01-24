import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUsers, UserWithRole, SUPER_ADMIN_EMAIL, SUPER_ADMIN_USER_ID } from "@/hooks/useUsers";
import { useUpdateUserRole } from "@/hooks/useUserRole";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Users,
  Search,
  Shield,
  GraduationCap,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const roleConfig: Record<AppRole, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" />, variant: "default" },
  tutor: { label: "Tutor", icon: <GraduationCap className="h-3 w-3" />, variant: "secondary" },
  user: { label: "User", icon: <User className="h-3 w-3" />, variant: "outline" },
};

export default function DashboardUsers() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, error } = useUsers();
  const updateRole = useUpdateUserRole();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserWithRole | null;
    newRole: AppRole | null;
  }>({ open: false, user: null, newRole: null });

  const filteredUsers = users?.filter(u => {
    const matchesSearch = !searchQuery ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (user: UserWithRole, newRole: AppRole) => {
    if (user.role === newRole) return;
    if (user.id === currentUser?.id) return; // Prevent self-role change

    setConfirmDialog({ open: true, user, newRole });
  };

  const confirmRoleChange = () => {
    if (confirmDialog.user && confirmDialog.newRole) {
      updateRole.mutate({
        userId: confirmDialog.user.id,
        newRole: confirmDialog.newRole,
      });
    }
    setConfirmDialog({ open: false, user: null, newRole: null });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const stats = {
    total: users?.length || 0,
    admin: users?.filter(u => u.role === "admin").length || 0,
    tutor: users?.filter(u => u.role === "tutor").length || 0,
    user: users?.filter(u => u.role === "user").length || 0,
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Gagal Memuat Data</h2>
          <p className="text-muted-foreground">Terjadi kesalahan saat mengambil data pengguna.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Manajemen Pengguna
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola pengguna dan atur role akses mereka
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Pengguna</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-primary">{stats.admin}</div>
            <div className="text-sm text-muted-foreground">Admin</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-secondary-foreground">{stats.tutor}</div>
            <div className="text-sm text-muted-foreground">Tutor</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats.user}</div>
            <div className="text-sm text-muted-foreground">User</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau ID pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as AppRole | "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="tutor">Tutor</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Bergabung</TableHead>
                  <TableHead>Ubah Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => {
                  const config = roleConfig[user.role];
                  const isSelf = user.id === currentUser?.id;
                  // Check if this user is the super admin (by ID or email)
                  const isThisSuperAdmin =
                    (SUPER_ADMIN_USER_ID && user.id === SUPER_ADMIN_USER_ID) ||
                    (user.email === SUPER_ADMIN_EMAIL);

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(user.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">
                              {user.display_name || "Pengguna"}
                              {isSelf && (
                                <span className="ml-2 text-xs text-muted-foreground">(Anda)</span>
                              )}
                              {isThisSuperAdmin && (
                                <Badge variant="outline" className="ml-2 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                                  👑 Super Admin
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1">
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {user.created_at
                          ? format(new Date(user.created_at), "d MMM yyyy", { locale: id })
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {isThisSuperAdmin ? (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Protected
                          </Badge>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(v) => handleRoleChange(user, v as AppRole)}
                            disabled={isSelf || updateRole.isPending}
                          >
                            <SelectTrigger className="w-[120px]" disabled={isSelf}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="tutor">Tutor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, user: null, newRole: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Role</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengubah role{" "}
              <span className="font-medium text-foreground">
                {confirmDialog.user?.display_name || "pengguna ini"}
              </span>{" "}
              dari{" "}
              <Badge variant={roleConfig[confirmDialog.user?.role || "user"].variant} className="mx-1">
                {roleConfig[confirmDialog.user?.role || "user"].label}
              </Badge>
              menjadi{" "}
              <Badge variant={roleConfig[confirmDialog.newRole || "user"].variant} className="mx-1">
                {roleConfig[confirmDialog.newRole || "user"].label}
              </Badge>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Ya, Ubah Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
