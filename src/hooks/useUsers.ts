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

export interface UsersResponse {
  users: UserWithRole[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useUsers(page = 1, limit = 50, search = "") {
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
    queryKey: ['users', page, limit],
    queryFn: async (): Promise<UsersResponse> => {
      // Try to fetch via Edge Function first (bypasses RLS & Handles Pagination)
      try {
        // Try to fetch via Edge Function first (bypasses RLS & Handles Pagination)
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
          `get-users?page=${page}&limit=${limit}${searchParam}`,
          { method: 'GET' }
        );

        if (edgeError) throw edgeError;
        if (edgeData && edgeData.users) {
          return edgeData as UsersResponse;
        }
      } catch (edgeError) {
        logger.warn('Edge function fetch failed, falling back to client query', edgeError);
      }

      // Fallback: Direct query with range
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('profiles')
        .select('id, display_name, avatar_url, created_at', { count: 'exact' });

      if (search) {
        query = query.ilike('display_name', `%${search}%`);
      }

      const { data: profiles, error: profilesError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (profilesError) throw profilesError;

      // Get roles
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const roleMap = new Map<string, AppRole>();
      roles?.forEach(r => roleMap.set(r.user_id, r.role as AppRole));

      const users = (profiles || []).map(profile => ({
        id: profile.id,
        email: null,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        role: roleMap.get(profile.id) || 'user',
      }));

      return {
        users,
        meta: {
          page,
          limit,
          total: count || 0,
          totalPages: count ? Math.ceil(count / limit) : 0
        }
      };
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
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      // 1. Total Users
      const { count: total, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // 2. Role Counts (Requires fetching user_roles since we can't perform complex group-by count easily via loose valid client)
      // Actually we can count by filtering
      // But multiple queries is fine.

      const { count: superadminCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'superadmin');

      const { count: adminCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      const { count: tutorCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'tutor');

      // User role is default if not in user_roles? No, usually inserted.
      const { count: userRoleCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

      // Note: "user" role logic might be tricky if it's implicit. 
      // Current system seems to insert 'user' role explicitly?
      // If not, userCount = total - (admin + tutor + superadmin)

      return {
        totalUsers: total || 0,
        adminCount: (adminCount || 0) + (superadminCount || 0),
        tutorCount: tutorCount || 0,
        userCount: total ? (total - ((adminCount || 0) + (superadminCount || 0) + (tutorCount || 0))) : 0 // implicit users
      };
    }
  });
}
