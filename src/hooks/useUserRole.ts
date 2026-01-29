import { logger } from "@/lib/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/contexts/AuthContext";
import { SUPER_ADMIN_USER_ID, SUPER_ADMIN_EMAIL } from "@/hooks/useUsers";

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
      // Protect super admin from ANY role changes (Using ID check)
      if (userId === SUPER_ADMIN_USER_ID) {
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

      // Prevent promoting any user to superadmin
      if (newRole === 'superadmin') {
        throw new Error('Tidak dapat mengubah pengguna menjadi Super Admin');
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
      // Check if user is super admin
      if (userId === SUPER_ADMIN_USER_ID) {
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
