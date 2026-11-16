import React, { useState } from "react";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { useUsers, UserWithRole, SUPER_ADMIN_EMAIL, SUPER_ADMIN_USER_ID, useUserStats } from "@/hooks/useUsers";
import { useUpdateUserRole } from "@/hooks/useUserRole";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  Crown,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

const roleConfig: Record<AppRole, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  superadmin: { label: "Super Admin", icon: <Crown className="h-3 w-3" />, variant: "destructive" },
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" />, variant: "default" },
  tutor: { label: "Tutor", icon: <GraduationCap className="h-3 w-3" />, variant: "secondary" },
  user: { label: "User", icon: <User className="h-3 w-3" />, variant: "outline" },
};

export default function DashboardUsers() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for Pagination & Search
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  // Debounce search should be ideally implemented to avoid too many requests
  // For now we pass searchQuery directly, react-query handles some caching but typing triggers refetch.
  // Let's assume user accepts it or add debounce later. 

  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");

  // Data Hooks
  const { data: usersData, isLoading, error } = useUsers(page, 50, searchQuery);
  const { data: statsData } = useUserStats();
  const updateRole = useUpdateUserRole();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserWithRole | null;
    newRole: AppRole | null;
  }>({ open: false, user: null, newRole: null });

  const users = usersData?.users || [];
  const meta = usersData?.meta;

  // Server-side filtering for role is NOT implemented in get-users yet.
  // We can filter client-side for role on the current page, OR add role filter to API.
  // Given the scope, let's filter client-side on the current page result, 
  // BUT this is imperfect (might result in empty pages).
  // Ideally get-users should support role filter. 
  // For now, let's keep client-side filter but acknowledge it only filters current page.

  const filteredUsers = users.filter(u => {
    return roleFilter === "all" || u.role === roleFilter;
  });

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (meta?.totalPages || 1)) {
      setPage(newPage);
    }
  };

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

  const stats = statsData || {
    totalUsers: 0,
    adminCount: 0,
    tutorCount: 0,
    userCount: 0,
  };

  const { data: labelConfigs } = useQuery({
    queryKey: ["label-configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("label_configs").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser
  });

  const updateLabels = useMutation({
    mutationFn: async ({ userId, labels }: { userId: string; labels: string[] }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ labels })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Label diperbarui" });
    }
  });

  if (error) {
    // Determine the error type for user-friendly messages
    const errorMessage = error.message || '';
    const isAccessDenied = errorMessage.includes('Access denied') || errorMessage.includes('Admin role');
    const isFunctionMissing = errorMessage.includes('function') || errorMessage.includes('does not exist');

    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive-text mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load Data</h2>
          <p className="text-muted-foreground max-w-md">
            {isAccessDenied
              ? 'You do not have admin access. Only admins can see the user list.'
              : isFunctionMissing
                ? 'Database function not available yet. Make sure the migration has been run in Supabase.'
                : `Terjadi kesalahan: ${errorMessage}`
            }
          </p>
          <p className="text-xs text-muted-foreground mt-4 font-mono bg-muted p-2 rounded max-w-lg break-all">
            Debug: {errorMessage}
          </p>
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
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users and set their access roles
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-primary">{stats.adminCount}</div>
            <div className="text-sm text-muted-foreground">Admin</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-secondary-foreground">{stats.tutorCount}</div>
            <div className="text-sm text-muted-foreground">Tutor</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats.userCount}</div>
            <div className="text-sm text-muted-foreground">User</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search names..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to page 1 on search
              }}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as AppRole | "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="superadmin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="tutor">Tutor</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden w-full max-w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => {
                    const config = roleConfig[user.role];
                    const isSelf = user.id === currentUser?.id;
                    // Check if this user is a super admin
                    const isUserSuperAdmin = user.role === 'superadmin';
                    // Legacy check for backward compatibility during migration
                    const isLegacySuperAdmin = (SUPER_ADMIN_USER_ID && user.id === SUPER_ADMIN_USER_ID) ||
                      (user.email === SUPER_ADMIN_EMAIL);

                    const isProtected = isUserSuperAdmin || isLegacySuperAdmin;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar isPremium={user.is_premium} className="h-9 w-9">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {getInitials(user.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">
                                {user.display_name || "User"}
                                {isSelf && (
                                  <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                                )}
                                {(isProtected) && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
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
                            ? format(new Date(user.created_at), "d MMM yyyy", { locale: enUS })
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {user.labels?.map(l => (
                              <Badge key={l} variant="secondary" className="text-[13px] px-1 h-5">
                                {l}
                                {(currentUser?.id === SUPER_ADMIN_USER_ID || currentUser?.email === SUPER_ADMIN_EMAIL) && (
                                  <button
                                    className="ml-1 hover:text-destructive-text"
                                    onClick={() => {
                                      const newLabels = user.labels?.filter(label => label !== l) || [];
                                      updateLabels.mutate({ userId: user.id, labels: newLabels });
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </Badge>
                            ))}
                            {(currentUser?.id === SUPER_ADMIN_USER_ID || currentUser?.email === SUPER_ADMIN_EMAIL) && (
                              <Select onValueChange={(val) => {
                                if (user.labels?.includes(val)) return;
                                const newLabels = [...(user.labels || []), val];
                                updateLabels.mutate({ userId: user.id, labels: newLabels });
                              }}>
                                <SelectTrigger className="h-5 w-8 p-0 border-dashed">
                                  <Plus className="h-3 w-3" />
                                </SelectTrigger>
                                <SelectContent>
                                  {labelConfigs?.map(lc => (
                                    <SelectItem key={lc.id} value={lc.id}>{lc.id}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isProtected ? (
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Immutable
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
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {meta && meta.totalPages > 1 && (
          <Pagination className="justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              <PaginationItem>
                <div className="flex items-center px-4 text-sm font-medium">
                  Halaman {page} dari {meta.totalPages}
                </div>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(page + 1)}
                  className={page === meta.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, user: null, newRole: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the role of{" "}
              <span className="font-medium text-foreground">
                {confirmDialog.user?.display_name || "this user"}
              </span>{" "}
              from{" "}
              <Badge variant={roleConfig[confirmDialog.user?.role || "user"].variant} className="mx-1">
                {roleConfig[confirmDialog.user?.role || "user"].label}
              </Badge>
              to{" "}
              <Badge variant={roleConfig[confirmDialog.newRole || "user"].variant} className="mx-1">
                {roleConfig[confirmDialog.newRole || "user"].label}
              </Badge>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Yes, Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
