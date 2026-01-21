import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/contexts/AuthContext";

// Super admin identification - IMPORTANT: Update SUPER_ADMIN_USER_ID after first login
// To find the user ID, run this SQL in Supabase: 
// SELECT id FROM auth.users WHERE email = 'agen.salva@gmail.com';
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
    queryFn: async () => {
      // Use the secure RPC function to fetch users with email (Admin only)
      const { data, error } = await supabase.rpc('get_users_for_admin');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // Map the response to match UserWithRole interface
      // The RPC returns email as text, and role as app_role type
      return (data || []).map(user => ({
        id: user.id,
        email: user.email || null,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        role: user.role as AppRole,
      })) as UserWithRole[];
    },
    // Only retry once to avoid spamming if not admin
    retry: 1,
  });
}

export function isSuperAdmin(user: { id: string; email?: string | null }): boolean {
  // Check by email (primary) or by ID (fallback)
  const emailMatch = user.email === SUPER_ADMIN_EMAIL;
  const idMatch = SUPER_ADMIN_USER_ID !== null && user.id === SUPER_ADMIN_USER_ID;

  return emailMatch || idMatch;
}

export function useUserStats() {
  const { data: users } = useUsers();

  const totalUsers = users?.length || 0;
  const adminCount = users?.filter(u => u.role === 'admin').length || 0;
  const tutorCount = users?.filter(u => u.role === 'tutor').length || 0;
  const userCount = users?.filter(u => u.role === 'user').length || 0;

  return {
    totalUsers,
    adminCount,
    tutorCount,
    userCount,
  };
}
