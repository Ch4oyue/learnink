import { logger } from "@/lib/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/contexts/AuthContext";

// Super admin email that cannot be modified
const SUPER_ADMIN_EMAIL = 'agen.salva@gmail.com';

export function useUserRole(userId?: string) {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.role as AppRole;
    },
    enabled: !!userId,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // First, get the user's email from auth to check super admin protection
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

      // If admin API fails, try to get from rpc or just proceed (backwards compatibility)
      let userEmail: string | null = null;
      if (!userError && userData?.user?.email) {
        userEmail = userData.user.email;
      }

      // Protect super admin from ANY role changes
      if (userEmail === SUPER_ADMIN_EMAIL) {
        throw new Error('Super Admin tidak dapat diubah role-nya');
      }

      // Also check if current role is superadmin (double check against DB)
      const { data: currentRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (currentRoleData?.role === 'superadmin') {
        throw new Error('Super Admin role bersifat permanen dan tidak dapat diubah');
      }

      const { data, error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-role', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Berhasil",
        description: "Role pengguna berhasil diubah",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah role pengguna",
        variant: "destructive",
      });
      logger.error('Error updating role:', error);
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, banDuration }: { userId: string; banDuration: 'unban' | '1h' | '24h' | '7d' | '30d' | 'permanent' }) => {
      // First, check if user is super admin
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (userData?.user?.email === SUPER_ADMIN_EMAIL) {
        throw new Error('Super Admin tidak dapat di-ban');
      }

      // Calculate ban end time
      let bannedUntil: string | null = null;
      const now = new Date();

      switch (banDuration) {
        case '1h':
          bannedUntil = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
          break;
        case '24h':
          bannedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          bannedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'permanent':
          bannedUntil = new Date('2099-12-31').toISOString();
          break;
        case 'unban':
        default:
          bannedUntil = null;
      }

      // Update the profiles table with ban info
      const { error } = await supabase
        .from('profiles')
        .update({ banned_until: bannedUntil })
        .eq('id', userId);

      if (error) throw error;
      return { userId, bannedUntil };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: data.bannedUntil ? "Pengguna di-ban" : "Ban dicabut",
        description: data.bannedUntil
          ? "Pengguna tidak dapat mengakses platform"
          : "Pengguna dapat mengakses platform kembali",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah status ban pengguna",
        variant: "destructive",
      });
      logger.error('Error banning user:', error);
    },
  });
}

// Helper to check if user is super admin (for UI disabling)
export function isSuperAdmin(email?: string | null, role?: AppRole | null): boolean {
  return email === SUPER_ADMIN_EMAIL || role === 'superadmin';
}
