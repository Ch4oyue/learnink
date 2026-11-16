import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/contexts/AuthContext";
import { uniqueChannelTopic } from "@/lib/realtime";

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
      // The Edge Function is the only read path. It owns pagination and it is
      // the admin boundary; a client-side fallback would silently degrade to a
      // direct `profiles` + `user_roles` query that bypasses that boundary
      // whenever the function errors — including the 403 it returns to
      // non-admins. There is deliberately no fallback here.
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const { data, error } = await supabase.functions.invoke(
        `get-users?page=${page}&limit=${limit}${searchParam}`,
        { method: 'GET' }
      );

      if (error) throw error;
      if (!data || !data.users) {
        throw new Error('get-users returned no users payload');
      }
      return data as UsersResponse;
    },
    retry: 1,
  });
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
