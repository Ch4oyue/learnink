import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { uniqueChannelTopic } from "@/lib/realtime";

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
  labels?: string[];
  points?: number;
  is_premium?: boolean;
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

  // Set up realtime subscription for profiles and user_roles. Channel topics
  // must be unique per subscription (see src/lib/realtime.ts): this hook is
  // mounted more than once on the admin dashboard, directly and via
  // useUserStats.
  useEffect(() => {
    const profilesChannel = supabase
      .channel(uniqueChannelTopic('users-profiles-changes'))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel(uniqueChannelTopic('users-roles-changes'))
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
    queryKey: ['users', page, limit, search],
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
        .select('id, display_name, avatar_url, created_at, labels, points', { count: 'exact' });

      if (search) {
        query = query.ilike('display_name', `%${search}%`);
      }

      const { data: initialProfiles, error: profilesError, count: initialCount } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      let profiles = initialProfiles;
      let count = initialCount;

      if (profilesError) {
        logger.warn('Failed to fetch full profiles, falling back to basic fields', profilesError);
        // Fallback to basic fields if labels/points are missing
        const basicQuery = supabase
          .from('profiles')
          .select('id, display_name, avatar_url, created_at', { count: 'exact' });

        const { data: basicData, error: basicError, count: basicCount } = await basicQuery
          .order('created_at', { ascending: false })
          .range(from, to);

        if (basicError) throw basicError;
        profiles = basicData;
        count = basicCount;
      }

      // Get roles
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const roleMap = new Map<string, AppRole>();
      roles?.forEach(r => roleMap.set(r.user_id, r.role as AppRole));

      const users = (profiles || []).map(profile => {
        const p = profile as {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string | null;
          labels?: string[];
          points?: number;
          is_premium?: boolean;
        };
        return {
          id: p.id,
          email: null,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          created_at: p.created_at,
          role: roleMap.get(p.id) || 'user',
          labels: p.labels || [],
          points: p.points || 0,
          is_premium: p.is_premium || false,
        };
      });

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
  // Use the useUsers data to calculate stats (already bypasses RLS via Edge Function or fallback)
  const { data: usersData, isLoading, error } = useUsers(1, 1000); // Fetch all for stats

  const users = usersData?.users || [];

  const stats = {
    totalUsers: usersData?.meta?.total || users.length,
    adminCount: users.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
    tutorCount: users.filter(u => u.role === 'tutor').length,
    userCount: users.filter(u => u.role === 'user').length,
  };

  return { data: stats, isLoading, error };
}
