import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";

// Super admin identification
export const SUPER_ADMIN_EMAIL = 'agen.salva@gmail.com';
export const SUPER_ADMIN_USER_ID: string | null = '676c1aca-b52c-4825-8f7c-1dfef33b107c';

export interface UserWithRole {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: AppRole;
}

export function useUsers() {
  const queryClient = useQueryClient();

  // Set up realtime subscription for profiles and user_roles
  useEffect(() => {
    const profilesChannel = supabase
      .channel('users-profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('users-roles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Direct query from profiles + user_roles
      // Simple and works without custom RPC functions
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        logger.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Get roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        logger.error('Error fetching roles:', rolesError);
      }

      // Create a map of user_id -> role
      const roleMap = new Map<string, AppRole>();
      if (roles) {
        for (const r of roles) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      }

      // Combine profiles with roles
      return (profiles || []).map(profile => ({
        id: profile.id,
        email: null, // Email not exposed from public profiles
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        role: roleMap.get(profile.id) || 'user',
      }));
    },
    retry: 1,
  });
}

export function isSuperAdmin(user: { id: string; email?: string | null }): boolean {
  const emailMatch = !!user.email && user.email === SUPER_ADMIN_EMAIL;
  const idMatch = SUPER_ADMIN_USER_ID !== null && user.id === SUPER_ADMIN_USER_ID;
  return emailMatch || idMatch;
}

export function useUserStats() {
  const { data: users } = useUsers();

  const totalUsers = users?.length || 0;
  // Include superadmin in admin count
  const adminCount = users?.filter(u => u.role === 'admin' || u.role === 'superadmin').length || 0;
  const tutorCount = users?.filter(u => u.role === 'tutor').length || 0;
  const userCount = users?.filter(u => u.role === 'user').length || 0;

  return {
    totalUsers,
    adminCount,
    tutorCount,
    userCount,
  };
}
